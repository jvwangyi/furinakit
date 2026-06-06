# FurinaKit 开发规范

## 相关文档

| 文档 | 内容 |
|------|------|
| `docs/development-guide.md` | 详细开发流程、代码示例、测试规范 |
| `docs/maintenance-guide.md` | 维护流程、依赖更新、文档同步 |
| `docs/deployment-guide.md` | 环境配置、CI/CD、Docker 部署 |
| `docs/project-structure.md` | 完整项目结构 |

## 技术栈
Next.js 16 + TypeScript + Tailwind CSS + Prisma + shadcn/ui + pino（日志）+ geist（字体）

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
| `node scripts/check_i18n.cjs` | i18n 完整性检查 |

## 目录结构
```
src/app/api/          # API 路由
src/app/[category]/   # 工具页面
src/lib/tools/        # 工具实现（87 个）
src/lib/locales/      # i18n（zh/en/ja/ko）
src/components/       # UI 组件
tests/                # 单元测试
e2e/                  # E2E 测试
prisma/               # 数据库模型
```
> 完整结构见 `docs/project-structure.md`

## 新增工具流程
1. `src/lib/tools/<name>.ts` — 实现 inputSchema + execute
2. `src/lib/tools/index.ts` — 导入注册
3. `src/app/api/<category>/<name>/route.ts` — API 路由
4. `src/app/<category>/<name>/page.tsx` — 前端页面
5. `src/lib/locales/*.json` — 四语言翻译
6. `tests/tools/<name>.test.ts` — 单元测试
7. 运行 `npx tsc --noEmit && npx vitest run` 验证

## 编码规范
- TypeScript strict 模式
- 错误用 `ToolError` + `ErrorCode`
- 日志用 `logger`（pino），不用 console
- 文件处理用 `createToolRoute` 工厂函数
- API 响应：`{ success: true, data }` 或 `{ success: false, error }`
- 前端 `Link` 不用 `withBasePath()`，`fetch` 需要用
- 所有用户可见文字用 `t('key')` 国际化
- Select 组件必须设置默认值

## 安全要点
- 文件上传校验类型和大小
- 密码 bcrypt（cost 12），8 位 + 字母数字
- Session cookie httpOnly + secure + sameSite
- Auth 路由需速率限制
- API Key SHA-256 哈希存储
> 详见 `SECURITY.md`
