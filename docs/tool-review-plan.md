# FurinaKit 工具审查计划

> 目标：对每个工具进行参数审查 → 页面设计优化 → 浏览器验证
> 原则：美观、一致、实用

---

## 审查流程（每个工具）

### Step 1: 参数审查
- 检查 `src/lib/tools/<tool>.ts` 的 `inputSchema`（Zod 定义）
- 检查 `src/components/tools/ToolOptions.tsx` 对应的参数配置 UI
- 评估：
  - 参数是否完整？有没有缺失的常用参数？
  - 参数命名是否合理？
  - 默认值是否合理？
  - 参数校验是否充分？
  - 前端 UI 控件类型是否合适（Input/Select/Slider/Switch）？

### Step 2: 页面设计审查
- 检查 `ToolPageContainer.tsx` 中该工具的渲染逻辑
- 检查专属组件（如 QRCodePreview、MarkdownPreview、CropSelector 等）
- 评估：
  - 布局是否合理（输入区、选项区、结果区的排列）？
  - 移动端体验如何？
  - 是否需要专属预览/交互组件？
  - 视觉层次是否清晰？

### Step 3: 浏览器验证
- 启动 dev server
- 逐个工具页面访问，测试功能
- 检查控制台错误
- 验证移动端响应式

---

## 分类审查计划

### 📄 第一批：PDF 操作（10 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `pdf-merge` | 无参数，多文件上传 | 仅文件上传，无额外配置 |
| 2 | `pdf-split` | pages: number[] | 页码输入方式是否友好？ |
| 3 | `pdf-compress` | 无参数 | 缺少压缩级别选项？ |
| 4 | `pdf-to-image` | 无参数 | 缺少输出格式（PNG/JPG）选项 |
| 5 | `pdf-rotate` | 无参数 | 缺少旋转角度选择？ |
| 6 | `pdf-extract-pages` | 无参数 | 页码范围输入方式？ |
| 7 | `pdf-encrypt` | 无参数 | 缺少密码输入？ |
| 8 | `pdf-watermark` | 无参数 | 缺少水印文字/透明度配置？ |
| 9 | `pdf-add-page-numbers` | 无参数 | 缺少位置/起始页配置？ |
| 10 | `pdf-delete-pages` | pages: number[] | 同 pdf-split |

**重点关注：**
- PDF 工具普遍参数偏少，大量"无参数"工具有待补充
- `pdf-split` 和 `pdf-delete-pages` 共用 pages 参数，检查 UI 是否一致

---

### 🖼️ 第二批：图片处理（11 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `image-resize` | width, height | 是否需要"保持比例"选项？ |
| 2 | `image-crop` | CropSelector 交互裁剪 | 专属组件，检查交互体验 |
| 3 | `image-convert` | format (Select) | 是否需要质量选项？ |
| 4 | `image-compress` | 无参数 | 缺少压缩质量滑块 |
| 5 | `image-rotate` | 无参数 | 缺少角度选择（90/180/270/自定义） |
| 6 | `image-merge` | 无参数 | 缺少排列方式（横向/纵向）？ |
| 7 | `image-add-watermark` | 无参数 | 缺少文字/位置/透明度配置 |
| 8 | `image-to-ico` | 无参数 | 缺少尺寸选择（16/32/48/64/128/256） |
| 9 | `image-to-pdf` | 无参数 | 是否需要页面尺寸选项？ |
| 10 | `image-to-base64` | 无参数 | 纯转换，参数可能不需要 |
| 11 | `base64-to-image` | 无参数 | 纯转换，参数可能不需要 |

**重点关注：**
- `image-crop` 有专属 CropSelector，检查是否好用
- `image-compress` 缺少质量控制
- `image-rotate` 缺少角度选择

---

### 📝 第三批：文本处理（14 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `json-format` | indent (Select) | ✅ 已有缩进选项 |
| 2 | `text-diff` | 两个 Textarea | DiffViewer 组件，检查展示 |
| 3 | `base64` | mode (encode/decode) | ✅ 已有模式切换 |
| 4 | `hash` | algorithm (Select) | ✅ 已有算法选择 |
| 5 | `url-encode` | mode (encode/decode) | ✅ 已有模式切换 |
| 6 | `json-to-csv` | 无参数 | 纯转换 |
| 7 | `csv-to-json` | 无参数 | 纯转换 |
| 8 | `json-to-yaml` | 无参数 | 纯转换 |
| 9 | `json-to-xml` | 无参数 | 纯转换 |
| 10 | `markdown-to-html` | MarkdownPreview 实时预览 | ✅ 专属组件 |
| 11 | `regex-tester` | RegexPreview 实时匹配 | ✅ 专属组件 |
| 12 | `text-case` | 无参数 | 自动检测大小写？ |
| 13 | `text-count` | 无参数 | 自动统计 |
| 14 | `markdown-to-pdf` | 无参数 | 缺少页面配置？ |

**重点关注：**
- `text-diff` 的 DiffViewer 是否美观
- `regex-tester` 的匹配高亮是否清晰

---

### 🛠️ 第四批：开发工具（14 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `jwt-decode` | 无参数 | 纯文本输入 |
| 2 | `timestamp` | format (Select) | ✅ 已有格式选择 |
| 3 | `sql-format` | 无参数 | 缺少方言选择？ |
| 4 | `uuid-gen` | version, count | ✅ 已有版本和数量 |
| 5 | `password-gen` | length, uppercase, lowercase, numbers, symbols | ✅ 参数丰富 |
| 6 | `qrcode-gen` | size, errorCorrectionLevel + QRCodePreview | ✅ 已有实时预览 |
| 7 | `color-convert` | ColorPicker 组件 | ✅ 专属组件 |
| 8 | `css-format` | 无参数 | 缺少缩进选项？ |
| 9 | `js-format` | 无参数 | 缺少缩进选项？ |
| 10 | `html-format` | 无参数 | 缺少缩进选项？ |
| 11 | `cron-gen` | 无参数 | 是否需要可视化配置？ |
| 12 | `cron-parser` | 无参数 | 纯解析 |
| 13 | `url-parser` | 无参数 | 纯解析 |
| 14 | `base-converter` | 无参数 | 缺少输入进制选择？ |
| 15 | `lorem-gen` | 无参数 | 缺少段落数/字数选项？ |

**重点关注：**
- `sql-format`、`css-format`、`js-format`、`html-format` 缺少缩进配置
- `cron-gen` 是否需要可视化 cron 构建器
- `lorem-gen` 缺少数量控制

---

### 🔄 第五批：格式转换（8 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `csv-to-excel` | 无参数 | 纯转换 |
| 2 | `excel-to-csv` | 无参数 | 纯转换 |
| 3 | `yaml-to-json` | 无参数 | 纯转换 |
| 4 | `xml-to-json` | 无参数 | 纯转换 |
| 5 | `image-to-base64` | 无参数 | 与图片分类重复 |
| 6 | `base64-to-image` | 无参数 | 与图片分类重复 |
| 7 | `markdown-to-pdf` | 无参数 | 与文本分类重复 |
| 8 | `image-to-pdf` | 无参数 | 与图片分类重复 |

---

### 🎵 第六批：音频（2 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `audio-convert` | format (Select) | ✅ 已有格式选择 |
| 2 | `audio-trim` | startTime, endTime | ✅ 已有时间参数 |

---

### 🎬 第七批：视频（3 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `video-to-audio` | format (Select) | ✅ 已有格式选择 |
| 2 | `video-compress` | 无参数 | 缺少压缩质量/目标大小？ |
| 3 | `video-trim` | startTime, endTime | ✅ 已有时间参数 |

---

### 📁 第八批：文件工具（2 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `file-info` | 无参数 | 纯展示 |
| 2 | `file-hash` | algorithm (Select) | ✅ 已有算法选择 |

---

### 🎨 第九批：手工/创意（1 个）

| # | 工具 | 参数现状 | 需关注点 |
|---|------|----------|----------|
| 1 | `perler-beads` | 独立客户端组件 | 特殊处理，单独审查 |

---

## 执行策略

### 分批执行（每批 1 个子任务）

```
批次 1: PDF（10 个工具）    → 参数审查 + 设计 → 浏览器验证
批次 2: 图片（11 个工具）   → 参数审查 + 设计 → 浏览器验证
批次 3: 文本（14 个工具）   → 参数审查 + 设计 → 浏览器验证
批次 4: 开发工具（15 个）   → 参数审查 + 设计 → 浏览器验证
批次 5: 格式转换（8 个）    → 参数审查 + 设计 → 浏览器验证
批次 6: 音频+视频+文件（7） → 参数审查 + 设计 → 浏览器验证
批次 7: 手工（1 个）        → 单独审查
```

### 每批产出
1. **参数升级清单**：哪些参数需要新增/修改/删除
2. **页面设计改动清单**：UI 布局、组件、样式变更
3. **实现**：代码修改
4. **浏览器验证截图**

---

## 优先级建议

### 🔴 高优先（参数缺失明显）
- `image-compress` — 缺少质量滑块
- `image-rotate` — 缺少角度选择
- `image-add-watermark` — 缺少文字/位置配置
- `pdf-compress` — 缺少压缩级别
- `pdf-to-image` — 缺少输出格式
- `sql-format`/`css-format`/`js-format`/`html-format` — 缺少缩进配置
- `lorem-gen` — 缺少数量控制
- `video-compress` — 缺少质量配置

### 🟡 中优先（体验优化）
- `image-resize` — 添加"保持比例"选项
- `image-to-ico` — 添加尺寸选择
- `base-converter` — 输入进制选择
- `pdf-encrypt` — 密码输入 UI
- `cron-gen` — 可视化构建器

### 🟢 低优先（已较好）
- `qrcode-gen`、`color-convert`、`password-gen`、`uuid-gen` — 参数已丰富
- 纯转换工具 — 参数可能不需要
