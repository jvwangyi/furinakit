# FurinaKit 开发指南

## 项目概览

- **原则**：精简、优美、使用友好、三端可用（CLI / API / Web）
- **技术栈**：Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui + Vitest + Playwright + Storybook
- **国际化**：zh / en / ja / ko 四语言
- **仓库**：https://github.com/jvwangyi/furinakit
- **在线**：http://8.130.38.139:9003/furinakit

---

## 工具开发流程

开发一个新工具必须完成以下 6 步，缺一不可：

### Step 0: 确定工具类型

工具类型决定前端发送方式和 API 接收方式：

| 类型 | 前端发送 | API 接收 | 示例 |
|------|----------|----------|------|
| 文本工具 | JSON `{text, ...options}` | `Content-Type: application/json` | json-format, hash, base64 |
| 单文件工具 | FormData `file` key | `parseFormDataFile` | image-compress, pdf-split |
| 多文件工具 | FormData `files` key | `parseFormDataInput` | pdf-merge, image-merge |
| 混合工具 | JSON（不是文件！） | `Content-Type: application/json` | markdown-to-pdf, text-diff |

**判断规则：**
- `category` 为 `text` / `dev` → 文本工具，走 JSON
- `category` 为 `convert` → **逐个判断**（`yaml-to-json` 走 JSON，`csv-to-excel` 走文件）
- 其他分类 → 一般走文件

**⚠️ convert 类工具必须在 `ToolPageContainer.tsx` 的 `isFileTool` 或 `isTextTool` 列表中注册，否则会走错发送路径。**

### Step 1: 实现工具

创建 `src/lib/tools/<tool-name>.ts`：

```typescript
import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  // 定义输入参数
});

const tool: Tool = {
  name: '<tool-name>',
  description: '工具描述',
  category: '<category>', // pdf | image | video | audio | text | dev | convert | file | craft
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const params = inputSchema.parse(input);
    // 实现逻辑，用 try/catch 包裹外部库调用
    return { data: result, mimeType: '...', filename: '...' };
  },
};

register(tool);
export default tool;
```

### Step 2: 创建 API 路由

**⚠️ 路由目录名不含分类前缀：** `pdf-compress` → `src/app/api/pdf/compress/route.ts`（不是 `api/pdf/pdf-compress`）

简单路由用工厂函数：
```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('<tool-name>', { validate: true });
```

复杂路由（多文件、ffmpeg）手写：
```typescript
import { parseInput, bufferToResponse, validateToolInput } from '@/lib/api-utils';

export async function POST(req) {
  const input = await parseInput(req);
  // parseFormDataInput 会自动将同名 files 收集为数组
  if (input.files && Array.isArray(input.files)) {
    input.files = input.files.map(f => Buffer.isBuffer(f) ? f : Buffer.from(f));
  }
  validateToolInput(tool, input);
  const result = await tool.execute(input);
  if (result.data) {
    return bufferToResponse(result.data, result.mimeType, result.filename);
  }
  return Response.json({ success: true, data: result });
}
```

### Step 3: 注册工具

在 `src/lib/tools/index.ts` 中添加：`import './<tool-name>';`

### Step 4: 添加 i18n 翻译

在 4 个语言文件中各添加 2 个 key：

| 文件 | Key 格式 |
|------|----------|
| `src/lib/locales/zh.json` | `"tool.<name>": "中文名"`, `"tool.<name>.desc": "描述"` |
| `src/lib/locales/en.json` | `"tool.<name>": "English Name"`, `"tool.<name>.desc": "Description"` |
| `src/lib/locales/ja.json` | `"tool.<name>": "日本語名"`, `"tool.<name>.desc": "説明"` |
| `src/lib/locales/ko.json` | `"tool.<name>": "한국어 이름"`, `"tool.<name>.desc": "설명"` |

**⚠️ key 名必须与工具 `name` 完全一致。4 个文件必须同步更新。验证：`node check_i18n.cjs`**

i18n 命名规范：

| 前缀 | 用途 | 示例 |
|------|------|------|
| `tool.<name>` | 工具名称 | `tool.pdf-compress` |
| `tool.<name>.desc` | 工具描述 | `tool.pdf-compress.desc` |
| `opt.<name>` | 选项标签 | `opt.quality` |
| `val.<name>` | 选项值 | `val.medium` |
| `term.<name>` | 术语解释 | `term.floyd_steinberg` |

**⚠️ 翻译里已带范围说明的，代码里不要再拼接：** `"opt.quality": "质量 (1-100)"` → `{t('opt.quality')}`（不是 `{t('opt.quality')} (1-100)`）

### Step 5: 编写测试

创建 `tests/tools/<tool-name>.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('<tool-name> tool', () => {
  const tool = getTool('<tool-name>');

  it('should be registered', () => {
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('<tool-name>');
    expect(tool?.category).toBe('<category>');
  });

  it('should process input correctly', async () => {
    const result = await tool!.execute({ /* 测试输入 */ });
    expect(result.data).toBeDefined();
  });

  it('should throw on invalid input', async () => {
    await expect(tool!.execute({ /* 无效输入 */ })).rejects.toThrow();
  });
});
```

**⚠️ 测试数据要求：** 用真实有效数据，不能太小（1x1 PNG 可能处理失败）。PDF 至少有完整结构。base64 要能正常解码。

### Step 6: 更新文档

| 文件 | 操作 |
|------|------|
| `README.md` | 在对应分类下添加工具行 |
| `CHANGELOG.md` | 记录新增 |
| `docs/project-structure.md` | 更新文件列表 |

---

## 验证清单

每个工具完成后必须通过三层验证：

### 第一层：API 层

- 路径正确：`/api/{category}/{toolName}`（`pdf-compress` → `/api/pdf/compress`）
- 参数名和类型匹配 Zod schema
- 返回格式正确：文本工具返回 `{success, data}`，文件工具返回二进制流

```bash
curl -X POST http://localhost:3000/api/text/json-format \
  -H 'Content-Type: application/json' \
  -d '{"text":"{\"a\":1}","indent":2}'
```

### 第二层：UI 层

- 页面加载正常（无 404/500）
- 参数控件显示正确
- 点击执行能调通 API（检查 Network 面板）
- 结果正确展示

**⚠️ 只测 API 不够！必须通过 UI 验证：** ToolPageContainer URL 拼接、ToolOptions 参数名、FormData key（`file` 还是 `files`）

### 第三层：文件层（文件类工具）

- Content-Type 和实际格式一致
- Content-Disposition 带正确文件名
- 下载按钮能触发下载，文件能正常打开
- 文件扩展名对应：

| mimeType | 扩展名 |
|----------|--------|
| `image/png` | `.png` |
| `image/jpeg` | `.jpeg` |
| `application/pdf` | `.pdf` |
| `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `.xlsx` |
| `image/x-icon` | `.ico` |

### 验证命令

```bash
npm run build          # 编译通过
npx vitest run         # 单元测试通过
npx playwright test    # E2E 测试通过
node check_i18n.cjs    # i18n 完整性
```

---

## 代码规范

- 不用 `any`（除 `tool.execute` 的 input，由 zod 处理）
- 不重复定义（常量放 `constants.ts`，类型放 `types/tool.ts`，工具函数放 `api-utils.ts`）
- 错误处理用 `ToolError` + `ErrorCode`，外部库调用用 try/catch 包裹
- 文件操作用 try/finally 确保清理临时文件
- 组件用 shadcn/ui 风格
- 文件下载：存 blob URL 到 result，不要自动下载（浏览器会拦截）
- 数组参数：FormData 中用 `JSON.stringify` 发送，后端自动 parse
- 路径拼接：统一用 `withBasePath()`（`src/lib/basePath.ts`），禁止硬编码 `/furinakit`

### 常见陷阱

**ToolOptions 参数名必须和 Zod schema 完全一致：**
- `pdf-rotate` 用 `rotation`（不是 `angle`）
- `text-case` 用 `case`（不是 `target`）
- `color-convert` 用 `color` + `from` + `to`（不是 `text`）
- `text-diff` 用 `oldText` + `newText`（不是 `text` + `text2`）
- `base-converter` 用 `fromBase` + `toBase`（不是 `from` + `to`）
- `audio-trim` 时间格式 `HH:MM:SS`（不是秒数）

**ToolPageContainer 特殊映射：**
- `text-diff`：主文本框 → `newText`，ToolOptions 处理 `oldText`
- `markdown-to-html`：主文本框 → `markdownInput` state
- `qrcode-gen`：主文本框 → `qrText` state

**fieldTransforms 双重解析：**
`parseFormDataFile` 已对非 File 值做了 `JSON.parse`，路由的 `fieldTransforms` 不要再无脑 `JSON.parse`。正确写法：
```typescript
pages: (v) => Array.isArray(v) ? v : (v ? JSON.parse(v as string) : [])
```

**文件上传 key：** 单文件用 `file`，多文件用 `files`（`pdf-merge`、`image-merge`、`image-to-pdf`）

---

## 测试规范

### E2E 测试

- 路径不要硬编码 `/furinakit/`，用 `playwright.config.ts` 的 `baseURL`
- `page.goto('/')` 而不是 `page.goto('/furinakit/')`
- 文件类工具建议补上上传+下载的 E2E 用例

### CLI 测试

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const CLI_PATH = path.join(__dirname, '../../cli/index.ts');

it('should show help', async () => {
  const { stdout } = await execAsync(`npx tsx ${CLI_PATH} --help`);
  expect(stdout).toContain('FurinaKit');
});
```

- Windows 下用命令行参数传输入（不要 pipe JSON）
- 测试超时：`it('...', async () => { ... }, 30000)`

### 测试覆盖

| 组件 | 文件 | 用例 |
|------|------|------|
| 工具实现 | 63 | 357 |
| E2E 测试 | 11 | 91 |
| CLI 测试 | 1 | 14 |
| Storybook | 15 | - |
| **总计** | **90** | **462** |

---

## 部署规范

### 环境要求

- Node.js 22+
- ffmpeg（音视频工具必须）
- `/data/` 目录可写权限（stats、recent-tools、feedback 存这里）

### basePath 逻辑

```typescript
// src/lib/basePath.ts — 所有路径拼接用这个
import { basePath, withBasePath } from '@/lib/basePath';
const iconPath = withBasePath('/furina.jpg');  // → '/furinakit/furina.jpg'
const cookiePath = basePath || '/';            // → '/furinakit'
```

- CI 环境：`basePath: ''`（根路径）
- 生产环境：`basePath: '/furinakit'`
- **禁止硬编码 `/furinakit`**——CI 环境会 404

### API 路由注意事项

- 文件大小限制：`api-utils.ts` 的 `MAX_FILE_SIZE`（图片 20MB / PDF 50MB / 音视频 200MB）
- 并发写入：`recent-tools` 和 `stats` 已有 `writeLock` mutex，新增写文件路由需参考
- 临时文件：`createTempDir` 自带 5 分钟清理，ffmpeg 长任务需加大超时或在 finally 中手动清理

---

## 项目维护

### Git 工作流

**分支命名：** `feat/<name>` | `fix/<name>` | `docs/<name>` | `chore/<name>`

**Commit 格式（Conventional Commits）：**
```
feat: add csv-to-excel tool
fix: resolve PDF merge page order issue
docs: update project structure
chore: clean up redundant files
```

**PR 流程：** 分支 → 开发 → `npm test && npm run build` → 创建 PR → CI 通过 → 合并

### 版本发布

1. 更新 `CHANGELOG.md`
2. 更新 `package.json` 版本号（semver）
3. 提交推送
4. 打 tag：`git tag v0.2.0 && git push --tags`

### 依赖维护

```bash
npm audit       # 安全漏洞
npm outdated    # 可升级的包
npm update      # 升级 minor/patch
npm run build   # 验证构建
npm test        # 验证测试
```

核心依赖（sharp/pdf-lib/fluent-ffmpeg/next）升级前先本地完整验证。

### 定期检查

```bash
node check_i18n.cjs    # i18n 完整性
npm test               # 测试通过
npm run build          # 构建成功
npm audit              # 依赖安全
```

### 文档维护

#### 新增工具时更新：

| 文件 | 操作 |
|------|------|
| `src/lib/tools/<name>.ts` | 工具实现 |
| `src/app/api/<cat>/<name>/route.ts` | API 路由 |
| `src/lib/tools/index.ts` | 注册 |
| `src/lib/locales/*.json` × 4 | i18n 翻译 |
| `tests/tools/<name>.test.ts` | 测试 |
| `ToolPageContainer.tsx` | convert 类加入列表 |
| `README.md` | 工具列表 |
| `CHANGELOG.md` | 变更记录 |
| `docs/project-structure.md` | 文件结构 |

#### 删除工具时：

反向执行以上步骤（删除文件 → 移除 import → 移除翻译 → 移除测试 → 更新文档）

#### 新增工具分类时：

1. `src/types/tool.ts` — `Tool.category` 添加新值
2. `src/lib/constants.ts` — `categoryKeys` 添加
3. `src/lib/locales/*.json` × 4 — 添加 `cat.<name>` 翻译
4. `src/components/layout/Sidebar.tsx` — 添加分类图标
5. `src/components/layout/MobileNav.tsx` — 添加移动端导航
6. `README.md` — 添加分类折叠区块
7. `docs/project-structure.md` — 更新

#### 修改工具参数时：

参数名变更必须同步前后端：工具 schema → API route → ToolOptions UI → 测试

#### 文件/目录重命名时：

1. 全局搜索旧路径，更新所有 import
2. 更新 `docs/project-structure.md`
3. 更新 `.gitignore`（如涉及目录变更）
4. `npm run build` 验证无断裂引用

#### 提交前检查清单：

- [ ] `node check_i18n.cjs` 通过
- [ ] `npm test` 通过
- [ ] `npm run build` 通过
- [ ] README.md 工具数量正确
- [ ] CHANGELOG.md 记录了本次变更
- [ ] docs/project-structure.md 反映最新结构
