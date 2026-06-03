# FurinaKit 项目结构

> 最后更新：2026-06-03
> 工具数量：62 个
> 测试数量：410 个

---

## 📁 根目录文件

### 配置文件

| 文件 | 用途 | 说明 |
|------|------|------|
| `package.json` | 项目配置 | 定义依赖、脚本、项目元信息 |
| `package-lock.json` | 依赖锁定 | 锁定依赖版本，确保一致性 |
| `tsconfig.json` | TypeScript 配置 | 编译选项、路径别名、类型检查 |
| `next.config.ts` | Next.js 配置 | basePath、assetPrefix、动态环境配置 |
| `playwright.config.ts` | Playwright 配置 | E2E 测试设置、浏览器配置 |
| `vitest.config.mts` | Vitest 配置 | 单元测试设置、覆盖率配置 |
| `eslint.config.mjs` | ESLint 配置 | 代码规范、lint 规则 |
| `postcss.config.mjs` | PostCSS 配置 | CSS 处理插件 |
| `components.json` | shadcn/ui 配置 | UI 组件库配置 |
| `.env.local` | 环境变量 | 本地环境配置（不提交） |

### 文档文件

| 文件 | 用途 | 说明 |
|------|------|------|
| `README.md` | 项目文档 | 四语言支持，项目介绍、使用说明 |
| `LICENSE` | 许可证 | MIT 开源许可证 |
| `CHANGELOG.md` | 版本日志 | 版本更新记录 |
| `CONTRIBUTING.md` | 贡献指南 | 如何参与项目开发 |
| `CODE_OF_CONDUCT.md` | 行为准则 | 社区行为规范 |
| `CLAUDE.md` | Claude 开发指南 | AI 助手开发规范、工具开发流程 |
| `AGENTS.md` | Agent 配置 | Next.js Agent 规则 |
| `MAINTENANCE_PLAN.md` | 维护计划 | 项目维护记录和计划 |

### 工具脚本

| 文件 | 用途 | 说明 |
|------|------|------|
| `check_i18n.cjs` | i18n 检查工具 | 检查翻译完整性，运行：`node check_i18n.cjs` |

### 构建产物（已排除）

| 目录 | 说明 | .gitignore |
|------|------|------------|
| `node_modules/` | 依赖包 | ✅ 已排除 |
| `.next/` | Next.js 构建输出 | ✅ 已排除 |
| `storybook-static/` | Storybook 构建输出 | ✅ 已排除 |
| `test-results/` | Playwright 测试结果 | ✅ 已排除 |
| `tsconfig.tsbuildinfo` | TypeScript 构建信息 | ✅ 已排除 |
| `next-env.d.ts` | Next.js 类型声明 | ✅ 已排除 |

---

## 📂 目录结构

### `.github/` - GitHub 配置

```
.github/
├── ISSUE_TEMPLATE/
│   ├── bug_report.md          # Bug 报告模板
│   └── feature_request.md     # 功能请求模板
└── workflows/
    └── ci.yml                 # CI 工作流（单元测试 + E2E 测试）
```

| 文件 | 用途 |
|------|------|
| `bug_report.md` | Issue 模板，用于报告 Bug |
| `feature_request.md` | Issue 模板，用于功能建议 |
| `ci.yml` | GitHub Actions CI，自动运行测试和构建 |

### `.storybook/` - Storybook 配置

```
.storybook/
├── main.ts                    # Storybook 主配置
└── preview.tsx                # 预览配置
```

| 文件 | 用途 |
|------|------|
| `main.ts` | 配置 Storybook 构建选项、插件 |
| `preview.tsx` | 全局装饰器、参数 |

### `cli/` - 命令行工具

```
cli/
├── index.ts                   # CLI 入口，注册命令组
└── commands/
    ├── pdf.ts                 # PDF 命令组（merge, split, compress）
    ├── image.ts               # 图片命令组（compress, convert, crop）
    └── text.ts                # 文本命令组（json-format, hash, base64）
```

| 文件 | 用途 |
|------|------|
| `index.ts` | CLI 主入口，使用 Commander.js 注册命令 |
| `pdf.ts` | PDF 相关命令：merge, split, compress, rotate |
| `image.ts` | 图片相关命令：compress, convert, crop, resize |
| `text.ts` | 文本相关命令：json-format, hash, base64, url-encode, diff |

### `docs/` - 项目文档

```
docs/
├── api/                       # API 文档
│   └── openapi.yaml           # OpenAPI 规范
├── archive/                   # 历史文档归档
│   ├── execution-plan.md
│   ├── findings.md
│   ├── progress.md
│   └── ...
├── reference/                 # 参考资料
│   ├── colorSystemMapping.json  # 颜色品牌映射
│   └── pbdx-palettes.json       # 色板数据库
├── project-structure.md       # 项目结构（本文件）
├── audit-plan.md              # 审计计划
├── code-analysis.md           # 代码分析
├── feature-report.md          # 功能报告
├── final-audit-report.md      # 最终审计报告
├── missing-tools.md           # 缺失工具清单
├── project-report.md          # 项目报告
├── tool-audit.md              # 工具审计
├── tool-review-plan.md        # 工具审查计划
├── ui-optimization.md         # UI 优化文档
└── ux-review.md               # UX 审查文档
```

### `e2e/` - E2E 测试

```
e2e/
├── homepage.spec.ts           # 首页测试
├── navigation.spec.ts         # 导航测试
├── search.spec.ts             # 搜索测试
├── text-tools.spec.ts         # 文本工具测试
├── pdf-tools.spec.ts          # PDF 工具测试
├── image-tools.spec.ts        # 图片工具测试
├── audio-video-tools.spec.ts  # 音视频工具测试
├── dev-tools.spec.ts          # 开发工具测试
├── feedback.spec.ts           # 反馈系统测试
├── i18n.spec.ts               # 国际化测试
└── tool-page.spec.ts          # 工具页面测试
```

| 文件 | 测试内容 |
|------|----------|
| `homepage.spec.ts` | 首页加载、工具列表、搜索过滤 |
| `navigation.spec.ts` | 侧边栏导航、分类切换、主题切换 |
| `search.spec.ts` | 搜索功能、过滤、清空 |
| `text-tools.spec.ts` | json-format, hash, uuid-gen, base64 |
| `pdf-tools.spec.ts` | pdf-rotate, pdf-compress, pdf-split, pdf-merge |
| `image-tools.spec.ts` | image-compress, image-convert, image-crop, image-resize |
| `audio-video-tools.spec.ts` | audio-convert, audio-trim, video-compress, video-trim |
| `dev-tools.spec.ts` | base64, url-encode, timestamp, regex-tester, color-convert |
| `feedback.spec.ts` | 反馈表单、评分、提交 |
| `i18n.spec.ts` | 语言切换、翻译完整性 |
| `tool-page.spec.ts` | 工具页面加载、选项、执行按钮 |

### `public/` - 静态资源

```
public/
├── furina.jpg                 # 项目图片/Logo
├── next.svg                   # Next.js 图标
├── sw.js                      # Service Worker
└── vercel.svg                 # Vercel 图标
```

### `scripts/` - 脚本

```
scripts/
└── start_ssh_tunnel.bat       # SSH 隧道脚本（部署用）
```

### `tests/` - 单元测试

```
tests/
├── cli/                       # CLI 测试
│   └── cli.test.ts            # CLI 命令测试（14 个用例）
└── tools/                     # 工具测试
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

## 📦 `src/` - 源代码

### `src/app/` - Next.js App Router

```
src/app/
├── [category]/                # 动态分类路由
│   ├── page.tsx               # 分类页面
│   └── [tool]/                # 动态工具路由
│       ├── page.tsx           # 工具页面
│       └── perler-client.tsx  # 拼豆工具客户端组件
├── api/                       # API 路由
│   ├── audio/                 # 音频工具 API
│   │   ├── convert/route.ts
│   │   └── trim/route.ts
│   ├── convert/               # 格式转换 API
│   │   ├── base64-to-image/route.ts
│   │   ├── csv-to-excel/route.ts
│   │   ├── excel-to-csv/route.ts
│   │   ├── image-to-base64/route.ts
│   │   ├── image-to-pdf/route.ts
│   │   ├── markdown-to-pdf/route.ts
│   │   ├── xml-to-json/route.ts
│   │   └── yaml-to-json/route.ts
│   ├── dev/                   # 开发工具 API
│   │   ├── base-converter/route.ts
│   │   ├── color-convert/route.ts
│   │   ├── cron-gen/route.ts
│   │   ├── cron-parser/route.ts
│   │   ├── css-format/route.ts
│   │   ├── html-format/route.ts
│   │   ├── js-format/route.ts
│   │   ├── jwt-decode/route.ts
│   │   ├── lorem-gen/route.ts
│   │   ├── password-gen/route.ts
│   │   ├── qrcode-gen/route.ts
│   │   ├── sql-format/route.ts
│   │   ├── timestamp/route.ts
│   │   ├── url-parser/route.ts
│   │   └── uuid-gen/route.ts
│   ├── docs/                  # API 文档
│   │   └── spec/route.ts
│   ├── feedback/route.ts      # 反馈 API
│   ├── file/                  # 文件工具 API
│   │   ├── file-hash/route.ts
│   │   └── file-info/route.ts
│   ├── health/route.ts        # 健康检查 API
│   ├── image/                 # 图片工具 API
│   │   ├── add-watermark/route.ts
│   │   ├── compress/route.ts
│   │   ├── convert/route.ts
│   │   ├── crop/route.ts
│   │   ├── merge/route.ts
│   │   ├── resize/route.ts
│   │   ├── rotate/route.ts
│   │   └── to-ico/route.ts
│   ├── pdf/                   # PDF 工具 API
│   │   ├── add-page-numbers/route.ts
│   │   ├── compress/route.ts
│   │   ├── delete-pages/route.ts
│   │   ├── encrypt/route.ts
│   │   ├── extract-pages/route.ts
│   │   ├── merge/route.ts
│   │   ├── rotate/route.ts
│   │   ├── split/route.ts
│   │   ├── to-image/route.ts
│   │   └── watermark/route.ts
│   ├── recent-tools/route.ts  # 最近使用工具 API
│   ├── stats/route.ts         # 统计 API
│   ├── text/                  # 文本工具 API
│   │   ├── base64/route.ts
│   │   ├── csv-to-json/route.ts
│   │   ├── diff/route.ts
│   │   ├── hash/route.ts
│   │   ├── json-format/route.ts
│   │   ├── json-to-csv/route.ts
│   │   ├── json-to-xml/route.ts
│   │   ├── json-to-yaml/route.ts
│   │   ├── markdown-to-html/route.ts
│   │   ├── regex-tester/route.ts
│   │   ├── text-case/route.ts
│   │   ├── text-count/route.ts
│   │   └── url-encode/route.ts
│   ├── tools/route.ts         # 工具列表 API
│   └── video/                 # 视频工具 API
│       ├── compress/route.ts
│       ├── to-audio/route.ts
│       └── trim/route.ts
├── api-docs/page.tsx          # API 文档页面
├── layout.tsx                 # 根布局
├── page.tsx                   # 首页
├── icon.jpg                   # 网站图标
├── apple-icon.jpg             # Apple 图标
└── manifest.ts                # PWA 清单
```

### `src/components/` - React 组件

```
src/components/
├── layout/                    # 布局组件
│   ├── BackToTop.tsx          # 返回顶部按钮
│   ├── Breadcrumb.tsx         # 面包屑导航
│   ├── Breadcrumb.stories.tsx # 面包屑 Storybook
│   ├── LanguageSwitcher.tsx   # 语言切换器
│   ├── MobileNav.tsx          # 移动端导航
│   ├── Sidebar.tsx            # 侧边栏
│   └── ThemeToggle.tsx        # 主题切换
├── shared/                    # 共享组件
│   └── TermLabel.tsx          # 术语标签
├── tools/                     # 工具组件
│   ├── ColorPicker.tsx        # 颜色选择器
│   ├── ColorPicker.stories.tsx
│   ├── CropSelector.tsx       # 裁剪选择器
│   ├── DiffViewer.tsx         # 差异查看器
│   ├── DiffViewer.stories.tsx
│   ├── FeedbackForm.tsx       # 反馈表单
│   ├── FeedbackForm.stories.tsx
│   ├── FileUploader.tsx       # 文件上传器
│   ├── FileUploader.stories.tsx
│   ├── ImagePreview.tsx       # 图片预览
│   ├── JsonTreeView.tsx       # JSON 树视图
│   ├── JsonTreeView.stories.tsx
│   ├── MarkdownPreview.tsx    # Markdown 预览
│   ├── MarkdownPreview.stories.tsx
│   ├── PDFPreview.tsx         # PDF 预览
│   ├── QRCodePreview.tsx      # 二维码预览
│   ├── RecentTools.tsx        # 最近使用工具
│   ├── RegexPreview.tsx       # 正则表达式预览
│   ├── ToolCard.tsx           # 工具卡片
│   ├── ToolCard.stories.tsx
│   ├── ToolFileSection.tsx    # 文件上传区域
│   ├── ToolFileSection.stories.tsx
│   ├── ToolHelp.tsx           # 工具帮助
│   ├── ToolOptions.tsx        # 工具选项
│   ├── ToolOptions.stories.tsx
│   ├── ToolPageContainer.tsx  # 工具页面容器
│   ├── ToolResult.tsx         # 工具结果展示
│   └── ToolResult.stories.tsx
├── ui/                        # UI 组件 (shadcn/ui)
│   ├── badge.tsx              # 徽章
│   ├── button.tsx             # 按钮
│   ├── button.stories.tsx
│   ├── card.tsx               # 卡片
│   ├── dialog.tsx             # 对话框
│   ├── dropdown-menu.tsx      # 下拉菜单
│   ├── input.tsx              # 输入框
│   ├── label.tsx              # 标签
│   ├── select.tsx             # 选择器
│   ├── separator.tsx          # 分隔符
│   ├── sheet.tsx              # 抽屉
│   ├── sonner.tsx             # 通知
│   ├── switch.tsx             # 开关
│   ├── tabs.tsx               # 标签页
│   ├── textarea.tsx           # 文本区域
│   └── tooltip.tsx            # 提示
├── ErrorBoundary.tsx          # 错误边界
├── ThemeProvider.tsx          # 主题提供者
└── providers.tsx              # 全局提供者
```

### `src/lib/` - 核心库

```
src/lib/
├── tools/                     # 工具实现（62 个）
│   ├── index.ts               # 工具注册入口
│   ├── registry.ts            # 工具注册表
│   ├── audio-convert.ts       # 音频转换
│   ├── audio-trim.ts          # 音频裁剪
│   ├── base-converter.ts      # 进制转换
│   ├── base64-to-image.ts     # Base64 转图片
│   ├── base64.ts              # Base64 编解码
│   ├── color-convert.ts       # 颜色转换
│   ├── cron-gen.ts            # Cron 生成
│   ├── cron-parser.ts         # Cron 解析
│   ├── css-format.ts          # CSS 格式化
│   ├── csv-to-excel.ts        # CSV 转 Excel
│   ├── csv-to-json.ts         # CSV 转 JSON
│   ├── excel-to-csv.ts        # Excel 转 CSV
│   ├── file-hash.ts           # 文件哈希
│   ├── file-info.ts           # 文件信息
│   ├── hash.ts                # 哈希计算
│   ├── html-format.ts         # HTML 格式化
│   ├── image-add-watermark.ts # 图片水印
│   ├── image-compress.ts      # 图片压缩
│   ├── image-convert.ts       # 图片转换
│   ├── image-crop.ts          # 图片裁剪
│   ├── image-merge.ts         # 图片合并
│   ├── image-resize.ts        # 图片缩放
│   ├── image-rotate.ts        # 图片旋转
│   ├── image-to-base64.ts     # 图片转 Base64
│   ├── image-to-ico.ts        # 图片转 ICO
│   ├── image-to-pdf.ts        # 图片转 PDF
│   ├── js-format.ts           # JavaScript 格式化
│   ├── json-format.ts         # JSON 格式化
│   ├── json-to-csv.ts         # JSON 转 CSV
│   ├── json-to-xml.ts         # JSON 转 XML
│   ├── json-to-yaml.ts        # JSON 转 YAML
│   ├── jwt-decode.ts          # JWT 解码
│   ├── lorem-gen.ts           # Lorem 生成
│   ├── markdown-to-html.ts    # Markdown 转 HTML
│   ├── markdown-to-pdf.ts     # Markdown 转 PDF
│   ├── password-gen.ts        # 密码生成
│   ├── pdf-add-page-numbers.ts # PDF 添加页码
│   ├── pdf-compress.ts        # PDF 压缩
│   ├── pdf-delete-pages.ts    # PDF 删除页面
│   ├── pdf-encrypt.ts         # PDF 加密
│   ├── pdf-extract-pages.ts   # PDF 提取页面
│   ├── pdf-merge.ts           # PDF 合并
│   ├── pdf-rotate.ts          # PDF 旋转
│   ├── pdf-split.ts           # PDF 拆分
│   ├── pdf-to-image.ts        # PDF 转图片
│   ├── pdf-watermark.ts       # PDF 水印
│   ├── perler-beads-registry.ts # 拼豆注册
│   ├── perler-beads.ts        # 拼豆图纸生成
│   ├── qrcode-gen.ts          # 二维码生成
│   ├── regex-tester.ts        # 正则测试
│   ├── sql-format.ts          # SQL 格式化
│   ├── text-case.ts           # 大小写转换
│   ├── text-count.ts          # 字数统计
│   ├── text-diff.ts           # 文本对比
│   ├── timestamp.ts           # 时间戳转换
│   ├── url-encode.ts          # URL 编解码
│   ├── url-parser.ts          # URL 解析
│   ├── uuid-gen.ts            # UUID 生成
│   ├── video-compress.ts      # 视频压缩
│   ├── video-to-audio.ts      # 视频转音频
│   ├── video-trim.ts          # 视频裁剪
│   ├── xml-to-json.ts         # XML 转 JSON
│   └── yaml-to-json.ts        # YAML 转 JSON
├── locales/                   # 国际化文件
│   ├── zh.json                # 中文（简体）
│   ├── en.json                # 英文
│   ├── ja.json                # 日文
│   └── ko.json                # 韩文
├── analytics.ts               # 分析工具
├── api-utils.ts               # API 工具函数
├── constants.ts               # 常量定义
├── errors.ts                  # 错误处理
├── feedback.ts                # 反馈处理
├── format.ts                  # 格式化工具
├── i18n.tsx                   # 国际化配置
├── limits.ts                  # 限制配置
├── registry.ts                # 工具注册表
├── stats-client.ts            # 客户端统计
├── stats.ts                   # 服务端统计
├── tmp.ts                     # 临时文件处理
└── utils.ts                   # 通用工具函数
```

### `src/stories/` - Storybook Stories

```
src/stories/
├── Button.stories.ts          # 按钮示例
├── Button.tsx
├── Configure.mdx              # 配置文档
├── Header.stories.ts          # 头部示例
├── Header.tsx
├── Page.stories.ts            # 页面示例
├── Page.tsx
├── button.css
├── header.css
└── page.css
```

### `src/types/` - TypeScript 类型

```
src/types/
└── tool.ts                    # 工具类型定义
```

---

## 📊 统计数据

| 类别 | 数量 |
|------|------|
| 工具实现 | 62 个 |
| API 路由 | 62 个 |
| React 组件 | 55 个 |
| 单元测试文件 | 63 个 |
| 单元测试用例 | 360 个 |
| E2E 测试文件 | 11 个 |
| E2E 测试用例 | 50 个 |
| CLI 测试用例 | 14 个 |
| Storybook Stories | 15 个 |
| i18n 语言 | 4 种 |

---

## 🔗 相关文档

- [README.md](../README.md) - 项目文档
- [CLAUDE.md](../CLAUDE.md) - 开发指南
- [CONTRIBUTING.md](../CONTRIBUTING.md) - 贡献指南
- [CHANGELOG.md](../CHANGELOG.md) - 版本日志
- [MAINTENANCE_PLAN.md](../MAINTENANCE_PLAN.md) - 维护计划

---

*本文档由 Claude 自动生成，最后更新：2026-06-03*
