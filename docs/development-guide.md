# FurinaKit 开发指南

> 详细的开发流程和代码示例

---

## 目录

- [工具类型](#工具类型)
- [新增工具流程](#新增工具流程)
- [代码示例](#代码示例)
- [测试规范](#测试规范)
- [i18n 规范](#i18n-规范)

---

## 工具类型

| 类型 | 前端发送 | API 接收 | 示例 |
|------|----------|----------|------|
| 文本工具 | JSON | `application/json` | json-format, hash, uuid-gen |
| 单文件工具 | FormData | `file` key | image-compress, pdf-merge |
| 多文件工具 | FormData | `files` key | image-merge, pdf-split |

---

## 新增工具流程

### 步骤 1: 实现工具

创建 `src/lib/tools/<tool-name>.ts`：

```typescript
import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  // 定义输入参数
  text: z.string().min(1).max(10000),
  option: z.enum(['a', 'b']).default('a'),
});

const tool: Tool = {
  name: '<tool-name>',
  description: '工具描述',
  category: '<category>', // pdf/image/text/video/audio/dev/convert/file/craft
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const params = inputSchema.parse(input);

    try {
      // 实现逻辑
      const result = doSomething(params);

      // 返回文本结果
      return { text: JSON.stringify(result, null, 2) };

      // 或返回文件结果
      // return {
      //   data: buffer,
      //   mimeType: 'image/png',
      //   filename: 'output.png',
      // };
    } catch (e) {
      if (e instanceof ToolError) throw e;
      throw new ToolError(ErrorCode.INVALID_INPUT, `处理失败: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
```

### 步骤 2: 注册工具

在 `src/lib/tools/index.ts` 中添加：

```typescript
import './<tool-name>';
```

### 步骤 3: 创建 API 路由

创建 `src/app/api/<category>/<tool-name>/route.ts`：

**文本工具：**
```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('<tool-name>', { validate: true });
```

**文件工具：**
```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('<tool-name>', {
  parseFile: true,
  fieldTransforms: {
    quality: (v) => (v ? parseInt(v as string, 10) : 80),
  },
});
```

### 步骤 4: 添加 i18n 翻译

在 `src/lib/locales/zh.json`、`en.json`、`ja.json`、`ko.json` 中添加：

```json
{
  "tool.<name>": "工具名称",
  "tool.<name>.desc": "工具描述",
  "opt.<option>": "选项名称",
  "val.<value>": "值名称"
}
```

### 步骤 5: 编写测试

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
    const result = await tool!.execute({ text: 'test' });
    expect(result.text).toBeDefined();
  });

  it('should reject invalid input', async () => {
    await expect(tool!.execute({ text: '' })).rejects.toThrow();
  });
});
```

### 步骤 6: 验证

```bash
npx tsc --noEmit && npx vitest run
```

---

## 代码示例

### 文本工具示例 (uuid-gen)

```typescript
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { Tool, ToolResult, register } from '../registry';

const inputSchema = z.object({
  count: z.number().int().min(1).max(100).default(1),
});

const tool: Tool = {
  name: 'uuid-gen',
  description: 'Generate UUID v4 identifiers',
  category: 'dev',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { count } = inputSchema.parse(input);
    const uuids = Array.from({ length: count }, () => randomUUID());
    return { text: JSON.stringify({ count, uuids }, null, 2) };
  },
};

register(tool);
export default tool;
```

### 文件工具示例 (image-compress)

```typescript
import { z } from 'zod';
import sharp from 'sharp';
import { Tool, ToolResult, register } from '../registry';
import { ToolError, ErrorCode } from '../errors';

const inputSchema = z.object({
  file: z.instanceof(Buffer),
  quality: z.number().int().min(1).max(100).default(80),
});

const tool: Tool = {
  name: 'image-compress',
  description: 'Compress image file size',
  category: 'image',
  inputSchema,
  execute: async (input): Promise<ToolResult> => {
    const { file, quality } = inputSchema.parse(input);

    try {
      const result = await sharp(file)
        .jpeg({ quality })
        .toBuffer();

      return {
        data: result,
        mimeType: 'image/jpeg',
        filename: 'compressed.jpg',
      };
    } catch (e) {
      throw new ToolError(ErrorCode.INVALID_INPUT, `Image compression failed: ${(e as Error).message}`);
    }
  },
};

register(tool);
export default tool;
```

### API 路由示例

**文本工具路由：**
```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('hash', { validate: true });
```

**文件工具路由：**
```typescript
import { createToolRoute } from '@/lib/api-utils';
export const POST = createToolRoute('image-compress', {
  parseFile: true,
  fieldTransforms: {
    quality: (v) => (v ? parseInt(v as string, 10) : 80),
  },
});
```

---

## 测试规范

### 测试文件结构

```typescript
import { describe, it, expect } from 'vitest';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('tool-name tool', () => {
  const tool = getTool('tool-name');

  // 基本注册测试
  it('should be registered', () => {
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('tool-name');
    expect(tool?.category).toBe('category');
  });

  // 正常输入测试
  it('should process valid input', async () => {
    const result = await tool!.execute({ /* valid input */ });
    expect(result.text).toBeDefined();
  });

  // 边界值测试
  it('should handle edge cases', async () => {
    const result = await tool!.execute({ /* edge case input */ });
    expect(result.text).toBeDefined();
  });

  // 错误输入测试
  it('should reject invalid input', async () => {
    await expect(tool!.execute({ /* invalid input */ })).rejects.toThrow();
  });
});
```

### 文件工具测试

```typescript
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import '@/lib/tools';
import { getTool } from '@/lib/registry';

describe('image-compress tool', () => {
  const tool = getTool('image-compress');

  it('should compress image', async () => {
    // 创建测试图片
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer();

    const result = await tool!.execute({
      file: testImage,
      quality: 80,
    });

    expect(result.data).toBeInstanceOf(Buffer);
    expect(result.mimeType).toBe('image/jpeg');
  });
});
```

---

## i18n 规范

### Key 命名规则

| 前缀 | 用途 | 示例 |
|------|------|------|
| `tool.<name>` | 工具名称 | `tool.json-format` |
| `tool.<name>.desc` | 工具描述 | `tool.json-format.desc` |
| `opt.<name>` | 选项名称 | `opt.indent` |
| `val.<name>` | 值名称 | `val.spaces` |

### 翻译文件位置

```
src/lib/locales/
├── zh.json    # 中文
├── en.json    # English
├── ja.json    # 日本語
└── ko.json    # 한국어
```

### 检查完整性

```bash
node scripts/check_i18n.cjs
```

---

## 编码规范速查

- TypeScript strict 模式
- 错误用 `ToolError` + `ErrorCode`
- 日志用 `logger`（pino），不用 console
- API 响应：`{ success: true, data }` 或 `{ success: false, error }`
- 前端 `Link` 不用 `withBasePath()`，`fetch` 需要用
- 所有用户可见文字用 `t('key')` 国际化
- Select 组件必须设置默认值
