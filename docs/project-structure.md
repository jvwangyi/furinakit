# FurinaKit 项目文件结构

> 最后更新：2026-06-06
> 工具数量：87 个
> 测试数量：497 个（472 单元 + 11 E2E + 14 CLI）

---

## 根目录

```
furinakit/
├── .claude/                    # Claude Code 配置
│   ├── settings.local.json     # 本地设置
│   └── skills/                 # Claude Skills
├── .github/                    # GitHub 配置
│   ├── ISSUE_TEMPLATE/         # Issue 模板
│   ├── pull_request_template.md
│   └── workflows/              # CI/CD 工作流
├── .storybook/                 # Storybook 配置
├── cli/                        # CLI 命令行工具
├── data/                       # 运行时数据（gitignore）
├── docs/                       # 项目文档
├── e2e/                        # E2E 测试
├── nginx/                      # Nginx 配置
├── prisma/                     # 数据库
├── public/                     # 静态资源
├── scripts/                    # 工具脚本
├── src/                        # 源代码
├── tests/                      # 单元测试
├── .dockerignore               # Docker 忽略规则
├── .env                        # 环境变量（gitignore）
├── .env.example                # 环境变量示例
├── .env.local                  # 本地环境变量（gitignore）
├── .gitignore                  # Git 忽略规则
├── AGENTS.md                   # Next.js Agent 规则（gitignore）
├── CHANGELOG.md                # 版本日志
├── CLAUDE.md                   # Claude 开发指南
├── CODE_OF_CONDUCT.md          # 社区行为准则
├── CONTRIBUTING.md             # 贡献指南
├── Dockerfile                  # Docker 构建文件
├── LICENSE                     # MIT 开源许可证
├── README.md                   # 项目文档（四语言）
├── SECURITY.md                 # 安全策略
├── components.json             # shadcn/ui 配置
├── docker-compose.yml          # Docker 编排
├── eslint.config.mjs           # ESLint 配置
├── next-env.d.ts               # Next.js 类型声明（gitignore）
├── next.config.ts              # Next.js 配置
├── package-lock.json           # 依赖锁定
├── package.json                # 项目配置
├── playwright.config.ts        # Playwright E2E 配置
├── postcss.config.mjs          # PostCSS 配置
├── prisma.config.ts            # Prisma 配置
├── skills-lock.json            # Claude Skills 锁定
├── tsconfig.json               # TypeScript 配置
├── tsconfig.tsbuildinfo        # TS 构建缓存（gitignore）
└── vitest.config.mts           # Vitest 单元测试配置
```

### 根目录文件说明

#### 项目文档

| 文件 | 用途 |
|------|------|
| `README.md` | 项目文档，包含中文/English/日本語/한국어 四语言 |
| `CHANGELOG.md` | 版本更新记录 |
| `CONTRIBUTING.md` | 如何参与项目开发 |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 行为准则 |
| `SECURITY.md` | 安全漏洞报告指南 |
| `LICENSE` | MIT 开源许可证 |

#### AI/开发工具配置

| 文件 | 用途 |
|------|------|
| `CLAUDE.md` | Claude Code 开发指南：工具开发流程、编码规范、安全要点 |
| `AGENTS.md` | Next.js 16 Agent 规则（自动生成，gitignore） |
| `skills-lock.json` | Claude Skills 版本锁定 |

#### 环境配置

| 文件 | 用途 |
|------|------|
| `.env` | 环境变量（不提交到 git） |
| `.env.example` | 环境变量示例 |
| `.env.local` | 本地环境变量（不提交到 git） |

#### 构建工具配置

| 文件 | 用途 |
|------|------|
| `package.json` | 项目配置、依赖、脚本 |
| `package-lock.json` | 依赖版本锁定 |
| `tsconfig.json` | TypeScript 编译选项、路径别名 `@/` → `src/` |
| `next.config.ts` | Next.js 配置：CI 环境 basePath 为空，生产为 `/furinakit` |
| `vitest.config.mts` | Vitest 单元测试配置 |
| `playwright.config.ts` | Playwright E2E 测试配置 |
| `eslint.config.mjs` | ESLint 代码规范配置 |
| `postcss.config.mjs` | PostCSS CSS 处理插件配置 |
| `prisma.config.ts` | Prisma 数据库配置 |
| `components.json` | shadcn/ui 组件库配置（主题、路径别名） |

#### Docker 配置

| 文件 | 用途 |
|------|------|
| `Dockerfile` | Docker 构建文件（Node.js 22） |
| `docker-compose.yml` | Docker 编排配置 |
| `.dockerignore` | Docker 忽略规则 |

#### Git 配置

| 文件 | 用途 |
|------|------|
| `.gitignore` | Git 忽略规则 |

---

## `.claude/` — Claude Code 配置

```
.claude/
├── settings.local.json         # Claude Code 本地设置
└── skills/                     # Claude Skills
    └── shadcn/                 # shadcn/ui 技能
        ├── SKILL.md            # 技能说明
        ├── cli.md              # CLI 使用指南
        ├── customization.md    # 自定义指南
        ├── mcp.md              # MCP 集成
        ├── registry.md         # 组件注册
        ├── agents/             # Agent 配置
        ├── assets/             # 资源文件
        ├── evals/              # 评估配置
        └── rules/              # 规则文件
```

| 文件 | 用途 |
|------|------|
| `settings.local.json` | Claude Code 本地设置（不提交到 git） |
| `skills/shadcn/` | shadcn/ui 组件库技能配置 |

---

## `.github/` — GitHub 配置

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md           # Bug 报告模板
│   └── feature_request.md      # 功能请求模板
├── pull_request_template.md    # PR 模板
└── workflows/
    ├── ci.yml                  # CI 流水线
    └── deploy.yml              # 部署流水线
```

| 文件 | 用途 |
|------|------|
| `bug_report.md` | Issue 模板：Bug 报告 |
| `feature_request.md` | Issue 模板：功能建议 |
| `pull_request_template.md` | PR 模板 |
| `ci.yml` | GitHub Actions：push/PR 触发 → 单元测试 → 构建 → E2E 测试 |
| `deploy.yml` | GitHub Actions：master 分支触发 → 构建 → 部署 |

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
├── reference/
│   ├── colorSystemMapping.json # 颜色品牌映射参考
│   └── pbdx-palettes.json     # 拼豆色板参考数据
├── deployment-guide.md         # 部署指南
├── development-guide.md        # 开发指南
├── maintenance-guide.md        # 维护指南
├── project-structure.md        # 项目结构说明（本文件）
└── usage-guide.md              # 使用指南（Web/API/CLI）
```

---

## `e2e/` — E2E 测试（Playwright）

```
e2e/
├── audio-video-tools.spec.ts   # 音视频工具测试
├── dev-tools.spec.ts           # 开发工具测试
├── feedback.spec.ts            # 反馈系统测试
├── homepage.spec.ts            # 首页测试
├── i18n.spec.ts                # 国际化测试
├── image-tools.spec.ts         # 图片工具测试
├── navigation.spec.ts          # 导航测试
├── pdf-tools.spec.ts           # PDF 工具测试
├── search.spec.ts              # 搜索测试
├── text-tools.spec.ts          # 文本工具测试
└── tool-page.spec.ts           # 工具页面测试
```

---

## `nginx/` — Nginx 配置

```
nginx/
└── default.conf                # Nginx 反向代理配置
```

---

## `prisma/` — 数据库

```
prisma/
├── dev.db                      # SQLite 开发数据库（gitignore）
├── migrations/                 # 数据库迁移文件
└── schema.prisma               # 数据库模型定义
```

### 主要模型

| 模型 | 说明 |
|------|------|
| `User` | 用户 |
| `Account` | OAuth 账户 |
| `Session` | 会话 |
| `VerificationToken` | 验证码 |
| `ToolUsageHistory` | 工具使用历史 |
| `Favorite` | 收藏 |

---

## `public/` — 静态资源

```
public/
├── furina.jpg                  # 项目图标/Logo
└── sw.js                       # Service Worker（PWA 离线支持）
```

---

## `scripts/` — 工具脚本

```
scripts/
├── check_i18n.cjs              # i18n 完整性检查
├── check-routes.mjs            # 路由检查
├── list-tools.mjs              # 工具列表
└── start_ssh_tunnel.bat        # Windows SSH 隧道脚本
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
├── api/                        # API 路由
├── api-docs/
│   └── page.tsx                # Swagger UI 页面
├── auth/
│   ├── signin/                 # 登录页面
│   └── verify-request/         # 验证请求页面
├── dashboard/                  # 用户仪表盘
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
| `convert/route.ts` | audio-convert | 音频格式转换 |
| `trim/route.ts` | audio-trim | 音频裁剪 |

#### 认证 (`/api/auth/`)

| 路由 | 说明 |
|------|------|
| `[...nextauth]/route.ts` | NextAuth 处理 |
| `api-keys/route.ts` | API Key 管理 |
| `login/route.ts` | 登录 |
| `magic-link/route.ts` | 魔法链接 |
| `register/route.ts` | 注册 |
| `reset-password/route.ts` | 重置密码 |
| `reset-password/confirm/route.ts` | 确认重置 |
| `verify/route.ts` | 验证 |
| `verify-code/route.ts` | 验证码 |

#### 格式转换 (`/api/convert/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `barcode-gen/route.ts` | barcode-gen | 条形码生成 |
| `base64-to-image/route.ts` | base64-to-image | Base64 转图片 |
| `csv-to-excel/route.ts` | csv-to-excel | CSV 转 Excel |
| `excel-to-csv/route.ts` | excel-to-csv | Excel 转 CSV |
| `image-to-base64/route.ts` | image-to-base64 | 图片转 Base64 |
| `image-to-pdf/route.ts` | image-to-pdf | 图片转 PDF |
| `markdown-to-pdf/route.ts` | markdown-to-pdf | Markdown 转 PDF |
| `xml-to-json/route.ts` | xml-to-json | XML 转 JSON |
| `yaml-to-json/route.ts` | yaml-to-json | YAML 转 JSON |

#### 手工创意 (`/api/craft/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `word-cloud/route.ts` | word-cloud | 词云生成 |

#### 开发工具 (`/api/dev/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `ascii-art/route.ts` | ascii-art | ASCII 艺术字 |
| `base-converter/route.ts` | base-converter | 进制转换 |
| `code-minify/route.ts` | code-minify | 代码压缩 |
| `color-convert/route.ts` | color-convert | 颜色转换 |
| `color-palette/route.ts` | color-palette | 调色板 |
| `cron-gen/route.ts` | cron-gen | Cron 生成 |
| `cron-parser/route.ts` | cron-parser | Cron 解析 |
| `css-format/route.ts` | css-format | CSS 格式化 |
| `css-gradient/route.ts` | css-gradient | CSS 渐变 |
| `dns-lookup/route.ts` | dns-lookup | DNS 查询 |
| `html-format/route.ts` | html-format | HTML 格式化 |
| `ip-lookup/route.ts` | ip-lookup | IP 查询 |
| `js-format/route.ts` | js-format | JS 格式化 |
| `json-schema-validate/route.ts` | json-schema-validate | JSON Schema 校验 |
| `jwt-decode/route.ts` | jwt-decode | JWT 解码 |
| `lorem-gen/route.ts` | lorem-gen | Lorem 生成 |
| `openapi-viewer/route.ts` | openapi-viewer | OpenAPI 查看 |
| `password-gen/route.ts` | password-gen | 密码生成 |
| `qrcode-gen/route.ts` | qrcode-gen | 二维码生成 |
| `sql-format/route.ts` | sql-format | SQL 格式化 |
| `ssl-checker/route.ts` | ssl-checker | SSL 检查 |
| `svg-optimize/route.ts` | svg-optimize | SVG 优化 |
| `text-crypto/route.ts` | text-crypto | 文本加密 |
| `timestamp/route.ts` | timestamp | 时间戳 |
| `unit-converter/route.ts` | unit-converter | 单位换算 |
| `url-parser/route.ts` | url-parser | URL 解析 |
| `user-agent-parser/route.ts` | user-agent-parser | UA 解析 |
| `uuid-gen/route.ts` | uuid-gen | UUID 生成 |

#### 文件工具 (`/api/file/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `file-hash/route.ts` | file-hash | 文件哈希 |
| `file-info/route.ts` | file-info | 文件信息 |

#### 图片工具 (`/api/image/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `add-text/route.ts` | image-add-text | 添加文字 |
| `add-watermark/route.ts` | image-add-watermark | 添加水印 |
| `compress/route.ts` | image-compress | 图片压缩 |
| `convert/route.ts` | image-convert | 格式转换 |
| `crop/route.ts` | image-crop | 图片裁剪 |
| `gif-maker/route.ts` | gif-maker | GIF 制作 |
| `image-compare/route.ts` | image-compare | 图片对比 |
| `image-exif/route.ts` | image-exif | EXIF 信息 |
| `merge/route.ts` | image-merge | 图片合并 |
| `resize/route.ts` | image-resize | 图片缩放 |
| `rotate/route.ts` | image-rotate | 图片旋转 |
| `to-ico/route.ts` | image-to-ico | 转 ICO |

#### PDF 工具 (`/api/pdf/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `add-page-numbers/route.ts` | pdf-add-page-numbers | 添加页码 |
| `compress/route.ts` | pdf-compress | PDF 压缩 |
| `delete-pages/route.ts` | pdf-delete-pages | 删除页面 |
| `encrypt/route.ts` | pdf-encrypt | PDF 加密 |
| `extract-pages/route.ts` | pdf-extract-pages | 提取页面 |
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
| `diff/route.ts` | text-diff | 文本对比 |
| `font-preview/route.ts` | font-preview | 字体预览 |
| `hash/route.ts` | hash | 哈希计算 |
| `json-format/route.ts` | json-format | JSON 格式化 |
| `json-to-csv/route.ts` | json-to-csv | JSON 转 CSV |
| `json-to-xml/route.ts` | json-to-xml | JSON 转 XML |
| `json-to-yaml/route.ts` | json-to-yaml | JSON 转 YAML |
| `markdown-live/route.ts` | markdown-live | Markdown 编辑器 |
| `markdown-to-html/route.ts` | markdown-to-html | Markdown 转 HTML |
| `regex-tester/route.ts` | regex-tester | 正则测试 |
| `text-case/route.ts` | text-case | 大小写转换 |
| `text-count/route.ts` | text-count | 字数统计 |
| `url-encode/route.ts` | url-encode | URL 编解码 |

#### 视频工具 (`/api/video/`)

| 路由 | 工具 | 说明 |
|------|------|------|
| `compress/route.ts` | video-compress | 视频压缩 |
| `to-audio/route.ts` | video-to-audio | 视频转音频 |
| `trim/route.ts` | video-trim | 视频裁剪 |
| `video-thumbnail/route.ts` | video-thumbnail | 视频缩略图 |

#### 系统 API

| 路由 | 说明 |
|------|------|
| `docs/spec/route.ts` | OpenAPI 规范生成 |
| `errors/route.ts` | 错误监控 |
| `feedback/route.ts` | 用户反馈 |
| `health/route.ts` | 健康检查 |
| `progress/[id]/route.ts` | 进度查询 |
| `recent-tools/route.ts` | 最近使用工具 |
| `stats/route.ts` | 使用统计 |
| `tools/route.ts` | 工具列表 |
| `user/favorites/route.ts` | 用户收藏 |
| `user/history/route.ts` | 用户历史 |
| `user/stats/route.ts` | 用户统计 |

---

### `src/components/` — React 组件

#### 布局组件 (`layout/`)

| 文件 | 说明 |
|------|------|
| `BackToTop.tsx` | 返回顶部按钮 |
| `Breadcrumb.tsx` | 面包屑导航 |
| `Breadcrumb.stories.tsx` | 面包屑 Storybook |
| `LanguageSwitcher.tsx` | 语言切换器 |
| `MobileNav.tsx` | 移动端导航抽屉 |
| `Sidebar.tsx` | 桌面端侧边栏 |
| `ThemeToggle.tsx` | 主题切换 |

#### Providers (`providers/`)

| 文件 | 说明 |
|------|------|
| `ThemeProvider.tsx` | 主题 Provider |
| `providers.tsx` | 全局 Providers 组合 |

#### 共享组件 (`shared/`)

| 文件 | 说明 |
|------|------|
| `TermLabel.tsx` | 术语标签 |

#### 工具组件 (`tools/`)

| 文件 | 说明 |
|------|------|
| `ColorPicker.tsx` | 颜色选择器 |
| `CropSelector.tsx` | 裁剪选区 |
| `DiffViewer.tsx` | 差异查看器 |
| `FeedbackForm.tsx` | 反馈表单 |
| `FileUploader.tsx` | 文件上传器 |
| `ImagePreview.tsx` | 图片预览 |
| `JsonTreeView.tsx` | JSON 树形视图 |
| `MarkdownPreview.tsx` | Markdown 预览 |
| `PDFPreview.tsx` | PDF 预览 |
| `QRCodePreview.tsx` | 二维码预览 |
| `RecentTools.tsx` | 最近使用工具 |
| `RegexPreview.tsx` | 正则预览 |
| `ToolCard.tsx` | 工具卡片 |
| `ToolFileSection.tsx` | 文件上传区域 |
| `ToolHelp.tsx` | 工具帮助 |
| `ToolOptions.tsx` | 工具选项 |
| `ToolPageContainer.tsx` | 工具页面容器 |
| `ToolResult.tsx` | 结果展示 |
| `*.stories.tsx` | Storybook 文档 |

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

#### 其他组件

| 文件 | 说明 |
|------|------|
| `ErrorBoundary.tsx` | React 错误边界 |

---

### `src/lib/` — 核心库

#### 工具实现 (`tools/`)

87 个工具实现文件，详见 [development-guide.md](development-guide.md)

| 文件 | 分类 | 说明 |
|------|------|------|
| `index.ts` | - | 工具注册入口 |
| `registry.ts` | - | 工具注册表 |
| `ascii-art.ts` | dev | ASCII 艺术字 |
| `audio-convert.ts` | audio | 音频转换 |
| `audio-trim.ts` | audio | 音频裁剪 |
| `barcode-gen.ts` | dev | 条形码生成 |
| `base-converter.ts` | dev | 进制转换 |
| `base64-to-image.ts` | convert | Base64 转图片 |
| `base64.ts` | text | Base64 编解码 |
| `business-card.ts` | craft | 电子名片 |
| `code-minify.ts` | dev | 代码压缩 |
| `color-convert.ts` | dev | 颜色转换 |
| `color-palette.ts` | dev | 调色板 |
| `cron-gen.ts` | dev | Cron 生成 |
| `cron-parser.ts` | dev | Cron 解析 |
| `css-format.ts` | dev | CSS 格式化 |
| `css-gradient.ts` | dev | CSS 渐变 |
| `csv-to-excel.ts` | convert | CSV 转 Excel |
| `csv-to-json.ts` | text | CSV 转 JSON |
| `dns-lookup.ts` | dev | DNS 查询 |
| `excel-to-csv.ts` | convert | Excel 转 CSV |
| `file-hash.ts` | file | 文件哈希 |
| `file-info.ts` | file | 文件信息 |
| `font-preview.ts` | dev | 字体预览 |
| `gif-maker.ts` | image | GIF 制作 |
| `hash.ts` | text | 哈希计算 |
| `html-format.ts` | dev | HTML 格式化 |
| `image-add-text.ts` | image | 添加文字 |
| `image-add-watermark.ts` | image | 添加水印 |
| `image-compare.ts` | image | 图片对比 |
| `image-compress.ts` | image | 图片压缩 |
| `image-convert.ts` | image | 格式转换 |
| `image-crop.ts` | image | 图片裁剪 |
| `image-exif.ts` | image | EXIF 信息 |
| `image-merge.ts` | image | 图片合并 |
| `image-resize.ts` | image | 图片缩放 |
| `image-rotate.ts` | image | 图片旋转 |
| `image-to-base64.ts` | convert | 图片转 Base64 |
| `image-to-ico.ts` | image | 转 ICO |
| `image-to-pdf.ts` | convert | 图片转 PDF |
| `ip-lookup.ts` | dev | IP 查询 |
| `js-format.ts` | dev | JS 格式化 |
| `json-format.ts` | text | JSON 格式化 |
| `json-schema-validate.ts` | dev | JSON Schema 校验 |
| `json-to-csv.ts` | text | JSON 转 CSV |
| `json-to-xml.ts` | text | JSON 转 XML |
| `json-to-yaml.ts` | text | JSON 转 YAML |
| `jwt-decode.ts` | dev | JWT 解码 |
| `lorem-gen.ts` | dev | Lorem 生成 |
| `markdown-live.ts` | text | Markdown 编辑器 |
| `markdown-to-html.ts` | text | Markdown 转 HTML |
| `markdown-to-pdf.ts` | convert | Markdown 转 PDF |
| `openapi-viewer.ts` | dev | OpenAPI 查看 |
| `password-gen.ts` | dev | 密码生成 |
| `pdf-add-page-numbers.ts` | pdf | 添加页码 |
| `pdf-compress.ts` | pdf | PDF 压缩 |
| `pdf-delete-pages.ts` | pdf | 删除页面 |
| `pdf-encrypt.ts` | pdf | PDF 加密 |
| `pdf-extract-pages.ts` | pdf | 提取页面 |
| `pdf-merge.ts` | pdf | PDF 合并 |
| `pdf-rotate.ts` | pdf | PDF 旋转 |
| `pdf-split.ts` | pdf | PDF 拆分 |
| `pdf-to-image.ts` | pdf | PDF 转图片 |
| `pdf-watermark.ts` | pdf | PDF 水印 |
| `perler-beads-registry.ts` | craft | 拼豆注册 |
| `perler-beads.ts` | craft | 拼豆实现 |
| `pomodoro.ts` | craft | 番茄钟 |
| `qrcode-gen.ts` | dev | 二维码生成 |
| `regex-tester.ts` | text | 正则测试 |
| `sql-format.ts` | dev | SQL 格式化 |
| `ssl-checker.ts` | dev | SSL 检查 |
| `svg-optimize.ts` | image | SVG 优化 |
| `text-case.ts` | text | 大小写转换 |
| `text-count.ts` | text | 字数统计 |
| `text-crypto.ts` | text | 文本加密 |
| `text-diff.ts` | text | 文本对比 |
| `timestamp.ts` | dev | 时间戳 |
| `unit-converter.ts` | dev | 单位换算 |
| `url-encode.ts` | text | URL 编解码 |
| `url-parser.ts` | dev | URL 解析 |
| `user-agent-parser.ts` | dev | UA 解析 |
| `uuid-gen.ts` | dev | UUID 生成 |
| `video-compress.ts` | video | 视频压缩 |
| `video-thumbnail.ts` | video | 视频缩略图 |
| `video-to-audio.ts` | video | 视频转音频 |
| `video-trim.ts` | video | 视频裁剪 |
| `word-cloud.ts` | craft | 词云生成 |
| `xml-to-json.ts` | convert | XML 转 JSON |
| `yaml-to-json.ts` | convert | YAML 转 JSON |

#### 核心模块

| 文件 | 说明 |
|------|------|
| `analytics.ts` | Web Vitals 分析上报 |
| `api-utils.ts` | API 工具函数 |
| `auth.ts` | 认证逻辑 |
| `basePath.ts` | basePath 配置 |
| `constants.ts` | 常量定义 |
| `error-monitor.ts` | 错误监控 |
| `errors.ts` | 错误定义（ToolError + ErrorCode） |
| `feedback.ts` | 反馈数据读写 |
| `format.ts` | 格式化工具 |
| `hooks/` | 自定义 React Hooks |
| `i18n.tsx` | 国际化 Hook |
| `logger.ts` | 日志（pino） |
| `prisma.ts` | Prisma Client |
| `progress.ts` | 进度管理 |
| `rate-limit.ts` | 速率限制 |
| `registry.ts` | 工具注册表 |
| `sanitize.ts` | 输入清洗 |
| `stats-client.ts` | 客户端统计 |
| `stats.ts` | 服务端统计 |
| `tmp.ts` | 临时目录管理 |
| `tool-stats.ts` | 工具统计 |
| `utils.ts` | 通用工具函数 |
| `validation.ts` | 输入校验 |

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
├── next-auth.d.ts              # NextAuth 类型扩展
└── tool.ts                     # 工具类型定义
```

---

## `tests/` — 单元测试

```
tests/
├── cli/
│   └── cli.test.ts             # CLI 命令测试（14 个用例）
└── tools/                      # 工具测试（88 个文件，472 个用例）
    ├── ascii-art.test.ts
    ├── audio-convert.test.ts
    ├── audio-trim.test.ts
    ├── barcode-gen.test.ts
    ├── base-converter.test.ts
    ├── base64-to-image.test.ts
    ├── base64.test.ts
    ├── business-card.test.ts
    ├── code-minify.test.ts
    ├── color-convert.test.ts
    ├── color-palette.test.ts
    ├── cron-gen.test.ts
    ├── cron-parser.test.ts
    ├── css-format.test.ts
    ├── css-gradient.test.ts
    ├── csv-to-excel.test.ts
    ├── csv-to-json.test.ts
    ├── dns-lookup.test.ts
    ├── excel-to-csv.test.ts
    ├── file-hash.test.ts
    ├── file-info.test.ts
    ├── font-preview.test.ts
    ├── gif-maker.test.ts
    ├── hash.test.ts
    ├── html-format.test.ts
    ├── image-add-text.test.ts
    ├── image-add-watermark.test.ts
    ├── image-compare.test.ts
    ├── image-compress.test.ts
    ├── image-convert.test.ts
    ├── image-crop.test.ts
    ├── image-exif.test.ts
    ├── image-merge.test.ts
    ├── image-resize.test.ts
    ├── image-rotate.test.ts
    ├── image-to-base64.test.ts
    ├── image-to-ico.test.ts
    ├── image-to-pdf.test.ts
    ├── ip-lookup.test.ts
    ├── js-format.test.ts
    ├── json-format.test.ts
    ├── json-schema-validate.test.ts
    ├── json-to-csv.test.ts
    ├── json-to-xml.test.ts
    ├── json-to-yaml.test.ts
    ├── jwt-decode.test.ts
    ├── lorem-gen.test.ts
    ├── markdown-live.test.ts
    ├── markdown-to-html.test.ts
    ├── markdown-to-pdf.test.ts
    ├── openapi-viewer.test.ts
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
    ├── perler-beads-registry.test.ts
    ├── perler-beads.test.ts
    ├── pomodoro.test.ts
    ├── qrcode-gen.test.ts
    ├── regex-tester.test.ts
    ├── sql-format.test.ts
    ├── ssl-checker.test.ts
    ├── svg-optimize.test.ts
    ├── text-case.test.ts
    ├── text-count.test.ts
    ├── text-crypto.test.ts
    ├── text-diff.test.ts
    ├── timestamp.test.ts
    ├── unit-converter.test.ts
    ├── url-encode.test.ts
    ├── url-parser.test.ts
    ├── user-agent-parser.test.ts
    ├── uuid-gen.test.ts
    ├── video-compress.test.ts
    ├── video-thumbnail.test.ts
    ├── video-to-audio.test.ts
    ├── video-trim.test.ts
    ├── word-cloud.test.ts
    ├── xml-to-json.test.ts
    └── yaml-to-json.test.ts
```

---

## 构建产物和生成目录（gitignore）

以下目录由构建工具自动生成，不提交到 git：

```
.next/                      # Next.js 构建输出
├── static/                 # 静态资源
├── server/                 # 服务端渲染
├── cache/                  # 构建缓存
└── standalone/             # 独立部署文件

node_modules/               # npm 依赖包
storybook-static/           # Storybook 构建输出
test-results/               # Playwright 测试结果
coverage/                   # 测试覆盖率报告
tsconfig.tsbuildinfo        # TypeScript 构建缓存
next-env.d.ts               # Next.js 类型声明
.codegraph/                 # CodeGraph MCP 索引
```

| 目录/文件 | 生成方式 | 用途 |
|-----------|----------|------|
| `.next/` | `npm run build` | Next.js 编译输出，生产部署需要 |
| `node_modules/` | `npm install` | 第三方依赖包 |
| `storybook-static/` | `npm run build-storybook` | Storybook 静态站点 |
| `test-results/` | `npx playwright test` | E2E 测试结果和截图 |
| `coverage/` | `npx vitest run --coverage` | 测试覆盖率报告 |
| `tsconfig.tsbuildinfo` | `npx tsc` | TypeScript 增量编译缓存 |
| `next-env.d.ts` | `npm run dev` | Next.js 类型声明（自动生成） |
| `.codegraph/` | CodeGraph MCP | 代码索引数据库 |

### 重建命令

```bash
# 清理所有构建产物
rm -rf .next node_modules storybook-static test-results coverage

# 重新安装依赖
npm install

# 重新构建
npm run build

# 重新生成 Prisma Client
npx prisma generate
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
| `AGENTS.md` | 自动生成文件 |
| `/AGENTS.md` | 自动生成文件 |
| `/findings.md` | 临时文件 |
| `/progress.md` | 临时文件 |
| `/task_plan.md` | 临时文件 |

---

## 统计数据

| 类别 | 数量 |
|------|------|
| 工具实现 | 87 个（9 个分类） |
| API 路由 | 87 个（工具） + 15 个（系统） |
| React 组件 | 55 个 |
| Storybook Stories | 12 个 |
| 单元测试文件 | 88 个 |
| 单元测试用例 | 472 个 |
| E2E 测试文件 | 11 个 |
| CLI 测试用例 | 14 个 |
| i18n 语言 | 4 种 |
| 工具分类 | 9 个（pdf/image/text/video/audio/dev/convert/file/craft） |

---

*本文档更新于 2026-06-06*
