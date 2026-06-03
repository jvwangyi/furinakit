# FurinaKit 开发指南

## 项目原则

- **精简**：代码不冗余，不重复定义，能用一行解决不用三行
- **优美**：UI 美观，代码结构清晰，命名规范
- **使用友好**：错误提示清晰，交互直觉化，多语言支持
- **三端可用**：CLI / API / 网页三端体验一致

## 技术栈

- Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- Vitest（单元测试）、Playwright（E2E 测试）
- Storybook（组件文档）
- 国际化：zh / en / ja / ko 四语言

## 工具开发流程

开发一个新工具必须完成以下 5 步，缺一不可：

### Step 0: 确定工具分类

工具类型决定前端发送方式和 API 接收方式：

| 类型 | 前端发送 | API 接收 | 示例 |
|------|----------|----------|------|
| 文本工具 | JSON `{text, ...options}` | `Content-Type: application/json` | json-format, hash, base64 |
| 单文件工具 | FormData `file` key | `parseFormDataFile` 或 `parseFile: true` | image-compress, pdf-split |
| 多文件工具 | FormData `files` key | `parseFormDataInput`（自动收集同名 key 为数组） | pdf-merge, image-merge |
| 混合工具 | JSON（不是文件！） | `Content-Type: application/json` | markdown-to-pdf, text-diff |

**⚠️ 关键判断规则：**
- `category === 'text'` → 文本工具，走 JSON
- `category === 'dev'` → 文本工具，走 JSON
- `category === 'convert'` → **需要逐个判断**，不是所有都走文件！
  - `yaml-to-json`、`xml-to-json`、`markdown-to-pdf` → 走 JSON
  - `csv-to-excel`、`image-to-pdf`、`base64-to-image` → 走文件
- 其他分类 → 一般走文件

**新增 convert 类工具时，必须检查：**
1. `ToolPageContainer.tsx` 的 `isFileTool` 列表
2. `ToolPageContainer.tsx` 的 `isTextTool` 列表
3. 确保工具在其中一个列表中，不能两个都不在

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
    // 实现逻辑
    return { data: result, mimeType: '...', filename: '...' };
  },
};

register(tool);
export default tool;
```

### Step 2: 创建 API 路由

创建 `src/app/api/<category>/<tool-name>/route.ts`：

```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('<tool-name>', { validate: true });
```

简单路由用工厂函数，复杂路由（多文件、ffmpeg）手写。

**⚠️ 路由目录名不含分类前缀：**
- 工具名 `pdf-compress` → 路由路径 `src/app/api/pdf/compress/route.ts`
- 不是 `src/app/api/pdf/pdf-compress/route.ts`

**多文件工具路由示例：**
```typescript
// src/app/api/pdf/merge/route.ts（手写，不用 createToolRoute）
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

在 `src/lib/tools/index.ts` 中添加：
```typescript
import './<tool-name>';
```

### Step 4: 添加 i18n 翻译

在 4 个语言文件中各添加 2 个 key：

- `src/lib/locales/zh.json`: `"tool.<name>": "中文名"`, `"tool.<name>.desc": "中文描述"`
- `src/lib/locales/en.json`: `"tool.<name>": "English Name"`, `"tool.<name>.desc": "Description"`
- `src/lib/locales/ja.json`: `"tool.<name>": "日本語名"`, `"tool.<name>.desc": "説明"`
- `src/lib/locales/ko.json`: `"tool.<name>": "한국어 이름"`, `"tool.<name>.desc": "설명"`

**⚠️ 常见错误（必须避免）：**
- key 名必须与工具的 `name` 属性完全一致（如 `tool.csv-to-excel`，不是 `tool.excel-to-csv`）
- 不要用 PowerShell 的 `Set-Content -Encoding UTF8` 写 JSON 文件（会加 BOM 导致损坏）
- 用 Node.js 或编辑器写入：`fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')`
- 每次添加后用 `node -e "JSON.parse(require('fs').readFileSync('file.json','utf8'))"` 验证 JSON 有效性
- 不要跳过任何语言——4 个文件必须同步更新

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

  // 正常路径测试
  it('should process input correctly', async () => {
    const result = await tool!.execute({ /* 测试输入 */ });
    expect(result.data).toBeDefined();
  });

  // 错误路径测试
  it('should throw on invalid input', async () => {
    await expect(tool!.execute({ /* 无效输入 */ })).rejects.toThrow();
  });
});
```

## 验证清单

每个工具完成后必须通过**三层验证**，缺一不可：

### 第一层：API 层
直接调后端接口，确认：
- 路径正确（`/api/{category}/{toolName}`，注意工具名去掉分类前缀，如 `pdf-compress` → `/api/pdf/compress`）
- 参数名和类型匹配 Zod schema
- 返回格式正确（JSON 文本工具返回 `{success, data}`，文件工具返回二进制流）

```bash
curl -X POST http://localhost:3000/api/text/json-format \
  -H 'Content-Type: application/json' \
  -d '{"text":"{\"a\":1}","indent":2}'
```

### 第二层：UI 层
通过浏览器前端操作，确认：
- 页面加载正常（无 404/500）
- 参数控件（Select/Input/Switch）显示正确
- 点击执行按钮能调通 API（检查 Network 面板请求 URL 和 body）
- 结果正确展示（JSON 树/文本/下载按钮）

**⚠️ 只测 API 不够！必须通过 UI 点击执行验证：**
- ToolPageContainer 拼接的 URL 是否正确（去掉分类前缀）
- ToolOptions 发送的参数名是否和 API schema 一致
- FormData key 是 `file` 还是 `files`

### 第三层：文件层（文件类工具）
- Content-Type 和实际格式一致（`image/png`、`application/pdf` 等）
- Content-Disposition 带正确文件名（`attachment; filename="xxx.ext"`）
- 下载按钮能触发下载，下载的文件能正常打开
- **文件扩展名和 Content-Type 对应：**
  - `image/png` → `.png`
  - `image/jpeg` → `.jpeg`
  - `application/pdf` → `.pdf`
  - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` → `.xlsx`
  - `image/x-icon` → `.ico`

```bash
npm run build          # 编译通过
npx vitest run         # 单元测试通过
npx playwright test    # E2E 测试通过（如适用）
```

验证 i18n 完整性：
```bash
node check_i18n.cjs    # 检查所有工具是否有翻译
```

## ⚠️ 已知陷阱（必须避免）

### URL 路径
- 路由目录名不含分类前缀：`src/app/api/pdf/compress/route.ts` → `/api/pdf/compress`
- 不是 `/api/pdf/pdf-compress`（多一个前缀会 404）
- ToolPageContainer 拼接规则：`/api/${category}/${toolName.replace(category + '-', '')}`

### 文件上传
- 单文件工具用 `file` key：`formData.append('file', file)`
- 多文件工具用 `files` key：`formData.append('files', file1); formData.append('files', file2)`
- 多文件工具：`pdf-merge`、`image-merge`、`image-to-pdf`

### 数组参数
- ToolOptions 中数组参数（如 pages）用 `JSON.stringify(value)` 发送
- 后端 `parseFormDataFile` 会自动 `JSON.parse` 还原
- 路由 fieldTransforms 需兼容已解析的数组：`Array.isArray(v) ? v : JSON.parse(v)`
- `parseFormDataFile` 对同名 key 只保留最后一个，多值必须用 JSON 数组

### 文件下载
- 二进制响应不要用自动下载（浏览器可能拦截弹窗）
- 存 blob URL 到 result，让 ToolResult 显示手动下载按钮
- 用户点击下载按钮触发 `a.click()`

### 文件格式对应
- 工具 execute 返回的 `mimeType` 必须和实际输出格式一致
- `bufferToResponse` 的第三个参数 `filename` 必须带正确扩展名
- 常见对应：
  - Sharp 输出 PNG → `mimeType: 'image/png'`, `filename: 'xxx.png'`
  - Sharp 输出 JPEG → `mimeType: 'image/jpeg'`, `filename: 'xxx.jpeg'`
  - pdf-lib 输出 → `mimeType: 'application/pdf'`, `filename: 'xxx.pdf'`
  - ico 输出 → `mimeType: 'image/x-icon'`, `filename: 'xxx.ico'`
  - xlsx 输出 → `mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'`, `filename: 'xxx.xlsx'`

### ToolOptions 参数名
- 不同工具参数名不同，必须和 Zod schema 完全一致
- 常见易错：
  - `pdf-rotate` 用 `rotation`（不是 `angle`）
  - `text-case` 用 `case`（不是 `target`）
  - `color-convert` 用 `color` + `from` + `to`（不是 `text`）
  - `text-diff` 用 `oldText` + `newText`（不是 `text` + `text2`）
  - `base-converter` 用 `fromBase` + `toBase`（不是 `from` + `to`）
  - `audio-trim` 时间格式 `HH:MM:SS`（不是秒数）

### ToolPageContainer 特殊处理
- `text-diff`：主文本框映射为 `newText`（不是 `text`），ToolOptions 处理 `oldText`
- `markdown-to-html`：主文本框内容由 `markdownInput` state 提供
- `qrcode-gen`：主文本框内容由 `qrText` state 提供
- 新增双输入工具时，检查是否需要特殊映射

### isTextTool / isFileTool 列表
- `ToolPageContainer.tsx` 中有两个列表决定工具的发送方式
- 新增 convert 类工具时**必须**手动加入其中一个列表
- 两个都不在 → 会走 FormData 默认路径，JSON 工具会报错

### fieldTransforms 双重解析
- `parseFormDataFile` 已经对非 File 值做了 `JSON.parse`
- 路由的 `fieldTransforms` 不要再无脑 `JSON.parse`
- 正确写法：`pages: (v) => Array.isArray(v) ? v : (v ? JSON.parse(v as string) : [])`
- 直接 `JSON.parse(v)` 会对已解析的数组执行 `JSON.parse([1])` → 变成 `1`，丢失数据

### 测试数据
- 用真实有效的测试数据，不能用太小的假数据
- 1x1 像素 PNG 可能太小导致某些工具处理失败
- PDF 测试文件至少要有完整的结构（Catalog + Pages + Page）
- base64 测试数据要能正常解码为有效文件

### i18n
- key 名必须与工具的 `name` 属性完全一致（如 `tool.csv-to-excel`，不是 `tool.excel-to-csv`）
- 不要用 PowerShell 的 `Set-Content -Encoding UTF8` 写 JSON 文件（会加 BOM 导致损坏）
- 用 Node.js 或编辑器写入：`fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8')`
- 每次添加后用 `node -e "JSON.parse(require('fs').readFileSync('file.json','utf8'))"` 验证 JSON 有效性
- 不要跳过任何语言——4 个文件必须同步更新

## 代码规范

- 不用 `any`（除 tool.execute 的 input，由 zod 处理）
- 不重复定义（常量放 `constants.ts`，类型放 `types/tool.ts`，工具函数放 `api-utils.ts`）
- 错误处理用 `ToolError` + `ErrorCode`
- 文件操作用 try/finally 确保清理临时文件
- 组件用 shadcn/ui 风格
- 文件下载：存 blob URL 到 result，不要自动下载（浏览器会拦截）
- 数组参数：FormData 中用 `JSON.stringify` 发送，后端自动 parse

## 部署规范

### 服务器环境要求
- Node.js 22+
- ffmpeg（音视频工具必须，`apt install ffmpeg` 或 `brew install ffmpeg`）
- `/data/` 目录需要可写权限（stats、recent-tools、feedback 存这里）

### basePath 逻辑
- `next.config.ts` 中根据 `process.env.CI` 动态切换：
  - CI 环境：`basePath: ''`（根路径）
  - 生产环境：`basePath: '/furinakit'`
- **新增路由/cookie 时必须跟随这个逻辑**，不能硬编码 `/furinakit`

### Cookie path
- `recent-tools` 等路由的 cookie `path` 必须和 basePath 一致
- CI 环境 cookie path 为 `/`，生产环境为 `/furinakit`
- 硬编码会导致 CI/E2E 环境 cookie 设不上，功能失效

## i18n Key 命名规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `tool.<name>` | 工具名称 | `tool.pdf-compress` |
| `tool.<name>.desc` | 工具描述 | `tool.pdf-compress.desc` |
| `opt.<name>` | 选项标签 | `opt.quality` |
| `val.<name>` | 选项值 | `val.medium` |
| `term.<name>` | 术语解释 | `term.floyd_steinberg` |

**⚠️ 翻译里已经带了范围说明的，代码里不要再手动拼接：**
- ✅ `"opt.quality": "质量 (1-100)"` → 代码写 `{t('opt.quality')}`
- ❌ `{t('opt.quality')} (1-100)` → 会显示 "质量 (1-100) (1-100)"

## API 路由维护注意

### 文件大小限制
- 文件上传路由需要校验文件大小，防止 OOM
- 在 `api-utils.ts` 中统一加 `MAX_FILE_SIZE` 检查
- 建议限制：图片 20MB、PDF 50MB、音视频 200MB

### 并发写入保护
- 写文件的路由（stats/recent-tools）并发时需要 mutex
- `recent-tools` 已有 `writeLock` 实现，`stats` 还没有
- 新增写文件路由时参考 `recent-tools` 的 mutex 模式

### 临时文件清理
- `createTempDir` 自带 5 分钟 `setTimeout` 清理
- ffmpeg 长任务（超过 5 分钟）会被误删 → 加大超时或在 finally 中手动清理
- 路由中用 `try/finally` 确保异常时也能清理

## E2E 测试规范

- 路径不要硬编码 `/furinakit/`，用 `playwright.config.ts` 的 `baseURL` 自动处理
- `page.goto('/')` 而不是 `page.goto('/furinakit/')`
- 文件类工具目前 E2E 没覆盖，新增文件工具时建议补上上传+下载的 E2E 用例

## CLI 测试规范

CLI 测试位于 `tests/cli/cli.test.ts`，使用 `exec` 调用 CLI 命令：

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const CLI_PATH = path.join(__dirname, '../../cli/index.ts');

// 测试示例
it('should show help', async () => {
  const { stdout } = await execAsync(`npx tsx ${CLI_PATH} --help`);
  expect(stdout).toContain('FurinaKit');
});
```

**注意事项：**
- Windows 环境下 `echo '{"json":1}' | npx tsx ...` 会破坏 JSON（单引号问题）
- 改用命令行参数传递输入：`npx tsx ${CLI_PATH} text hash -t "Hello World"`
- 测试超时设置：`it('...', async () => { ... }, 30000)`

## 测试覆盖统计

| 组件 | 测试文件 | 测试用例 |
|------|----------|----------|
| 工具实现 | 62 个 | 346 个 |
| E2E 测试 | 11 个 | 50 个 |
| CLI 测试 | 1 个 | 14 个 |
| Storybook | 15 个 | - |
| **总计** | **89 个** | **410 个** |

## 项目维护

维护计划文档：`MAINTENANCE_PLAN.md`

**定期检查项：**
- 运行 `node check_i18n.cjs` 检查 i18n 完整性
- 运行 `npm test` 确保所有测试通过
- 运行 `npm run build` 确保构建成功
- 检查 GitHub Actions CI 状态

**GitHub 仓库：** https://github.com/jvwangyi/furinakit
**在线体验：** http://8.130.38.139:9003/furinakit
