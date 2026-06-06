# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-06-06

### Fixed
- 修复 CI 构建失败：Google Fonts CDN 无法访问导致 build 失败
- 修复 Node.js 20 弃用警告：添加 FORCE_JAVASCRIPT_ACTIONS_TO_NODE24 环境变量

### Changed
- 字体加载从 `next/font/google` 改为本地 `geist` 字体包，构建不再依赖外部网络
- `src/lib/auth.ts` 和 `src/lib/error-monitor.ts` 中的 console 调用改为 pino logger

### Added
- 新增 7 个工具的单元测试：ascii-art、business-card、image-add-text、ip-lookup、perler-beads、pomodoro、word-cloud
- 注册遗漏的 ip-lookup 工具到 tools/index.ts

## [0.1.0] - 2026-06-03

### Added

#### 核心功能
- 62 个在线工具，涵盖 PDF、图片、视频、音频、文本、开发、格式转换等类别
- Web 界面、REST API、命令行工具三端支持
- 国际化支持：中文、English、日本語、한국어

#### PDF 处理 (10 个工具)
- pdf-merge: 合并多个 PDF 文件
- pdf-split: 拆分 PDF 文件
- pdf-compress: 压缩 PDF 文件大小
- pdf-rotate: 旋转 PDF 页面
- pdf-extract-pages: 提取指定页面
- pdf-delete-pages: 删除指定页面
- pdf-encrypt: PDF 加密保护
- pdf-watermark: 添加文字水印
- pdf-add-page-numbers: 添加页码
- pdf-to-image: PDF 转图片

#### 图片处理 (8 个工具)
- image-compress: 压缩图片大小
- image-convert: 转换图片格式 (PNG/JPG/WebP/AVIF/TIFF/GIF)
- image-crop: 裁剪图片
- image-resize: 调整图片尺寸
- image-rotate: 旋转图片
- image-add-watermark: 添加图片水印
- image-merge: 拼接多张图片
- image-to-ico: 图片转 ICO 图标

#### 文本处理 (13 个工具)
- json-format: JSON 格式化
- json-to-csv: JSON 转 CSV
- json-to-yaml: JSON 转 YAML
- json-to-xml: JSON 转 XML
- csv-to-json: CSV 转 JSON
- markdown-to-html: Markdown 转 HTML
- text-case: 大小写转换
- text-count: 字数统计
- text-diff: 文本对比
- base64: Base64 编解码
- hash: 哈希计算
- url-encode: URL 编解码
- regex-tester: 正则表达式测试

#### 视频处理 (3 个工具)
- video-compress: 压缩视频大小
- video-trim: 裁剪视频片段
- video-to-audio: 提取音频

#### 音频处理 (2 个工具)
- audio-convert: 转换音频格式 (MP3/WAV/AAC)
- audio-trim: 裁剪音频片段

#### 开发工具 (15 个工具)
- timestamp: 时间戳转换
- uuid-gen: UUID 生成器
- password-gen: 密码生成器
- color-convert: 颜色格式转换
- cron-parser: Cron 表达式解析
- cron-gen: Cron 表达式生成
- css-format: CSS 格式化
- js-format: JavaScript 格式化
- html-format: HTML 格式化
- sql-format: SQL 格式化
- jwt-decode: JWT 解码
- qrcode-gen: 二维码生成
- base-converter: 进制转换
- url-parser: URL 解析
- lorem-gen: Lorem 文本生成

#### 格式转换 (8 个工具)
- yaml-to-json: YAML 转 JSON
- xml-to-json: XML 转 JSON
- markdown-to-pdf: Markdown 转 PDF
- csv-to-excel: CSV 转 Excel
- excel-to-csv: Excel 转 CSV
- image-to-pdf: 图片转 PDF
- image-to-base64: 图片转 Base64
- base64-to-image: Base64 转图片

#### 文件管理 (2 个工具)
- file-info: 文件信息查看
- file-hash: 文件哈希计算

#### 手工创意 (1 个工具)
- perler-beads: 拼豆图纸生成器

#### UI/UX
- 响应式设计，完美适配桌面端和移动端
- 亮色/暗色主题切换
- 精美的 shadcn/ui 组件库
- 面包屑导航
- 工具搜索和分类筛选
- 最近使用工具记录

#### 测试
- 357 个单元测试，100% 工具覆盖
- 91 个 E2E 测试 (Playwright)
- 14 个 CLI 测试
- 15 个 Storybook 组件文档

#### 开发工具
- Vitest 单元测试框架
- Playwright E2E 测试框架
- Storybook 组件文档
- ESLint 代码检查
- TypeScript 严格模式

### Technical Stack

- **框架**: Next.js 16 (App Router + Turbopack)
- **语言**: TypeScript 5
- **UI**: Tailwind CSS 4 + shadcn/ui
- **测试**: Vitest + Playwright
- **文档**: Storybook
- **PDF**: pdf-lib
- **图片**: Sharp
- **视频/音频**: FFmpeg (fluent-ffmpeg)

---

## [Unreleased]

### Planned
- 更多工具支持
- 批量处理功能
- 用户收藏功能
- API 限流和认证
- Docker 部署支持
