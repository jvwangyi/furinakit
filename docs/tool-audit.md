# FurinaKit 工具 UI 审查报告

审查时间：2026-06-02
审查工具总数：64

## 审查方法

基于以下代码分析：
- `ToolPageContainer.tsx`：`isFileTool` / `isTextTool` 判断逻辑
- `ToolOptions.tsx`：switch-case 覆盖的工具选项
- `zh.json` / `en.json`：i18n key 存在性
- 各工具 `inputSchema`：参数定义

## 核心逻辑

```javascript
// 文件工具判断
isFileTool = category === 'pdf' || 'image' || 'audio' || 'video' ||
  ['image-to-pdf','csv-to-excel','excel-to-csv','markdown-to-pdf','image-to-base64','base64-to-image','file-info','file-hash']

// 文本工具判断
isTextTool = category === 'text' || (category === 'dev' && !file-info && !file-hash) ||
  (category === 'convert' && ['yaml-to-json','xml-to-json'])

// 无文本输入的工具
noTextInput = ['uuid-gen','password-gen','color-convert']
```

---

## 按分类审查结果

### PDF（10 个）

| 工具 | 类型 | i18n | 文件上传 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| pdf-merge | 文件 | ✅ | ✅ | N/A | - |
| pdf-split | 文件 | ✅ | ✅ | ✅ pages | - |
| pdf-compress | 文件 | ✅ | ✅ | ✅ quality | - |
| pdf-to-image | 文件 | ✅ | ✅ | ✅ page/format/scale | - |
| pdf-rotate | 文件 | ✅ | ✅ | ✅ rotation/pages | - |
| pdf-extract-pages | 文件 | ✅ | ✅ | ✅ pages_range | - |
| pdf-encrypt | 文件 | ✅ | ✅ | ✅ password/ownerPassword | - |
| pdf-watermark | 文件 | ✅ | ✅ | ✅ text/fontSize/opacity/color/position | - |
| pdf-add-page-numbers | 文件 | ✅ | ✅ | ❌ **缺失** | 需要 position、fontSize 选项 |
| pdf-delete-pages | 文件 | ✅ | ✅ | ❌ **缺失** | 需要 pages 选项 |

### Image（8 个）

| 工具 | 类型 | i18n | 文件上传 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| image-resize | 文件 | ✅ | ✅ | ✅ width/height | - |
| image-crop | 文件 | ✅ | ✅ | ✅ 可视化裁剪 | - |
| image-convert | 文件 | ✅ | ✅ | ✅ format/quality | - |
| image-compress | 文件 | ✅ | ✅ | ✅ quality/format | - |
| image-rotate | 文件 | ✅ | ✅ | ✅ angle/flip | - |
| image-merge | 文件 | ✅ | ✅ | ✅ direction/background | - |
| image-add-watermark | 文件 | ✅ | ✅ | ✅ text/position/opacity/fontSize/color | - |
| image-to-ico | 文件 | ✅ | ✅ | ✅ size | - |

### Text（13 个）

| 工具 | 类型 | i18n | 文本输入 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| json-format | 文本 | ✅ | ✅ | ✅ indent | - |
| text-diff | 文本 | ✅ | ✅ | ✅ oldText/mode | - |
| base64 | 文本 | ✅ | ✅ | ✅ action | - |
| hash | 文本 | ✅ | ✅ | ✅ algorithm | - |
| url-encode | 文本 | ✅ | ✅ | ✅ action/component | - |
| json-to-csv | 文本 | ✅ | ✅ | ✅ delimiter | - |
| csv-to-json | 文本 | ✅ | ✅ | ✅ delimiter | - |
| json-to-yaml | 文本 | ✅ | ✅ | ✅ indent | - |
| json-to-xml | 文本 | ✅ | ✅ | ✅ rootName/indent | - |
| markdown-to-html | 文本 | ✅ | ✅ (MarkdownPreview) | ✅ gfm/breaks | - |
| regex-tester | 文本 | ✅ | ✅ | ✅ pattern/flags | - |
| text-case | 文本 | ✅ | ✅ (auto-submit) | ✅ case | - |
| text-count | 文本 | ✅ | ✅ (auto-submit) | N/A | - |

### Dev（15 个）

| 工具 | 类型 | i18n | 输入方式 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| jwt-decode | 文本 | ✅ | ✅ 文本 | N/A | - |
| timestamp | 文本 | ✅ | ✅ 文本 (auto-submit) | ✅ mode/format | - |
| sql-format | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 language、indent 选项 |
| uuid-gen | 文本 | ✅ | 无输入 (auto-submit) | ✅ count | - |
| password-gen | 文本 | ✅ | 无输入 (auto-submit) | ✅ length/count/字符类型 | - |
| qrcode-gen | 文本 | ✅ | ✅ 专用输入 | ✅ format/size/errorCorrection | - |
| color-convert | 文本 | ✅ | 无输入 | ✅ color/from/to | - |
| css-format | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 indent 选项 |
| js-format | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 indent 选项 |
| html-format | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 indent 选项 |
| cron-gen | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 minute/hour/dayOfMonth/month/dayOfWeek |
| cron-parser | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 expression/count 选项 |
| url-parser | 文本 | ✅ | ✅ 文本 | N/A | - |
| base-converter | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 fromBase/toBase 选项 |
| lorem-gen | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 paragraphs/sentencesPerParagraph 选项 |
| file-info | 文件 | ✅ | ✅ 文件上传 | N/A | - |
| file-hash | 文件 | ✅ | ✅ 文件上传 | ✅ algorithm | - |

### Convert（8 个）

| 工具 | 类型 | i18n | 输入方式 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| image-to-pdf | 文件 | ✅ | ✅ 文件上传 | ❌ **缺失** | 需要 pageSize 选项 |
| csv-to-excel | 文件 | ⚠️ | ✅ 文件上传 | ❌ **缺失** | i18n 错误 + 缺少 delimiter/header/sheetName |
| yaml-to-json | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 indent 选项 |
| xml-to-json | 文本 | ✅ | ✅ 文本 | ❌ **缺失** | 需要 indent/ignoreAttributes/attributeNamePrefix |
| excel-to-csv | 文件 | ✅ | ✅ 文件上传 | ❌ **缺失** | 需要 sheetIndex/delimiter 选项 |
| markdown-to-pdf | 文件 | ✅ | ✅ 文件上传 | ❌ **缺失** | 需要 fontSize/margin 选项 |
| image-to-base64 | 文件 | ✅ | ✅ 文件上传 | ❌ **缺失** | 需要 outputFormat/addDataUri 选项 |
| base64-to-image | 文件 | ✅ | ✅ 文件上传 | ❌ **缺失** | 需要 format 选项 |

### File（2 个）

| 工具 | 类型 | i18n | 文件上传 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| file-info | 文件 | ✅ | ✅ | N/A | - |
| file-hash | 文件 | ✅ | ✅ | ✅ algorithm | - |

### Audio（2 个）

| 工具 | 类型 | i18n | 文件上传 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| audio-convert | 文件 | ✅ | ✅ | ❌ **缺失** | 需要 format/quality 选项 |
| audio-trim | 文件 | ✅ | ✅ | ❌ **缺失** | 需要 startTime/endTime/duration 选项 |

### Video（3 个）

| 工具 | 类型 | i18n | 文件上传 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| video-to-audio | 文件 | ✅ | ✅ | ✅ format/quality | - |
| video-compress | 文件 | ✅ | ✅ | ✅ quality/maxWidth | - |
| video-trim | 文件 | ✅ | ✅ | ✅ startTime/endTime | - |

### Craft（1 个）

| 工具 | 类型 | i18n | 输入方式 | 参数 UI | 问题 |
|------|------|------|----------|---------|------|
| perler-beads | 自定义页面 | ✅ | ✅ 专用上传 | ✅ 专用 UI | - |

---

## 发现的问题汇总

### 🔴 问题 1：csv-to-excel i18n 错误（zh.json + en.json）

**zh.json：**
```json
"tool.csv-to-excel": "Excel 转 CSV",        // ❌ 应为 "CSV 转 Excel"
"tool.csv-to-excel.desc": "将 Excel 文件转为 CSV 格式"  // ❌ 应为 "将 CSV 文件转为 Excel 格式"
```

**en.json：**
```json
"tool.csv-to-excel": "Excel to CSV",                    // ❌ 应为 "CSV to Excel"
"tool.csv-to-excel.desc": "Convert Excel file to CSV format"  // ❌ 应为 "Convert CSV file to Excel format"
```

**原因：** 从 excel-to-csv 复制粘贴时未修改。

**修复：**
```json
// zh.json
"tool.csv-to-excel": "CSV 转 Excel",
"tool.csv-to-excel.desc": "将 CSV 文件转为 Excel 格式"

// en.json
"tool.csv-to-excel": "CSV to Excel",
"tool.csv-to-excel.desc": "Convert CSV file to Excel format"
```

### 🔴 问题 2：20 个工具缺少 ToolOptions 参数 UI

以下工具的 `inputSchema` 定义了可配置参数，但 `ToolOptions.tsx` 中没有对应的 case，导致用户无法在 UI 上配置这些参数（只能使用默认值）：

| # | 工具 | 缺失参数 | 严重度 |
|---|------|----------|--------|
| 1 | pdf-add-page-numbers | position, fontSize | 中 |
| 2 | pdf-delete-pages | pages | **高** - 必填参数，无 UI 则无法使用 |
| 3 | sql-format | language, indent | 中 |
| 4 | css-format | indent | 低 - 有默认值 |
| 5 | js-format | indent | 低 - 有默认值 |
| 6 | html-format | indent | 低 - 有默认值 |
| 7 | cron-gen | minute, hour, dayOfMonth, month, dayOfWeek | **高** - 核心功能参数 |
| 8 | cron-parser | expression, count | **高** - 但 expression 通过 textInput 传入 |
| 9 | base-converter | fromBase, toBase | **高** - 核心功能参数 |
| 10 | lorem-gen | paragraphs, sentencesPerParagraph | 中 |
| 11 | image-to-pdf | pageSize | 中 |
| 12 | csv-to-excel | delimiter, header, sheetName | 中 |
| 13 | yaml-to-json | indent | 低 - 有默认值 |
| 14 | xml-to-json | indent, ignoreAttributes, attributeNamePrefix | 中 |
| 15 | excel-to-csv | sheetIndex, delimiter | 中 |
| 16 | markdown-to-pdf | fontSize, margin | 中 |
| 17 | image-to-base64 | outputFormat, addDataUri | 中 |
| 18 | base64-to-image | format | 中 |
| 19 | audio-convert | format, quality | 中 |
| 20 | audio-trim | startTime, endTime, duration | **高** - 必填参数 |

**注意：** `cron-parser` 的 `expression` 通过文本输入框传入（作为 `text`），但 `count` 参数无法配置。`base-converter` 的 `value` 通过文本输入传入，但 `fromBase` 和 `toBase` 无法配置。

### 🔴 问题 3：5 个工具的 inputSchema 字段名与前端发送的 `text` 不匹配（运行时会报错）

前端对所有文本工具统一发送 `{ text: "...", ...options }`，但以下工具的 inputSchema 使用了不同的字段名，且 API 路由（`createToolRoute` 默认配置）不做字段映射，直接将 JSON 传给 `tool.execute()`，导致 zod 验证失败：

| 工具 | inputSchema 期望 | 前端实际发送 | API 路由 | 状态 |
|------|-----------------|-------------|----------|------|
| css-format | `css` (必填) | `text` | `createToolRoute('css-format')` | ❌ **运行时报错** |
| js-format | `code` (必填) | `text` | `createToolRoute('js-format')` | ❌ **运行时报错** |
| html-format | `html` (必填) | `text` | `createToolRoute('html-format')` | ❌ **运行时报错** |
| url-parser | `url` (必填) | `text` | `createToolRoute('url-parser')` | ❌ **运行时报错** |
| base-converter | `value` (必填) | `text` | `createToolRoute('base-converter')` | ❌ **运行时报错** |
| jwt-decode | `token` 或 `text` | `text` | `createToolRoute('jwt-decode')` | ✅ 兼容 |

**根因：** `createToolRoute` 默认使用 `parseJsonInput`，直接将前端 JSON 传给 `tool.execute()`。前端统一用 `text` 字段，但各工具 inputSchema 用各自的名字。

**修复建议：** 将这些工具的 inputSchema 字段名改为 `text`（最简单），或在 API 路由中添加字段映射。

---

## 统计

- ✅ 无问题：37 个工具
- ❌ 缺少参数 UI：20 个工具
- ⚠️ i18n 错误：1 个工具（csv-to-excel）
- ❌ 字段名不匹配（运行时报错）：5 个工具
- ✅ 字段名兼容：1 个工具（jwt-decode）

## 修复优先级

1. **P0（立即修复）**：5 个工具字段名不匹配导致运行时报错（css-format, js-format, html-format, url-parser, base-converter）
2. **P0（立即修复）**：csv-to-excel i18n 错误
3. **P0（立即修复）**：pdf-delete-pages、cron-gen、base-converter、audio-trim 缺少必填参数 UI
4. **P1（尽快修复）**：其余 16 个工具缺少参数 UI
