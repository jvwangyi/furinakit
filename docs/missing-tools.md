# FurinaKit 未实现/缺失工具报告

> 审查日期：2026-05-31
> 审查范围：i18n 翻译键、工具注册表、API 路由、竞品对标

---

## 一、已定义翻译但未实现的工具

通过对比 `src/lib/i18n.tsx` 中的翻译键和 `src/lib/tools/` 中的实际工具实现，**所有翻译键都有对应的工具实现**。没有「定义了翻译但没有实现」的工具。

但存在以下结构性问题：

### 1.1 空分类问题

侧边栏定义了 9 个工具分类，其中 2 个分类完全没有工具：

| 分类 | 侧边栏显示 | 实际工具数 | 状态 |
|------|-----------|-----------|------|
| PDF | ✅ | 6 | 正常 |
| Image | ✅ | 7 | 正常 |
| Text | ✅ | 12 | 正常 |
| Video | ✅ | 3 | 正常 |
| **Audio** | ✅ | **0** | ⚠️ 空分类 |
| Dev | ✅ | 8 | 正常 |
| **Convert** | ✅ | **0** | ⚠️ 空分类 |
| File | ✅ | 2 | 正常 |
| Craft | ✅ | 1 | 正常 |

**问题：** 用户点击「Audio」或「Convert」分类后看到空页面，体验差。

### 1.2 国际化遗漏

拼豆工具（`perler-client.tsx`）中存在硬编码中文字符串：

| 位置 | 硬编码文本 | 应使用的 i18n key |
|------|-----------|-------------------|
| 第 269 行 | `自定义` | 需新建 `perler.custom` |
| 第 322 行 | `空心圆` | 需新建 `perler.hollow_circle` |
| 第 276 行 | `高度` | 需新建 `perler.height` |
| 第 283 行 | `格（宽按原图比例自动计算）` | 需新建 `perler.custom_hint` |

韩语翻译中缺失的键（与中文/英文对比）：
- `tool.perler-beads` — 韩语翻译缺失
- `tool.perler-beads.desc` — 韩语翻译缺失
- `perler.enable_edit` — 韩语翻译缺失
- `perler.select_edit_color` — 韩语翻译缺失
- `perler.current_color` — 韩语翻译缺失
- `perler.select_color_first` — 韩语翻译缺失
- `perler.color_distance` — 韩语翻译缺失
- `perler.dist_oklab` — 韩语翻译缺失
- `perler.dist_rgb` — 韩语翻译缺失
- `perler.dist_ciede2000` — 韩语翻译缺失

---

## 二、已注册但功能受限的工具

### 2.1 纯客户端工具

以下工具在 `src/lib/tools/` 中注册了服务端处理逻辑，但实际依赖客户端渲染：

| 工具 | 问题 |
|------|------|
| `perler-beads` | 服务端 `execute()` 返回占位文本，所有逻辑在客户端 Canvas API 中完成。这是设计如此（纯浏览器端工具），但 API 调用会返回无用结果 |

### 2.2 依赖外部工具的工具

以下工具依赖系统级软件，部署时需要额外配置：

| 工具 | 依赖 | 部署注意 |
|------|------|----------|
| `video-to-audio` | ffmpeg | 需要在服务器安装 ffmpeg |
| `video-compress` | ffmpeg | 同上 |
| `video-trim` | ffmpeg | 同上 |
| `pdf-to-image` | 可能依赖 poppler/GraphicsMagick | 需验证部署环境 |

### 2.3 功能不完整的工具选项

部分工具的前端选项与后端实现不完全匹配：

| 工具 | 问题 |
|------|------|
| `pdf-split` | 前端只支持逗号分隔的页码列表，但 `pdf-extract-pages` 支持范围格式 `1-3,5,7-9`。两个工具的页码输入体验不一致 |
| `image-crop` | 有可视化裁剪器（CropSelector），但回退的手动输入模式（无图片时）体验差，缺少图片尺寸参考 |
| `video-trim` | 时间输入只支持 `HH:MM:SS` 文本格式，没有滑块或可视化选择 |

---

## 三、竞品对标：缺失的高价值工具

参考 ilovepdf、smallpdf、tinypng、regex101、jsonformatter.org、convertio 等竞品，以下是 FurinaKit 缺失的高价值工具：

### 3.1 PDF 类（优先级：高）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **PDF 加密/解密** | 用户经常需要给 PDF 加密码保护 | ilovepdf, smallpdf | 中 | ⭐⭐⭐ P1 |
| **PDF 添加水印** | 企业用户高频需求 | ilovepdf | 中 | ⭐⭐⭐ P1 |
| **PDF 页码添加** | 打印前常用 | ilovepdf | 低 | ⭐⭐ P2 |
| **PDF 签名** | 合同签署场景 | smallpdf, docusign | 高 | ⭐ P3 |
| **PDF 转 Word** | 最高频的 PDF 需求之一 | smallpdf, ilovepdf | 高（需 OCR） | ⭐⭐ P2 |
| **Word 转 PDF** | 同上 | smallpdf, ilovepdf | 中 | ⭐⭐ P2 |
| **PDF 删除页面** | 与提取页面互补 | ilovepdf | 低 | ⭐⭐ P2 |
| **PDF 重新排序** | 拖拽调整页面顺序 | smallpdf | 中 | ⭐ P3 |

### 3.2 图片类（优先级：高）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **图片去背景（抠图）** | 电商/社交媒体高频需求 | remove.bg, canva | 高（需 AI 模型） | ⭐⭐ P2 |
| **图片转 ICO/Favicon** | Web 开发常用 | favicon.io | 低 | ⭐⭐ P2 |
| **图片拼接（长图）** | 社交媒体分享 | 长图拼接工具 | 低 | ⭐⭐ P2 |
| **图片加边框/圆角** | 社交媒体头像处理 | canva | 低 | ⭐ P3 |
| **图片批量处理** | 效率工具 | tinypng（批量压缩） | 中 | ⭐⭐ P2 |
| **HEIC 转 JPG** | iPhone 用户高频需求 | heictojpg.com | 中 | ⭐⭐ P2 |
| **SVG 编辑器** | 开发者/设计师需求 | svg-edit | 高 | ⭐ P3 |
| **图片加滤镜** | 社交媒体用户 | canva, vsco | 中 | ⭐ P3 |

### 3.3 文本/数据类（优先级：中）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **CSV 编辑器** | 数据处理常用 | csvjson.com | 中 | ⭐⭐ P2 |
| **SQL 格式化** | 开发者高频需求 | sql-formatter | 低 | ⭐⭐ P2 |
| **CSS 格式化/压缩** | 前端开发常用 | cssformatter.net | 低 | ⭐⭐ P2 |
| **JS 格式化/压缩** | 前端开发常用 | jsbeautifier.org | 低 | ⭐⭐ P2 |
| **HTML 格式化** | 前端开发常用 | htmlformatter.org | 低 | ⭐⭐ P2 |
| **XML 格式化** | 与 JSON 格式化互补 | xmlformatter.com | 低 | ⭐⭐ P2 |
| **Lorem Ipsum 生成** | 设计/开发常用 | lipsum.com | 低 | ⭐ P3 |
| **Markdown 表格生成** | 文档编写常用 | tables-generator.com | 中 | ⭐ P3 |
| **文本加密/解密** | 安全场景 | cryptii.com | 中 | ⭐ P3 |
| **Cron 表达式生成** | 运维/开发常用 | crontab.guru | 低 | ⭐⭐ P2 |

### 3.4 开发者工具类（优先级：中）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **JSON Schema 生成** | API 开发常用 | jsonschema.net | 中 | ⭐⭐ P2 |
| **JSON Diff 对比** | 数据对比场景 | jsondiff.com | 中 | ⭐⭐ P2 |
| **Cron 表达式解析** | 运维开发必备 | crontab.guru | 低 | ⭐⭐ P2 |
| **Chmod 计算器** | Linux 运维常用 | chmod-calculator.com | 低 | ⭐ P3 |
| **URL 解析器** | 调试 URL 参数 | urlencoder.io | 低 | ⭐⭐ P2 |
| **HTTP 状态码查询** | 开发参考 | httpstatuses.com | 低 | ⭐ P3 |
| **MIME 类型查询** | 开发参考 | - | 低 | ⭐ P3 |
| **正则表达式库** | 开发常用 | regex101（社区库） | 中 | ⭐ P3 |
| **CSS 单位转换** | 前端开发 | unit-conversion.info | 低 | ⭐ P3 |
| **JSON → TypeScript** | TS 开发者高频需求 | json2ts.com | 中 | ⭐⭐ P2 |
| **JSON → Go Struct** | Go 开发者需求 | json2go.com | 中 | ⭐ P3 |

### 3.5 音频类（优先级：中）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **音频格式转换** | MP3/WAV/AAC/OGG 互转 | convertio, online-audio-converter | 中（需 ffmpeg） | ⭐⭐ P2 |
| **音频裁剪** | 铃声制作/播客剪辑 | mp3cut.net | 中（需 ffmpeg） | ⭐⭐ P2 |
| **音频合并** | 拼接多个音频片段 | audio-joiner.com | 中（需 ffmpeg） | ⭐ P3 |
| **文字转语音 (TTS)** | 无障碍/内容创作 | - | 高（需 API） | ⭐ P3 |
| **语音转文字 (STT)** | 会议记录/字幕 | - | 高（需 AI） | ⭐ P3 |
| **音频变速** | 播客/学习场景 | - | 低（需 ffmpeg） | ⭐ P3 |
| **音量调节** | 音频处理基础 | - | 低（需 ffmpeg） | ⭐ P3 |

### 3.6 转换类（优先级：中）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **Markdown 转 PDF** | 文档导出常用 | markdown2pdf.com | 中 | ⭐⭐ P2 |
| **HTML 转 PDF** | 网页保存/打印 | - | 中 | ⭐⭐ P2 |
| **CSV 转 Excel** | 数据处理常用 | convertcsv.com | 中 | ⭐⭐ P2 |
| **Excel 转 CSV** | 同上 | convertcsv.com | 中 | ⭐⭐ P2 |
| **YAML 转 JSON** | 配置文件转换 | yaml-to-json.com | 低 | ⭐⭐ P2 |
| **XML 转 JSON** | 数据格式转换 | xmljson.org | 低 | ⭐⭐ P2 |
| **TOML 转 JSON** | 配置文件转换 | - | 低 | ⭐ P3 |
| **图片转 Base64** | 开发常用 | base64-image.de | 低 | ⭐⭐ P2 |
| **Base64 转图片** | 同上 | base64decode.org | 低 | ⭐⭐ P2 |
| **进制转换** | 编程/数学 | rapidtables.com | 低 | ⭐ P3 |

### 3.7 文件类（优先级：低）

| 工具 | 价值 | 竞品参考 | 实现难度 | 建议优先级 |
|------|------|----------|----------|-----------|
| **文件压缩/解压 (ZIP)** | 通用需求 | ezyzip.com | 中 | ⭐⭐ P2 |
| **文件重命名（批量）** | 文件管理效率 | - | 低 | ⭐ P3 |
| **文件分割** | 大文件传输 | - | 低 | ⭐ P3 |
| **文本文件编码转换** | 中文编码问题 | - | 低 | ⭐ P3 |

---

## 四、优先级排序与实现建议

### P0：立即修复（1-2 天）

1. **隐藏空分类**：Audio 和 Convert 分类在侧边栏中隐藏或标记「即将推出」
2. **修复工具标题**：工具页面标题使用翻译后的名称而非英文 slug
3. **修正 metadata**：将「108 个实用工具」改为实际工具数量
4. **补全韩语翻译**：添加缺失的 perler-beads 相关翻译键
5. **修复硬编码中文**：拼豆工具中的硬编码字符串提取为 i18n key

### P1：短期实现（1-2 周）

按用户价值排序，建议优先实现：

1. **PDF 加密/解密** — 使用 `pdf-lib` 库，实现难度低，用户价值高
2. **PDF 添加水印** — 复用现有的图片水印逻辑 + `pdf-lib`
3. **图片转 ICO** — 使用 `sharp` 库，实现简单
4. **SQL 格式化** — 使用 `sql-formatter` npm 包，纯前端实现
5. **Cron 表达式生成/解析** — 使用 `cron-parser` npm 包，纯前端实现
6. **JSON → TypeScript** — 使用 `json-to-ts` npm 包，纯前端实现

### P2：中期实现（1-2 月）

1. **音频格式转换** — 复用现有 ffmpeg 架构，添加音频转换路由
2. **音频裁剪** — 同上
3. **PDF 转 Word** — 需要集成 LibreOffice 或类似方案
4. **Word 转 PDF** — 同上
5. **图片批量处理** — 在现有图片工具基础上添加多文件循环处理
6. **HEIC 转 JPG** — 使用 `heic-convert` npm 包
7. **YAML 转 JSON / XML 转 JSON** — 作为现有转换工具的补充
8. **Markdown 转 PDF** — 使用 `puppeteer` 或 `md-to-pdf`

### P3：长期规划（3-6 月）

1. **图片去背景** — 需要集成 AI 模型（如 `@imgly/background-removal`）
2. **PDF 签名** — 需要 Canvas 签名 + PDF 嵌入
3. **文字转语音 / 语音转文字** — 需要集成外部 API
4. **SVG 编辑器** — 需要构建完整的 SVG 编辑 UI
5. **文件压缩/解压 (ZIP)** — 使用 `jszip` 或 `archiver`

---

## 五、技术实现建议

### 5.1 新工具添加流程优化

当前添加新工具需要修改 4 个文件：
1. `src/lib/tools/<tool-name>.ts` — 工具实现
2. `src/lib/tools/index.ts` — 注册导入
3. `src/app/api/<category>/<tool-name>/route.ts` — API 路由
4. `src/app/[category]/[tool]/page.tsx` — 前端选项（巨型 switch）

**建议：** 将工具选项渲染拆分为独立组件，每个工具有自己的 `<tool-name>-options.tsx`，由工具页面动态加载。

### 5.2 音频工具架构

音频工具可以复用现有的视频工具架构（ffmpeg），建议：
1. 创建 `src/lib/tools/audio-*.ts` 模板
2. 复用 `createTempDir` / `cleanTempDir` 工具函数
3. 添加通用的 ffmpeg 进度回调

### 5.3 纯前端工具

以下工具可以完全在浏览器端实现，不需要 API 调用：
- SQL 格式化
- CSS/JS/HTML 格式化
- Cron 表达式生成
- 进制转换
- URL 解析
- Base64 转图片 / 图片转 Base64

这些工具可以参考 `perler-beads` 的实现模式（纯客户端 + Canvas API）。

---

## 六、总结

| 类别 | 已有工具 | 缺失高价值工具 | 建议新增 |
|------|---------|---------------|---------|
| PDF | 6 | 8 | 3-4 |
| Image | 7 | 8 | 3-4 |
| Text | 12 | 10 | 4-5 |
| Video | 3 | 0 | 0 |
| Audio | 0 | 7 | 2-3 |
| Dev | 8 | 11 | 4-5 |
| Convert | 0 | 10 | 4-5 |
| File | 2 | 4 | 1-2 |
| Craft | 1 | 0 | 0 |
| **总计** | **39** | **58** | **21-28** |

**核心结论：**
1. 当前 39 个工具覆盖了最基础的需求，但与竞品（ilovepdf 有 25+ 工具、smallpdf 有 20+ 工具）相比，深度不足
2. **Audio 和 Convert 分类是空的**，需要优先填充
3. **PDF 加密、图片转 ICO、SQL 格式化、Cron 生成**是投入产出比最高的待实现工具
4. 纯前端工具（格式化类、生成类）实现成本低，建议批量实现
5. 依赖 ffmpeg 的音视频工具可以批量复用架构，边际成本递减
