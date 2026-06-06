# FurinaKit 开发规范

## 技术栈
Next.js 16 + TypeScript + Tailwind CSS + Prisma + shadcn/ui + pino（日志）

## 常用命令
| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建 |
| `npx tsc --noEmit` | 类型检查 |
| `npx vitest run` | 单元测试 |
| `npx playwright test` | E2E 测试 |
| `npx prisma migrate dev` | 数据库迁移 |
| `npx prisma generate` | 重新生成 Prisma Client |
| `node check_i18n.cjs` | i18n 完整性检查 |

## 目录结构
- `src/app/api/` — API 路由
- `src/app/[category]/[tool]/` — 工具页面
- `src/app/dashboard/` — 用户仪表盘
- `src/app/auth/` — 登录注册页面
- `src/lib/` — 核心库
- `src/lib/tools/` — 工具实现
- `src/lib/locales/` — i18n 翻译文件（zh/en/ja/ko）
- `src/components/` — UI 组件
- `src/components/tools/` — 工具相关组件（ToolOptions、ToolPageContainer 等）
- `prisma/` — 数据库模型
- `tests/` — 测试
- `.github/workflows/` — CI/CD（ci.yml、deploy.yml）
- `nginx/` — Nginx 反向代理配置

## 新增工具流程
1. 在 `src/lib/tools/` 下创建工具实现（定义 inputSchema + execute）
2. 在 `src/lib/registry.ts` 中注册
3. 在 `src/app/api/[category]/[tool]/route.ts` 创建 API 路由（使用 createToolRoute）
4. 在 `src/app/[category]/[tool]/page.tsx` 创建前端页面（复用 ToolPageContainer）
5. 在 `src/components/tools/ToolOptions.tsx` 添加工具选项（如有）
6. 在 `src/lib/locales/zh.json` 添加翻译 key（tool.xxx、opt.xxx、val.xxx）
7. 同步翻译到 en.json、ja.json、ko.json
8. 添加单元测试 `tests/`
9. 运行 `npx tsc --noEmit && npx vitest run` 验证

## 编码规范
- TypeScript strict 模式
- 错误统一用 `ToolError` + `ErrorCode`
- 文件处理用 `createToolRoute` 工厂函数（自带速率限制、文件校验、超时保护）
- 日志用 `logger`（pino），不用 console
- API 响应格式：`{ success: true, data }` 或 `{ success: false, error }`
- 认证用 `getSessionUser(request)` 获取当前用户
- 前端 `Link` 组件**不要**用 `withBasePath()`（Next.js 自动处理）
- 前端 `fetch` 调用**需要**用 `withBasePath()`（不走 Next.js 路由）
- 前端所有用户可见文字必须用 `t('key')` 国际化，不要硬编码中文
- 工具选项组件中 Select 必须设置默认值，避免 undefined 传入 schema

## 安全要点
- 文件上传必须校验类型（validateFileType）和大小（checkFileSize）
- 密码用 bcrypt（cost 12），最少 8 位 + 字母数字
- Session cookie httpOnly + secure + sameSite
- 所有 auth 路由需要速率限制（rate-limiter-flexible）
- 用户输入需校验（validateEmail, validatePassword）
- 用户名需清洗（sanitizeName，防 XSS）
- API Key 用 SHA-256 哈希存储，原始 key 仅在创建时返回一次
- 验证码用 crypto.randomInt() 生成，5 次失败锁定 10 分钟
- 注册不泄露用户是否已存在（统一返回 needVerification）

## 数据库
- SQLite 开发，PostgreSQL 生产
- 迁移：`npx prisma migrate dev --name 描述`
- 修改 schema 后必须 `npx prisma generate`
- 主要模型：User、Account、Session、VerificationToken、ToolUsageHistory、Favorite

## 认证
- 邮箱密码登录 + GitHub OAuth（allowDangerousEmailAccountLinking）
- 注册需要邮箱验证（6 位验证码，10 分钟有效）
- JWT session 7 天过期，httpOnly cookie
- 速率限制：登录 10/15min、注册 5/hour、验证码 3/10min
- NEXTAUTH_URL 需要包含 base path（如 `http://host/furinakit/api/auth`）

## 用户仪表盘
- `/dashboard` — 概览、历史、收藏、统计、API Key 管理
- 历史记录：工具使用自动记录到数据库（fire-and-forget）
- 收藏：登录后存数据库，未登录存 localStorage
- API Key：创建时弹窗显示（可多次复制），列表支持小眼睛切换显示/隐藏
- 密钥创建后存 localStorage，刷新后仍可查看/复制

## i18n
- 四语言支持：zh.json、en.json、ja.json、ko.json
- 翻译文件在 `src/lib/locales/`
- 新增 UI 文本必须在四个文件中都添加 key
- 工具选项回退值不要硬编码中文，用 `t('key')` 或英文
- Dashboard 和 API Key 相关 key 以 `dashboard.` 和 `apikey.` 前缀

## SEO
- `src/app/robots.ts` — robots.txt
- `src/app/sitemap.ts` — sitemap（所有工具页面）
- layout.tsx 中有 Open Graph + Twitter Card metadata

## CI/CD
- `.github/workflows/ci.yml` — PR/push 触发：type-check + lint + security audit + test + build
- `.github/workflows/deploy.yml` — master 分支触发（Docker 构建 + SSH 部署，待启用）
- PR 模板：`.github/pull_request_template.md`
- 安全策略：`SECURITY.md`
