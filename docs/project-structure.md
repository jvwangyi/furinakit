# FurinaKit 项目文件结构

> 最后更新：2026-06-03
> 工具数量：62 个
> 测试数量：462 个（357 单元 + 91 E2E + 14 CLI）

---

## 根目录

```
furinakit/
├── .claude/                    # Claude Code 本地配置
├── .codegraph/                 # CodeGraph MCP 索引（gitignore）
├── .github/                    # GitHub 配置
├── .storybook/                 # Storybook 配置
├── cli/                        # CLI 命令行工具
├── data/                       # 运行时数据（gitignore）
├── docs/                       # 项目文档
├── e2e/                        # E2E 测试
├── public/                     # 静态资源
├── scripts/                    # 部署脚本（gitignore）
├── src/                        # 源代码
├── tests/                      # 单元测试
├── .env.local                  # 环境变量（gitignore）
├── .gitignore                  # Git 忽略规则
├── AGENTS.md                   # Next.js Agent 规则
├── CHANGELOG.md                # 版本日志
├── CLAUDE.md                   # Claude 开发指南
├── CODE_OF_CONDUCT.md          # 社区行为准则
├── CONTRIBUTING.md              # 贡献指南
├── LICENSE                     # MIT 开源许可证
├── MAINTENANCE_PLAN.md         # 维护计划
├── README.md                   # 项目文档（四语言）
├── check_i18n.cjs              # i18n 完整性检查脚本
├── components.json             # shadcn/ui 配置
├── eslint.config.mjs           # ESLint 配置
├── next-env.d.ts               # Next.js 类型声明（gitignore）
├── next.config.ts              # Next.js 配置（basePath/CI）
├── package-lock.json           # 依赖锁定
├── package.json                # 项目配置
├── playwright.config.ts        # Playwright E2E 配置
├── postcss.config.mjs          # PostCSS 配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.tsbuildinfo        # TS 构建缓存（gitignore）
└── vitest.config.mts           # Vitest 单元测试配置
```

### 根目录文件说明

| 文件 | 用途 |
|------|------|
| `.env.local` | 本地环境变量，不提交到 git |
| `AGENTS.md` | Next.js 16 Agent 规则，提醒 AI 注意 breaking changes |
| `CHANGELOG.md` | 版本更新记录 |
| `CLAUDE.md` | AI 开发指南：工具开发流程、验证清单、已知陷阱 |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 行为准则 |
| `CONTRIBUTING.md` | 如何参与项目开发 |
| `LICENSE` | MIT 开源许可证 |
| `MAINTENANCE_PLAN.md` | 项目维护计划和检查清单 |
| `README.md` | 项目文档，包含中文/English/日本語/한국어 四语言 |
| `check_i18n.cjs` | Node.js 脚本，检查 62 个工具是否都有四语言翻译 |
| `components.json` | shadcn/ui 组件库配置（主题、路径别名） |
| `eslint.config.mjs` | ESLint 代码规范配置 |
| `next.config.ts` | Next.js 配置：CI 环境 basePath 为空，生产为 `/furinakit` |
| `playwright.config.ts` | Playwright E2E 测试配置 |
| `postcss.config.mjs` | PostCSS CSS 处理插件配置 |
| `tsconfig.json` | TypeScript 编译选项、路径别名 `@/` → `src/` |
| `vitest.config.mts` | Vitest 单元测试配置 |

---

## `.github/` — GitHub 配置

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md           # Bug 报告模板
│   └── feature_request.md      # 功能请求模板
└── workflows/
    └── ci.yml                  # CI 流水线
```

| 文件 | 用途 |
|------|------|
| `bug_report.md` | Issue 模板：Bug 报告 |
| `feature_request.md` | Issue 模板：功能建议 |
| `ci.yml` | GitHub Actions：push/PR 触发 → 单元测试 → 构建 → E2E 测试 |

---

## `.storybook/` — Storybook 配置

```
.storybook/
├── main.ts                     # Storybook 主配置（路径、插件）
└── preview.tsx                 # 全局装饰器、主题参数
```

---

## `cli/` — 命令行工具

```
cli/
├── index.ts                    # CLI 入口，Commander.js 注册命令组
└── commands/
    ├── image.ts                # 图片命令：compress, convert, crop, resize
    ├── pdf.ts                  # PDF 命令：merge, split, compress, rotate
    └── text.ts                 # 文本命令：json-format, hash, base64, url-encode, diff
```

使用方式：`npm run cli -- <category> <tool> [options]`

---

## `data/` — 运行时数据（gitignore）

```
data/
├── feedback.json               # 用户反馈数据
├── recent-tools.json           # 最近使用工具记录
└── stats.json                  # 工具使用统计
```

---

## `docs/` — 项目文档

```
docs/
├── api/
│   └── openapi.yaml            # OpenAPI 3.0 规范（Swagger 文档源）
├── archive/                    # 历史文档归档（gitignore）
│   ├── furina_resource/        # 芙宁娜角色设定资料（11 个文件）
│   ├── audit-plan.md           # 审计计划
│   ├── code-analysis.md        # 代码分析报告
│   ├── e2e-progress.md         # E2E 测试进度
│   ├── execution-plan.md       # 执行计划
│   ├── feature-report.md       # 功能报告
│   ├── final-audit-progress.md # 审计进度记录
│   ├── findings.md             # 发现问题清单
│   ├── furinakit-complete.md   # 完整功能清单
│   ├── furinakit-features.md   # 功能特性文档
│   ├── furinakit-spec.md       # 项目规格说明
│   ├── missing-tools.md        # 缺失工具清单
│   ├── progress.md             # 开发进度
│   ├── project-report.md       # 项目报告
│   ├── swisskit-plan.md        # SwissKit 计划
│   ├── task_plan.md            # 任务计划
│   ├── tool-audit.md           # 工具审计
│   ├── tool-review-plan.md     # 工具审查计划
│   ├── tool-review-progress.md # 审查进度
│   ├── ui-optimization.md      # UI 优化文档
│   ├── ux-review.md            # UX 审查
│   └── 项目结构梳理.md          # 项目结构梳理
├── reference/
│   ├── colorSystemMapping.json # 颜色品牌映射参考
│   └── pbdx-palettes.json     # 拼豆色板参考数据
├── final-audit-report.md       # 最终审计报告
└── project-structure.md        # 项目结构说明（本文件）
```

---

## `e2e/` — E2E 测试（Playwright）

```
e2e/
├── homepage.spec.ts            # 首页：加载、工具列表、搜索过滤
├── navigation.spec.ts          # 导航：侧边栏、分类切换、主题切换
├── search.spec.ts              # 搜索：功能、过滤、清空
├── text-tools.spec.ts          # 文本工具：json-format, hash, uuid-gen, base64
├── pdf-tools.spec.ts           # PDF 工具：rotate, compress, split, merge
├── image-tools.spec.ts         # 图片工具：compress, convert, crop, resize
├── audio-video-tools.spec.ts   # 音视频工具：audio-convert, video-compress, video-trim
├── dev-tools.spec.ts           # 开发工具：timestamp, regex-tester, color-convert
├── feedback.spec.ts            # 反馈系统：表单、评分、提交
├── i18n.spec.ts                # 国际化：语言切换、翻译完整性
└── tool-page.spec.ts           # 工具页面：加载、选项、执行按钮
```

---

## `public/` — 静态资源

```
public/
├── furina.jpg                  # 项目图标/Logo
└── sw.js                       # Service Worker（PWA 离线支持）
```

---

## `scripts/` — 部署脚本（gitignore）

```
scripts/
└── start_ssh_tunnel.bat        # Windows SSH 隧道脚本（部署用）
```

---

## `src/` — 源代码

### `src/app/` — Next.js App Router

```
src/app/
├── [category]/                 # 动态分类路由
│   ├── page.tsx                # 分类页面（工具列表）
│   └── [tool]/                 # 动态工具路由
│       ├── page.tsx            # 工具页面
│       └── perler-client.tsx   # 拼豆工具客户端组件
├── api/                        # API 路由（66 个）
│   ├── audio/                  # 音频工具 API（2 个）
│   ├── convert/                # 格式转换 API（8 个）
│   ├── dev/                    # 开发工具 API（15 个）
│   ├── docs/                   # API 文档生成
│   ├── feedback/               # 用户反馈 API
│   ├── file/                   # 文件工具 API（2 个）
│   ├── health/                 # 健康检查 API
│   ├── image/                  # 图片工具 API（8 个）
│   ├── pdf/                    # PDF 工具 API（10 个）
│   ├── recent-tools/           # 最近使用工具 API
│   ├── stats/                  # 使用统计 API
│   ├── text/                   # 文本工具 API（13 个）
│   ├── tools/                  # 工具列表 API
│   └── video/                  # 视频工具 API（3 个）
├── api-docs/
│   └── page.tsx                # Swagger UI 页面
├── apple-icon.jpg              # Apple 触控图标
├── globals.css                 # 全局样式（Tailwind）
├── icon.jpg                    # 网站图标
├── layout.tsx                  # 根布局（字体、Service Worker、Providers）
├── manifest.ts                 # PWA Manifest
└── page.tsx                    # 首页（工具卡片网格、搜索、最近使用）
```

### `src/app/api/` — API 路由详情

#### 音频工具 (`/api/audio/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `convert/route.ts` | audio-convert | 音频格式转换（mp3/wav/aac/ogg/flac） |
| `trim/route.ts` | audio-trim | 音频裁剪 |

#### 格式转换 (`/api/convert/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `base64-to-image/route.ts` | base64-to-image | Base64 转图片 |
| `csv-to-excel/route.ts` | csv-to-excel | CSV 转 Excel |
| `excel-to-csv/route.ts` | excel-to-csv | Excel 转 CSV |
| `image-to-base64/route.ts` | image-to-base64 | 图片转 Base64 |
| `image-to-pdf/route.ts` | image-to-pdf | 图片转 PDF |
| `markdown-to-pdf/route.ts` | markdown-to-pdf | Markdown 转 PDF |
| `xml-to-json/route.ts` | xml-to-json | XML 转 JSON |
| `yaml-to-json/route.ts` | yaml-to-json | YAML 转 JSON |

#### 开发工具 (`/api/dev/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `base-converter/route.ts` | base-converter | 进制转换（2-36） |
| `color-convert/route.ts` | color-convert | 颜色格式转换（HEX/RGB/HSL） |
| `cron-gen/route.ts` | cron-gen | Cron 表达式生成 |
| `cron-parser/route.ts` | cron-parser | Cron 表达式解析 |
| `css-format/route.ts` | css-format | CSS 格式化 |
| `html-format/route.ts` | html-format | HTML 格式化 |
| `js-format/route.ts` | js-format | JavaScript 格式化 |
| `jwt-decode/route.ts` | jwt-decode | JWT 令牌解码 |
| `lorem-gen/route.ts` | lorem-gen | Lorem 占位文本生成 |
| `password-gen/route.ts` | password-gen | 安全密码生成 |
| `qrcode-gen/route.ts` | qrcode-gen | 二维码生成 |
| `sql-format/route.ts` | sql-format | SQL 格式化 |
| `timestamp/route.ts` | timestamp | 时间戳转换 |
| `url-parser/route.ts` | url-parser | URL 解析 |
| `uuid-gen/route.ts` | uuid-gen | UUID 生成 |

#### 文件工具 (`/api/file/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `file-hash/route.ts` | file-hash | 文件哈希计算 |
| `file-info/route.ts` | file-info | 文件元信息 |

#### 图片工具 (`/api/image/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `add-watermark/route.ts` | image-add-watermark | 图片水印 |
| `compress/route.ts` | image-compress | 图片压缩 |
| `convert/route.ts` | image-convert | 图片格式转换 |
| `crop/route.ts` | image-crop | 图片裁剪 |
| `merge/route.ts` | image-merge | 图片合并 |
| `resize/route.ts` | image-resize | 图片缩放 |
| `rotate/route.ts` | image-rotate | 图片旋转 |
| `to-ico/route.ts` | image-to-ico | 图片转 ICO |

#### PDF 工具 (`/api/pdf/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `add-page-numbers/route.ts` | pdf-add-page-numbers | PDF 添加页码 |
| `compress/route.ts` | pdf-compress | PDF 压缩 |
| `delete-pages/route.ts` | pdf-delete-pages | PDF 删除页面 |
| `encrypt/route.ts` | pdf-encrypt | PDF 加密 |
| `extract-pages/route.ts` | pdf-extract-pages | PDF 提取页面 |
| `merge/route.ts` | pdf-merge | PDF 合并 |
| `rotate/route.ts` | pdf-rotate | PDF 旋转 |
| `split/route.ts` | pdf-split | PDF 拆分 |
| `to-image/route.ts` | pdf-to-image | PDF 转图片 |
| `watermark/route.ts` | pdf-watermark | PDF 水印 |

#### 文本工具 (`/api/text/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `base64/route.ts` | base64 | Base64 编解码 |
| `csv-to-json/route.ts` | csv-to-json | CSV 转 JSON |
| `diff/route.ts` | text-diff | 文本差异对比 |
| `hash/route.ts` | hash | 哈希计算 |
| `json-format/route.ts` | json-format | JSON 格式化 |
| `json-to-csv/route.ts` | json-to-csv | JSON 转 CSV |
| `json-to-xml/route.ts` | json-to-xml | JSON 转 XML |
| `json-to-yaml/route.ts` | json-to-yaml | JSON 转 YAML |
| `markdown-to-html/route.ts` | markdown-to-html | Markdown 转 HTML |
| `regex-tester/route.ts` | regex-tester | 正则表达式测试 |
| `text-case/route.ts` | text-case | 大小写转换 |
| `text-count/route.ts` | text-count | 字数统计 |
| `url-encode/route.ts` | url-encode | URL 编解码 |

#### 视频工具 (`/api/video/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `compress/route.ts` | video-compress | 视频压缩 |
| `to-audio/route.ts` | video-to-audio | 视频转音频 |
| `trim/route.ts` | video-trim | 视频裁剪 |

#### 系统 API

| 路由 | 说明 |
|------|------|
| `docs/spec/route.ts` | OpenAPI 规范生成（Swagger 文档源） |
| `feedback/route.ts` | 用户反馈存储 |
| `health/route.ts` | 健康检查 |
| `recent-tools/route.ts` | 最近使用工具（带 cookie 和 mutex） |
| `stats/route.ts` | 工具使用统计（带 mutex） |
| `tools/route.ts` | 工具列表 API（供前端获取所有工具信息） |

---

### `src/components/` — React 组件

#### 布局组件 (`layout/`)

| 文件 | 说明 |
|------|------|
| `BackToTop.tsx` | 返回顶部按钮 |
| `Breadcrumb.tsx` | 面包屑导航 |
| `Breadcrumb.stories.tsx` | 面包屑 Storybook |
| `LanguageSwitcher.tsx` | 语言切换器（zh/en/ja/ko） |
| `MobileNav.tsx` | 移动端导航抽屉 |
| `Sidebar.tsx` | 桌面端侧边栏（分类导航、主题切换） |
| `ThemeToggle.tsx` | 亮色/暗色主题切换 |

#### 共享组件 (`shared/`)

| 文件 | 说明 |
|------|------|
| `TermLabel.tsx` | 术语标签（带 tooltip 解释） |

#### 工具组件 (`tools/`)

| 文件 | 说明 |
|------|------|
| `ColorPicker.tsx` | 颜色选择器 |
| `CropSelector.tsx` | 图片裁剪选区 |
| `DiffViewer.tsx` | 文本差异查看器 |
| `FeedbackForm.tsx` | 用户反馈表单 |
| `FileUploader.tsx` | 文件上传器（拖拽 + 点击） |
| `ImagePreview.tsx` | 图片预览 |
| `JsonTreeView.tsx` | JSON 树形视图 |
| `MarkdownPreview.tsx` | Markdown 实时预览 |
| `PDFPreview.tsx` | PDF 预览 |
| `QRCodePreview.tsx` | 二维码预览 |
| `RecentTools.tsx` | 最近使用工具列表 |
| `RegexPreview.tsx` | 正则表达式匹配预览 |
| `ToolCard.tsx` | 工具卡片（首页网格） |
| `ToolFileSection.tsx` | 工具页面文件上传区域 |
| `ToolHelp.tsx` | 工具帮助信息 |
| `ToolOptions.tsx` | 工具参数选项面板 |
| `ToolPageContainer.tsx` | 工具页面主容器（状态管理、API 调用） |
| `ToolResult.tsx` | 工具执行结果展示 |
| `*.stories.tsx` | 对应组件的 Storybook 文档（11 个） |

#### UI 基础组件 (`ui/`)

| 文件 | 说明 |
|------|------|
| `badge.tsx` | 徽章 |
| `button.tsx` | 按钮 |
| `card.tsx` | 卡片 |
| `dialog.tsx` | 对话框 |
| `dropdown-menu.tsx` | 下拉菜单 |
| `input.tsx` | 输入框 |
| `label.tsx` | 标签 |
| `select.tsx` | 选择器 |
| `separator.tsx` | 分隔符 |
| `sheet.tsx` | 抽屉面板 |
| `sonner.tsx` | Toast 通知 |
| `switch.tsx` | 开关 |
| `tabs.tsx` | 标签页 |
| `textarea.tsx` | 文本区域 |
| `tooltip.tsx` | 提示气泡 |
| `button.stories.tsx` | 按钮 Storybook |

#### 其他组件

| 文件 | 说明 |
|------|------|
| `ErrorBoundary.tsx` | React 错误边界 |
| `ThemeProvider.tsx` | 主题 Provider（next-themes） |
| `providers.tsx` | 全局 Providers 组合 |

---

### `src/lib/` — 核心库

#### 工具实现 (`tools/`)

| 文件 | 分类 | 说明 |
|------|------|------|
| `index.ts` | - | 工具注册入口，import 所有工具 |
| `registry.ts` | - | 工具注册表（register/getTool/getAllTools） |
| `audio-convert.ts` | audio | 音频格式转换 |
| `audio-trim.ts` | audio | 音频裁剪 |
| `base-converter.ts` | dev | 进制转换 |
| `base64-to-image.ts` | convert | Base64 转图片 |
| `base64.ts` | text | Base64 编解码 |
| `color-convert.ts` | dev | 颜色格式转换 |
| `cron-gen.ts` | dev | Cron 生成 |
| `cron-parser.ts` | dev | Cron 解析 |
| `css-format.ts` | dev | CSS 格式化 |
| `csv-to-excel.ts` | convert | CSV 转 Excel |
| `csv-to-json.ts` | text | CSV 转 JSON |
| `excel-to-csv.ts` | convert | Excel 转 CSV |
| `file-hash.ts` | file | 文件哈希 |
| `file-info.ts` | file | 文件信息 |
| `hash.ts` | text | 哈希计算 |
| `html-format.ts` | dev | HTML 格式化 |
| `image-add-watermark.ts` | image | 图片水印 |
| `image-compress.ts` | image | 图片压缩 |
| `image-convert.ts` | image | 图片格式转换 |
| `image-crop.ts` | image | 图片裁剪 |
| `image-merge.ts` | image | 图片合并 |
| `image-resize.ts` | image | 图片缩放 |
| `image-rotate.ts` | image | 图片旋转 |
| `image-to-base64.ts` | convert | 图片转 Base64 |
| `image-to-ico.ts` | image | 图片转 ICO |
| `image-to-pdf.ts` | convert | 图片转 PDF |
| `js-format.ts` | dev | JavaScript 格式化 |
| `json-format.ts` | text | JSON 格式化 |
| `json-to-csv.ts` | text | JSON 转 CSV |
| `json-to-xml.ts` | text | JSON 转 XML |
| `json-to-yaml.ts` | text | JSON 转 YAML |
| `jwt-decode.ts` | dev | JWT 解码 |
| `lorem-gen.ts` | dev | Lorem 生成 |
| `markdown-to-html.ts` | text | Markdown 转 HTML |
| `markdown-to-pdf.ts` | convert | Markdown 转 PDF |
| `password-gen.ts` | dev | 密码生成 |
| `pdf-add-page-numbers.ts` | pdf | PDF 添加页码 |
| `pdf-compress.ts` | pdf | PDF 压缩 |
| `pdf-delete-pages.ts` | pdf | PDF 删除页面 |
| `pdf-encrypt.ts` | pdf | PDF 加密 |
| `pdf-extract-pages.ts` | pdf | PDF 提取页面 |
| `pdf-merge.ts` | pdf | PDF 合并 |
| `pdf-rotate.ts` | pdf | PDF 旋转 |
| `pdf-split.ts` | pdf | PDF 拆分 |
| `pdf-to-image.ts` | pdf | PDF 转图片 |
| `pdf-watermark.ts` | pdf | PDF 水印 |
| `perler-beads-registry.ts` | craft | 拼豆工具注册（客户端工具） |
| `perler-beads.ts` | craft | 拼豆色板数据和类型定义 |
| `qrcode-gen.ts` | dev | 二维码生成 |
| `regex-tester.ts` | text | 正则测试 |
| `sql-format.ts` | dev | SQL 格式化 |
| `text-case.ts` | text | 大小写转换 |
| `text-count.ts` | text | 字数统计 |
| `text-diff.ts` | text | 文本对比 |
| `timestamp.ts` | dev | 时间戳转换 |
| `url-encode.ts` | text | URL 编解码 |
| `url-parser.ts` | dev | URL 解析 |
| `uuid-gen.ts` | dev | UUID 生成 |
| `video-compress.ts` | video | 视频压缩 |
| `video-to-audio.ts` | video | 视频转音频 |
| `video-trim.ts` | video | 视频裁剪 |
| `xml-to-json.ts` | convert | XML 转 JSON |
| `yaml-to-json.ts` | convert | YAML 转 JSON |

#### 核心模块

| 文件 | 说明 |
|------|------|
| `analytics.ts` | Web Vitals 分析上报 |
| `api-utils.ts` | API 工具函数：输入解析、文件大小校验、响应构建 |
| `basePath.ts` | basePath 统一配置（CI 空 / 生产 `/furinakit`） |
| `constants.ts` | 常量定义（分类、排序等） |
| `errors.ts` | 错误定义（ToolError + ErrorCode 枚举） |
| `feedback.ts` | 反馈数据读写 |
| `format.ts` | 格式化工具（文件大小等） |
| `i18n.tsx` | 国际化 Hook（useI18n） |
| `registry.ts` | 工具注册表核心（Map 存储） |
| `stats-client.ts` | 客户端统计上报 |
| `stats.ts` | 服务端统计读写（带 mutex） |
| `tmp.ts` | 临时目录管理（createTempDir/cleanTempDir） |
| `utils.ts` | 通用工具函数（cn/apiPath 等） |

#### 国际化 (`locales/`)

| 文件 | 语言 |
|------|------|
| `zh.json` | 中文（简体） |
| `en.json` | English |
| `ja.json` | 日本語 |
| `ko.json` | 한국어 |

---

### `src/types/` — TypeScript 类型

```
src/types/
└── tool.ts                     # 工具类型定义（Tool/ToolResult/ToolInfo/ApiResponse）
```

---

## `tests/` — 单元测试

```
tests/
├── cli/
│   └── cli.test.ts             # CLI 命令测试（14 个用例）
└── tools/                      # 工具测试（62 个文件，357 个用例）
    ├── audio-convert.test.ts
    ├── audio-trim.test.ts
    ├── base-converter.test.ts
    ├── base64-to-image.test.ts
    ├── base64.test.ts
    ├── color-convert.test.ts
    ├── cron-gen.test.ts
    ├── cron-parser.test.ts
    ├── css-format.test.ts
    ├── csv-to-excel.test.ts
    ├── csv-to-json.test.ts
    ├── excel-to-csv.test.ts
    ├── file-hash.test.ts
    ├── file-info.test.ts
    ├── hash.test.ts
    ├── html-format.test.ts
    ├── image-add-watermark.test.ts
    ├── image-compress.test.ts
    ├── image-convert.test.ts
    ├── image-crop.test.ts
    ├── image-merge.test.ts
    ├── image-resize.test.ts
    ├── image-rotate.test.ts
    ├── image-to-base64.test.ts
    ├── image-to-ico.test.ts
    ├── image-to-pdf.test.ts
    ├── js-format.test.ts
    ├── json-format.test.ts
    ├── json-to-csv.test.ts
    ├── json-to-xml.test.ts
    ├── json-to-yaml.test.ts
    ├── jwt-decode.test.ts
    ├── lorem-gen.test.ts
    ├── markdown-to-html.test.ts
    ├── markdown-to-pdf.test.ts
    ├── password-gen.test.ts
    ├── pdf-add-page-numbers.test.ts
    ├── pdf-compress.test.ts
    ├── pdf-delete-pages.test.ts
    ├── pdf-encrypt.test.ts
    ├── pdf-extract-pages.test.ts
    ├── pdf-merge.test.ts
    ├── pdf-rotate.test.ts
    ├── pdf-split.test.ts
    ├── pdf-to-image.test.ts
    ├── pdf-watermark.test.ts
    ├── perler-beads.test.ts
    ├── qrcode-gen.test.ts
    ├── regex-tester.test.ts
    ├── sql-format.test.ts
    ├── text-case.test.ts
    ├── text-count.test.ts
    ├── text-diff.test.ts
    ├── timestamp.test.ts
    ├── url-encode.test.ts
    ├── url-parser.test.ts
    ├── uuid-gen.test.ts
    ├── video-compress.test.ts
    ├── video-to-audio.test.ts
    ├── video-trim.test.ts
    ├── xml-to-json.test.ts
    └── yaml-to-json.test.ts
```

---

## `.gitignore` 规则汇总

| 规则 | 说明 |
|------|------|
| `node_modules/` | 依赖包 |
| `.next/` | Next.js 构建输出 |
| `storybook-static/` | Storybook 构建输出 |
| `test-results/` | Playwright 测试结果 |
| `tsconfig.tsbuildinfo` | TypeScript 构建缓存 |
| `next-env.d.ts` | Next.js 类型声明 |
| `.env*` | 环境变量文件 |
| `/data/` | 运行时数据 |
| `/scripts/` | 部署脚本 |
| `/docs/archive/` | 历史文档归档 |
| `/.codegraph/` | CodeGraph MCP 索引 |
| `coverage/` | 测试覆盖率报告 |

---

## 统计数据

| 类别 | 数量 |
|------|------|
| 工具实现 | 62 个（9 个分类） |
| API 路由 | 66 个（62 工具 + 4 系统） |
| React 组件 | 55 个 |
| Storybook Stories | 15 个 |
| 单元测试文件 | 63 个 |
| 单元测试用例 | 357 个 |
| E2E 测试文件 | 11 个 |
| E2E 测试用例 | 91 个 |
| CLI 测试用例 | 14 个 |
| i18n 语言 | 4 种 |
| 工具分类 | 9 个（pdf/image/text/video/audio/dev/convert/file/craft） |

---

*本文档自动生成于 2026-06-03*
