# 贡献指南

感谢你对 FurinaKit 项目的关注！我们欢迎任何形式的贡献。

## 📋 目录

- [行为准则](#行为准则)
- [如何贡献](#如何贡献)
- [开发环境](#开发环境)
- [提交规范](#提交规范)
- [添加新工具](#添加新工具)
- [报告问题](#报告问题)

---

## 行为准则

本项目采用 Contributor Covenant 行为准则。请在参与项目前阅读 [行为准则](CODE_OF_CONDUCT.md)。

---

## 如何贡献

### 报告 Bug

1. 检查 [Issues](https://github.com/jvwangyi/furinakit/issues) 确认问题未被报告
2. 创建新的 Issue，使用 Bug 报告模板
3. 提供详细的复现步骤和环境信息

### 建议功能

1. 在 [Issues](https://github.com/jvwangyi/furinakit/issues) 中创建功能请求
2. 描述功能的使用场景和预期行为
3. 等待社区讨论和反馈

### 提交代码

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 创建 Pull Request

---

## 开发环境

### 环境要求

- Node.js 18+
- npm / yarn / pnpm
- Git
- FFmpeg (视频/音频工具开发需要)

### 安装步骤

```bash
# 1. Fork 并克隆仓库
git clone https://github.com/你的用户名/furinakit.git
cd furinakit

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 运行测试
npm test

# 5. 启动 Storybook
npm run storybook
```

### 项目结构

```
furinakit/
├── src/
│   ├── app/          # Next.js 页面和 API 路由
│   ├── components/   # React 组件
│   ├── lib/          # 核心库和工具实现
│   └── types/        # TypeScript 类型定义
├── tests/            # 单元测试
├── e2e/              # E2E 测试
└── docs/             # 文档
```

---

## 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 类型 (type)

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式调整 |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `chore` | 构建/工具变更 |

### 示例

```bash
feat(pdf): add PDF merge tool
fix(image): fix compress quality issue
docs(readme): update installation guide
test(hash): add SHA-512 test cases
```

---

## 添加新工具

### 步骤 1: 确定工具类型

| 类型 | 前端发送 | API 接收 |
|------|----------|----------|
| 文本工具 | JSON | `application/json` |
| 单文件工具 | FormData | `file` key |
| 多文件工具 | FormData | `files` key |

### 步骤 2: 实现工具

创建 `src/lib/tools/<tool-name>.ts`：

```typescript
import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  // 定义输入参数
});

const tool: Tool = {
  name: '<tool-name>',
  description: '工具描述',
  category: '<category>',
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

### 步骤 3: 创建 API 路由

创建 `src/app/api/<category>/<tool-name>/route.ts`：

```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('<tool-name>', { validate: true });
```

### 步骤 4: 注册工具

在 `src/lib/tools/index.ts` 中添加：

```typescript
import './<tool-name>';
```

### 步骤 5: 添加 i18n 翻译

在 4 个语言文件中添加：

```json
{
  "tool.<name>": "工具名称",
  "tool.<name>.desc": "工具描述"
}
```

### 步骤 6: 编写测试

创建 `tests/tools/<tool-name>.test.ts`：

```typescript
import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('<tool-name> tool', () => {
  const tool = getTool('<tool-name>');

  it('should be registered', () => {
    expect(tool).toBeDefined();
  });

  it('should process input correctly', async () => {
    const result = await tool!.execute({ /* 测试输入 */ });
    expect(result.data).toBeDefined();
  });
});
```

---

## 报告问题

### Bug 报告模板

```markdown
**描述**
简要描述问题

**复现步骤**
1. 打开 '...'
2. 点击 '...'
3. 滚动到 '...'
4. 看到错误

**预期行为**
描述你期望的行为

**截图**
如果适用，添加截图

**环境信息**
- 操作系统: [例如 Windows 11]
- 浏览器: [例如 Chrome 120]
- Node.js 版本: [例如 20.10.0]
```

### 功能请求模板

```markdown
**功能描述**
简要描述你想要的功能

**使用场景**
描述这个功能解决什么问题

**替代方案**
描述你考虑过的其他解决方案

**附加信息**
任何其他相关信息
```

---

## 代码审查

所有提交都需要通过代码审查：

1. 确保代码符合项目规范
2. 确保所有测试通过
3. 确保没有 TypeScript 错误
4. 确保 i18n 完整（4 种语言）

---

## 联系方式

如有任何问题，请通过以下方式联系：

- [GitHub Issues](https://github.com/jvwangyi/furinakit/issues)
- [Email](mailto:your-email@example.com)

---

**感谢你的贡献！** 🎉
