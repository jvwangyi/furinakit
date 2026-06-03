# FurinaKit 项目结构

> 最后更新：2026-06-03

---

## 📁 目录结构

```
furinakit/
├── .github/                    # GitHub 配置
│   ├── ISSUE_TEMPLATE/         # Issue 模板
│   │   ├── bug_report.md       # Bug 报告模板
│   │   └── feature_request.md  # 功能请求模板
│   └── workflows/
│       └── ci.yml              # CI 工作流
│
├── .storybook/                 # Storybook 配置
│   ├── main.ts
│   └── preview.tsx
│
├── cli/                        # 命令行工具
│   ├── index.ts                # CLI 入口
│   └── commands/
│       ├── pdf.ts              # PDF 命令组
│       ├── image.ts            # 图片命令组
│       └── text.ts             # 文本命令组
│
├── docs/                       # 项目文档
│   ├── api/                    # API 文档
│   ├── archive/                # 历史文档归档
│   ├── reference/              # 参考资料
│   │   ├── colorSystemMapping.json  # 颜色品牌映射
│   │   └── pbdx-palettes.json       # 色板数据库
│   ├── project-structure.md    # 项目结构（本文件）
│   └── *.md                    # 其他文档
│
├── e2e/                        # E2E 测试 (Playwright)
│   ├── homepage.spec.ts        # 首页测试
│   ├── navigation.spec.ts      # 导航测试
│   ├── search.spec.ts          # 搜索测试
│   ├── text-tools.spec.ts      # 文本工具测试
│   ├── pdf-tools.spec.ts       # PDF 工具测试
│   ├── image-tools.spec.ts     # 图片工具测试
│   ├── audio-video-tools.spec.ts  # 音视频工具测试
│   ├── dev-tools.spec.ts       # 开发工具测试
│   ├── feedback.spec.ts        # 反馈系统测试
│   ├── i18n.spec.ts            # 国际化测试
│   └── tool-page.spec.ts       # 工具页面测试
│
├── public/                     # 静态资源
│   ├── furina.jpg              # 项目图片
│   ├── sw.js                   # Service Worker
│   └── *.svg                   # 图标文件
│
├── scripts/                    # 脚本
│   └── start_ssh_tunnel.bat    # SSH 隧道脚本
│
├── src/                        # 源代码
│   ├── app/                    # Next.js App Router
│   │   ├── [category]/         # 动态分类路由
│   │   │   └── [tool]/         # 动态工具路由
│   │   ├── api/                # API 路由
│   │   │   ├── audio/          # 音频工具 API
│   │   │   ├── convert/        # 格式转换 API
│   │   │   ├── dev/            # 开发工具 API
│   │   │   ├── file/           # 文件工具 API
│   │   │   ├── image/          # 图片工具 API
│   │   │   ├── pdf/            # PDF 工具 API
│   │   │   ├── text/           # 文本工具 API
│   │   │   └── video/          # 视频工具 API
│   │   ├── api-docs/           # API 文档页面
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 首页
│   │
│   ├── components/             # React 组件
│   │   ├── layout/             # 布局组件
│   │   │   ├── Sidebar.tsx     # 侧边栏
│   │   │   ├── Breadcrumb.tsx  # 面包屑导航
│   │   │   ├── ThemeToggle.tsx # 主题切换
│   │   │   └── LanguageSwitcher.tsx  # 语言切换
│   │   ├── shared/             # 共享组件
│   │   │   └── TermLabel.tsx   # 术语标签
│   │   ├── tools/              # 工具组件
│   │   │   ├── ToolCard.tsx    # 工具卡片
│   │   │   ├── ToolPageContainer.tsx  # 工具页面容器
│   │   │   ├── ToolOptions.tsx # 工具选项
│   │   │   ├── ToolResult.tsx  # 工具结果
│   │   │   ├── ToolFileSection.tsx    # 文件上传区域
│   │   │   ├── FileUploader.tsx       # 文件上传器
│   │   │   ├── JsonTreeView.tsx       # JSON 树视图
│   │   │   ├── DiffViewer.tsx         # 差异查看器
│   │   │   ├── ColorPicker.tsx        # 颜色选择器
│   │   │   └── ...            # 其他工具组件
│   │   └── ui/                 # UI 组件 (shadcn/ui)
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── select.tsx
│   │       └── ...            # 其他 UI 组件
│   │
│   ├── lib/                    # 核心库
│   │   ├── tools/              # 工具实现 (62 个)
│   │   │   ├── index.ts        # 工具注册入口
│   │   │   ├── pdf-merge.ts
│   │   │   ├── image-compress.ts
│   │   │   ├── json-format.ts
│   │   │   └── ...            # 其他工具
│   │   ├── locales/            # 国际化文件
│   │   │   ├── zh.json         # 中文
│   │   │   ├── en.json         # 英文
│   │   │   ├── ja.json         # 日文
│   │   │   └── ko.json         # 韩文
│   │   ├── registry.ts         # 工具注册表
│   │   ├── api-utils.ts        # API 工具函数
│   │   ├── errors.ts           # 错误处理
│   │   ├── i18n.tsx            # 国际化配置
│   │   ├── constants.ts        # 常量定义
│   │   └── utils.ts            # 通用工具函数
│   │
│   ├── stories/                # Storybook stories
│   │   └── *.stories.tsx       # 组件故事
│   │
│   └── types/                  # TypeScript 类型定义
│       └── tool.ts             # 工具类型定义
│
├── tests/                      # 单元测试 (Vitest)
│   ├── cli/                    # CLI 测试
│   │   └── cli.test.ts         # CLI 命令测试
│   └── tools/                  # 工具测试
│       ├── audio-convert.test.ts
│       ├── image-compress.test.ts
│       ├── json-format.test.ts
│       └── ...                # 其他工具测试
│
├── CLAUDE.md                   # Claude 开发指南
├── AGENTS.md                   # Agent 配置
├── README.md                   # 项目文档 (四语言)
├── LICENSE                     # MIT 许可证
├── CHANGELOG.md                # 版本更新日志
├── CONTRIBUTING.md             # 贡献指南
├── CODE_OF_CONDUCT.md          # 行为准则
├── MAINTENANCE_PLAN.md         # 维护计划
├── check_i18n.cjs              # i18n 检查工具
├── package.json                # 依赖配置
├── tsconfig.json               # TypeScript 配置
├── next.config.ts              # Next.js 配置
├── playwright.config.ts        # Playwright 配置
├── vitest.config.mts           # Vitest 配置
└── eslint.config.mjs           # ESLint 配置
```

---

## 📊 文件统计

| 类别 | 数量 | 说明 |
|------|------|------|
| 工具实现 | 62 个 | `src/lib/tools/*.ts` |
| API 路由 | 62 个 | `src/app/api/*/route.ts` |
| React 组件 | 30+ 个 | `src/components/**/*.tsx` |
| 单元测试 | 63 个 | `tests/**/*.test.ts` |
| E2E 测试 | 11 个 | `e2e/*.spec.ts` |
| Storybook | 15 个 | `src/**/*.stories.tsx` |
| i18n 文件 | 4 个 | `src/lib/locales/*.json` |

---

## 🔑 关键文件说明

### 配置文件

| 文件 | 用途 |
|------|------|
| `next.config.ts` | Next.js 配置，包含 basePath 动态设置 |
| `playwright.config.ts` | Playwright E2E 测试配置 |
| `vitest.config.mts` | Vitest 单元测试配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `package.json` | 项目依赖和脚本 |

### 核心代码

| 文件 | 用途 |
|------|------|
| `src/lib/registry.ts` | 工具注册表，管理所有工具 |
| `src/lib/api-utils.ts` | API 工具函数，处理请求/响应 |
| `src/lib/errors.ts` | 错误处理，定义错误类型 |
| `src/lib/i18n.tsx` | 国际化配置，管理多语言 |
| `src/lib/constants.ts` | 常量定义，分类映射等 |

### 工具开发

| 文件 | 用途 |
|------|------|
| `src/lib/tools/index.ts` | 工具注册入口，导入所有工具 |
| `src/lib/tools/<tool>.ts` | 工具实现文件 |
| `src/app/api/<category>/<tool>/route.ts` | API 路由文件 |
| `tests/tools/<tool>.test.ts` | 工具测试文件 |

---

## 🔄 数据流

```
用户操作
    ↓
ToolPageContainer (前端)
    ↓
API 路由 (src/app/api/*)
    ↓
工具实现 (src/lib/tools/*)
    ↓
返回结果
    ↓
ToolResult (前端展示)
```

---

## 🌍 国际化结构

```
src/lib/locales/
├── zh.json    # 中文 (简体)
├── en.json    # 英文
├── ja.json    # 日文
└── ko.json    # 韩文

每个工具需要 2 个 key:
- tool.<name>      # 工具名称
- tool.<name>.desc # 工具描述
```

---

## 🧪 测试结构

```
tests/
├── cli/
│   └── cli.test.ts        # CLI 命令测试 (14 个用例)
└── tools/
    ├── audio-convert.test.ts
    ├── image-compress.test.ts
    ├── json-format.test.ts
    └── ...                # 62 个工具测试

e2e/
├── homepage.spec.ts       # 首页测试
├── navigation.spec.ts     # 导航测试
├── search.spec.ts         # 搜索测试
├── text-tools.spec.ts     # 文本工具测试
├── pdf-tools.spec.ts      # PDF 工具测试
├── image-tools.spec.ts    # 图片工具测试
├── audio-video-tools.spec.ts  # 音视频工具测试
├── dev-tools.spec.ts      # 开发工具测试
└── ...                    # 共 11 个 E2E 测试文件
```

---

*本文档由 Claude 自动生成，最后更新：2026-06-03*
