# FurinaKit 维护指南

> 项目维护流程和检查清单

---

## 目录

- [定期检查项](#定期检查项)
- [杂项文件和中间文件维护](#杂项文件和中间文件维护)
- [依赖更新](#依赖更新)
- [测试覆盖](#测试覆盖)
- [文档同步](#文档同步)
- [安全审计](#安全审计)
- [性能监控](#性能监控)

---

## 定期检查项

### 每次开发前

| 检查项 | 命令 | 说明 |
|--------|------|------|
| 类型检查 | `npx tsc --noEmit` | 确保无类型错误 |
| 单元测试 | `npx vitest run` | 确保所有测试通过 |
| i18n 完整 | `node scripts/check_i18n.cjs` | 确保四语言翻译完整 |

### 每周检查

| 检查项 | 命令 | 说明 |
|--------|------|------|
| 安全审计 | `npm audit --audit-level=high` | 检查高危漏洞 |
| 依赖更新 | `npm outdated` | 检查可更新的依赖 |
| 构建验证 | `npm run build` | 确保生产构建成功 |

### 每月检查

| 检查项 | 说明 |
|--------|------|
| CI/CD 状态 | 检查 GitHub Actions 运行状态 |
| 文档更新 | 同步 README、CHANGELOG |
| 测试覆盖 | 确保新工具有测试 |

---

## 杂项文件和中间文件维护

### 文件分类

| 类型 | 文件/目录 | 说明 | 维护方式 |
|------|-----------|------|----------|
| 构建产物 | `.next/` | Next.js 编译输出 | `npm run build` 重新生成 |
| 依赖包 | `node_modules/` | 第三方依赖 | `npm install` 重新安装 |
| 生成代码 | `src/generated/prisma/` | Prisma Client | `npx prisma generate` 重新生成 |
| 生成文件 | `next-env.d.ts` | Next.js 类型声明 | `npm run dev` 自动生成 |
| 编译缓存 | `tsconfig.tsbuildinfo` | TS 增量编译缓存 | `npx tsc` 自动生成 |
| 测试结果 | `test-results/` | Playwright 测试结果 | `npx playwright test` 重新生成 |
| 覆盖率 | `coverage/` | 测试覆盖率报告 | `npx vitest run --coverage` 重新生成 |
| Storybook | `storybook-static/` | Storybook 静态站点 | `npm run build-storybook` 重新生成 |
| 代码索引 | `.codegraph/` | CodeGraph MCP 索引 | CodeGraph 自动生成 |
| 运行时数据 | `data/` | 反馈、统计、最近使用 | 应用运行时生成 |
| 开发数据库 | `prisma/dev.db` | SQLite 开发数据库 | `npx prisma migrate dev` 重新生成 |
| 环境变量 | `.env`, `.env.local` | 本地配置 | 手动创建，不提交 git |
| 自动生成 | `AGENTS.md` | Next.js Agent 规则 | Next.js 自动生成 |

### 清理命令

```bash
# 清理所有构建产物和缓存
rm -rf .next node_modules storybook-static test-results coverage tsconfig.tsbuildinfo

# 清理 Prisma 生成代码
rm -rf src/generated/prisma

# 清理开发数据库
rm -f prisma/dev.db prisma/dev.db-journal

# 清理运行时数据
rm -rf data/

# 完全重置（谨慎使用）
rm -rf .next node_modules storybook-static test-results coverage tsconfig.tsbuildinfo src/generated/prisma prisma/dev.db*
```

### 重建命令

```bash
# 1. 重新安装依赖
npm install

# 2. 重新生成 Prisma Client
npx prisma generate

# 3. 重新初始化数据库（开发环境）
npx prisma migrate dev

# 4. 重新构建
npm run build

# 5. 重新生成 Storybook（可选）
npm run build-storybook
```

### 维护检查清单

#### 遇到构建失败时

- [ ] 检查 `node_modules/` 是否完整 → `npm install`
- [ ] 检查 `src/generated/prisma/` 是否存在 → `npx prisma generate`
- [ ] 检查 `.next/` 是否损坏 → `rm -rf .next && npm run build`
- [ ] 检查 `tsconfig.tsbuildinfo` 是否过期 → 删除后重新构建

#### 遇到测试失败时

- [ ] 检查 `test-results/` 是否有残留 → 删除后重新测试
- [ ] 检查 `coverage/` 是否过期 → 删除后重新生成
- [ ] 检查 `prisma/dev.db` 是否存在 → `npx prisma migrate dev`

#### 遇到类型错误时

- [ ] 检查 `src/generated/prisma/` 是否最新 → `npx prisma generate`
- [ ] 检查 `next-env.d.ts` 是否存在 → `npm run dev` 自动生成
- [ ] 检查 `tsconfig.tsbuildinfo` 是否损坏 → 删除后重新检查

#### 遇到依赖问题时

- [ ] 检查 `node_modules/` 是否完整 → `rm -rf node_modules && npm install`
- [ ] 检查 `package-lock.json` 是否冲突 → `git checkout package-lock.json`
- [ ] 检查是否有安全漏洞 → `npm audit`

### 文件大小监控

| 文件/目录 | 正常大小 | 异常处理 |
|-----------|----------|----------|
| `node_modules/` | 500MB-1GB | 正常，无需处理 |
| `.next/` | 100-500MB | 正常，构建产物 |
| `test-results/` | < 100MB | 过大则清理 |
| `coverage/` | < 50MB | 过大则清理 |
| `data/` | < 10MB | 过大则检查数据增长 |
| `prisma/dev.db` | < 10MB | 过大则重置数据库 |

### 紧急恢复

```bash
# 完全重置项目状态
rm -rf .next node_modules storybook-static test-results coverage tsconfig.tsbuildinfo src/generated/prisma prisma/dev.db*

# 重新初始化
npm install
npx prisma generate
npx prisma migrate dev
npm run build

# 验证
npx tsc --noEmit
npx vitest run
```

---

## 依赖更新

### 检查可更新的依赖

```bash
npm outdated
```

### 更新依赖

```bash
# 更新所有依赖到最新版本
npm update

# 更新特定依赖
npm install <package>@latest

# 更新开发依赖
npm install -D <package>@latest
```

### 安全漏洞修复

```bash
# 检查漏洞
npm audit

# 自动修复（可能有破坏性变更）
npm audit fix

# 强制修复（包含破坏性变更）
npm audit fix --force
```

### 注意事项

- 更新前先运行测试，确保当前版本正常
- 更新后运行完整测试套件
- 注意 major 版本更新可能有破坏性变更
- 更新后检查 `package-lock.json` 变更

---

## 测试覆盖

### 新工具必须有测试

每个新工具都需要创建对应的测试文件：

```
tests/tools/<tool-name>.test.ts
```

### 测试内容

| 测试类型 | 说明 |
|----------|------|
| 注册测试 | 工具是否正确注册 |
| 正常输入 | 有效输入是否正确处理 |
| 边界值 | 边界条件是否正确处理 |
| 错误输入 | 无效输入是否正确拒绝 |

### 运行测试

```bash
# 运行所有测试
npx vitest run

# 运行特定测试
npx vitest run tests/tools/<tool-name>.test.ts

# 运行测试并生成覆盖率报告
npx vitest run --coverage
```

### 测试覆盖率目标

| 指标 | 目标 |
|------|------|
| 语句覆盖率 | > 80% |
| 分支覆盖率 | > 70% |
| 函数覆盖率 | > 90% |

---

## 文档同步

### 需要同步的文档

| 文档 | 更新时机 |
|------|----------|
| `README.md` | 新增工具、功能变更 |
| `CHANGELOG.md` | 每次版本发布 |
| `docs/project-structure.md` | 新增文件、目录变更 |
| `src/lib/locales/*.json` | 新增 UI 文本 |

### README.md 更新

- 工具数量：统计 `src/lib/tools/*.ts` 文件数
- 测试数量：运行 `npx vitest run` 查看
- 工具列表：按分类添加新工具

### CHANGELOG.md 更新

格式：

```markdown
## [版本号] - YYYY-MM-DD

### Added
- 新增功能

### Changed
- 变更内容

### Fixed
- 修复内容
```

### i18n 同步

新增 UI 文本时，必须在 4 个语言文件中都添加：

```bash
# 检查完整性
node scripts/check_i18n.cjs
```

---

## 安全审计

### 定期审计

```bash
# 检查高危漏洞
npm audit --audit-level=high

# 检查所有漏洞
npm audit
```

### 安全要点

| 方面 | 检查项 |
|------|--------|
| 文件上传 | 类型校验、大小限制 |
| 密码安全 | bcrypt cost 12、8 位 + 字母数字 |
| Session | httpOnly + secure + sameSite |
| API 速率限制 | auth 路由有限制 |
| 输入校验 | validateEmail、validatePassword |
| XSS 防护 | sanitizeName |

### 漏洞处理

1. 检查漏洞严重程度
2. 评估是否影响项目
3. 查找修复版本
4. 更新依赖并测试
5. 记录到 CHANGELOG

---

## 性能监控

### Web Vitals

项目集成了 Web Vitals 监控：

```typescript
// src/lib/analytics.ts
import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
```

### 监控指标

| 指标 | 说明 | 目标 |
|------|------|------|
| LCP | 最大内容绘制 | < 2.5s |
| FID | 首次输入延迟 | < 100ms |
| CLS | 累积布局偏移 | < 0.1 |
| FCP | 首次内容绘制 | < 1.8s |
| TTFB | 首字节时间 | < 800ms |

### 错误监控

```typescript
// src/lib/error-monitor.ts
import { captureError } from '@/lib/error-monitor';

captureError({
  toolName: 'tool-name',
  error: 'Error message',
  severity: 'medium',
});
```

---

## 代码审查清单

### 提交前检查

- [ ] `npx tsc --noEmit` 通过
- [ ] `npx vitest run` 全部通过
- [ ] `npm run build` 成功
- [ ] `node scripts/check_i18n.cjs` 无缺失
- [ ] 新工具有对应测试
- [ ] i18n 四语言完整

### 代码规范检查

- [ ] TypeScript strict 模式
- [ ] 错误用 `ToolError` + `ErrorCode`
- [ ] 日志用 `logger`，不用 console
- [ ] API 响应格式统一
- [ ] 前端文字用 `t('key')` 国际化
- [ ] Select 组件有默认值

### 安全检查

- [ ] 文件上传有类型和大小校验
- [ ] 密码符合安全要求
- [ ] Session cookie 配置正确
- [ ] API 有限速保护
- [ ] 用户输入已校验

---

## 常见问题

### 测试失败

1. 检查是否有类型错误：`npx tsc --noEmit`
2. 检查依赖是否安装：`npm install`
3. 检查 Prisma 是否生成：`npx prisma generate`
4. 单独运行失败的测试查看详细错误

### 构建失败

1. 检查类型错误
2. 检查环境变量是否配置
3. 检查依赖是否完整
4. 查看构建日志定位问题

### i18n 缺失

1. 运行 `node scripts/check_i18n.cjs` 查看缺失的 key
2. 在 4 个语言文件中添加翻译
3. 重新运行检查确认完整
