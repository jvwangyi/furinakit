# FurinaKit 维护计划

> 创建时间：2026-06-03
> 最后更新：2026-06-03
> 状态：✅ 已完成清理
> 目的：清理冗余文件，规范化项目结构

---

## ✅ 清理完成总结

**执行时间**：2026-06-03

### 已完成操作
1. ✅ 删除 5 个临时测试脚本（test-api-*.mjs, test-full-coverage.mjs, test-coverage-results.json）
2. ✅ 移动 4 个根目录临时文档到 docs/ 或 docs/archive/
3. ✅ 移动部署脚本到 scripts/
4. ✅ 移动 6 个 docs/ 临时文件到 docs/archive/
5. ✅ 更新 .gitignore 添加 scripts/ 和 docs/archive/

### 清理结果
- 根目录文件从 27 个减少到 18 个
- 所有临时文件已归档或删除
- 项目结构更清晰规范

---

## 📊 项目现状分析

### 项目规模
- **62 个工具**：涵盖 PDF、图片、视频、音频、文本、开发、转换等类别
- **技术栈**：Next.js 16 + TypeScript + Tailwind CSS + shadcn/ui
- **三端支持**：CLI / API / Web

### 目录结构
```
furinakit/
├── .storybook/          # Storybook 配置
├── cli/                 # CLI 工具
├── docs/                # 内部文档（较多临时文件）
├── e2e/                 # E2E 测试
├── public/              # 静态资源
├── src/                 # 源代码
│   ├── app/             # Next.js App Router
│   ├── components/      # React 组件
│   ├── lib/             # 核心库
│   └── types/           # TypeScript 类型
├── tests/               # 单元测试
└── [配置文件]
```

---

## 🗑️ 冗余文件清单

### 第一类：根目录临时测试脚本（建议删除）

| 文件 | 说明 | 建议 |
|------|------|------|
| `test-api-all-v2.mjs` | 临时 API 测试脚本 v2 | ❌ 删除 |
| `test-api-all.mjs` | 临时 API 测试脚本 | ❌ 删除 |
| `test-api-final.mjs` | 临时 API 测试脚本 | ❌ 删除 |
| `test-full-coverage.mjs` | 临时覆盖率测试脚本 | ❌ 删除 |
| `test-coverage-results.json` | 测试结果输出 | ❌ 删除 |

**理由**：这些是开发过程中的临时脚本，功能已被 `tests/` 和 `e2e/` 中的正式测试覆盖。

### 第二类：根目录临时文档（建议移动或删除）

| 文件 | 说明 | 建议 |
|------|------|------|
| `findings.md` | 临时发现记录 | 📁 移动到 `docs/archive/` |
| `progress.md` | UI 优化进度记录 | 📁 移动到 `docs/archive/` |
| `task_plan.md` | 临时任务计划 | 📁 移动到 `docs/archive/` |
| `项目结构梳理.md` | 项目结构文档 | 📁 移动到 `docs/` |

**理由**：这些文档有参考价值，但不应放在根目录。

### 第三类：部署相关文件（建议移动）

| 文件 | 说明 | 建议 |
|------|------|------|
| `start_ssh_tunnel.bat` | SSH 隧道脚本 | 📁 移动到 `scripts/` |

**理由**：部署脚本应放在专门的目录。

### 第四类：构建产物（已在 .gitignore，确认不跟踪）

| 文件/目录 | 说明 | 状态 |
|-----------|------|------|
| `storybook-static/` | Storybook 构建输出 | ✅ 已在 .gitignore |
| `test-results/` | Playwright 测试结果 | ✅ 已在 .gitignore |
| `tsconfig.tsbuildinfo` | TypeScript 构建信息 | ✅ 已在 .gitignore |
| `next-env.d.ts` | Next.js 生成的类型 | ✅ 已在 .gitignore |

### 第五类：docs/ 目录临时文件（建议整理）

| 文件 | 说明 | 建议 |
|------|------|------|
| `docs/audit-plan.md` | 审计计划 | 📁 保留 |
| `docs/code-analysis.md` | 代码分析 | 📁 保留 |
| `docs/execution-plan.md` | 执行计划 | 📁 移动到 `docs/archive/` |
| `docs/feature-report.md` | 功能报告 | 📁 保留 |
| `docs/final-audit-progress.md` | 最终审计进度 | 📁 移动到 `docs/archive/` |
| `docs/final-audit-report.md` | 最终审计报告 | 📁 保留 |
| `docs/findings.md` | 发现记录 | 📁 移动到 `docs/archive/` |
| `docs/missing-tools.md` | 缺失工具清单 | 📁 保留 |
| `docs/progress.md` | 进度记录 | 📁 移动到 `docs/archive/` |
| `docs/project-report.md` | 项目报告 | 📁 保留 |
| `docs/task_plan.md` | 任务计划 | 📁 移动到 `docs/archive/` |
| `docs/tool-audit.md` | 工具审计 | 📁 保留 |
| `docs/tool-review-plan.md` | 工具审查计划 | 📁 保留 |
| `docs/tool-review-progress.md` | 工具审查进度 | 📁 移动到 `docs/archive/` |
| `docs/ui-optimization.md` | UI 优化文档 | 📁 保留 |

---

## ✅ 保留文件清单

### 根目录配置文件（必须保留）

| 文件 | 说明 |
|------|------|
| `.env.local` | 环境变量（已在 .gitignore） |
| `.gitignore` | Git 忽略规则 |
| `AGENTS.md` | Agent 配置文件 |
| `CLAUDE.md` | Claude 项目指令 |
| `README.md` | 项目说明 |
| `check_i18n.cjs` | i18n 检查工具 |
| `components.json` | shadcn/ui 配置 |
| `eslint.config.mjs` | ESLint 配置 |
| `next.config.ts` | Next.js 配置 |
| `package.json` | 依赖配置 |
| `package-lock.json` | 依赖锁定 |
| `playwright.config.ts` | Playwright 配置 |
| `postcss.config.mjs` | PostCSS 配置 |
| `tsconfig.json` | TypeScript 配置 |
| `vitest.config.mts` | Vitest 配置 |

### 功能目录（必须保留）

| 目录 | 说明 |
|------|------|
| `.storybook/` | Storybook 配置 |
| `cli/` | CLI 工具 |
| `e2e/` | E2E 测试 |
| `public/` | 静态资源 |
| `src/` | 源代码 |
| `tests/` | 单元测试 |

---

## 🔧 执行步骤

### Phase 1: 清理根目录临时文件

```bash
# 1. 删除临时测试脚本
rm test-api-all-v2.mjs
rm test-api-all.mjs
rm test-api-final.mjs
rm test-full-coverage.mjs
rm test-coverage-results.json

# 2. 移动临时文档到 docs/archive/
mkdir -p docs/archive
mv findings.md docs/archive/
mv progress.md docs/archive/
mv task_plan.md docs/archive/
mv 项目结构梳理.md docs/

# 3. 移动部署脚本
mkdir -p scripts
mv start_ssh_tunnel.bat scripts/
```

### Phase 2: 整理 docs/ 目录

```bash
# 移动临时进度文件到 archive
mv docs/execution-plan.md docs/archive/
mv docs/final-audit-progress.md docs/archive/
mv docs/findings.md docs/archive/
mv docs/progress.md docs/archive/
mv docs/task_plan.md docs/archive/
mv docs/tool-review-progress.md docs/archive/
```

### Phase 3: 更新 .gitignore

```gitignore
# 添加以下规则
/scripts/
/docs/archive/
```

### Phase 4: 验证

```bash
# 确认项目仍能正常构建
npm run build

# 确认测试仍能通过
npx vitest run
npx playwright test
```

---

## 📋 清理后目录结构

```
furinakit/
├── .storybook/          # Storybook 配置
├── cli/                 # CLI 工具
├── docs/                # 项目文档
│   ├── archive/         # 历史文档归档
│   ├── api/             # API 文档
│   └── *.md             # 重要文档
├── e2e/                 # E2E 测试
├── public/              # 静态资源
├── scripts/             # 部署脚本
│   └── start_ssh_tunnel.bat
├── src/                 # 源代码
├── tests/               # 单元测试
├── CLAUDE.md            # Claude 指令
├── AGENTS.md            # Agent 配置
├── README.md            # 项目说明
├── check_i18n.cjs       # i18n 检查工具
└── [配置文件]
```

---

## 📝 后续建议

1. **定期清理**：每月检查一次 `docs/archive/`，删除超过 3 个月的临时文档
2. **文档规范**：新建文档前先检查是否已有类似文档，避免重复
3. **测试脚本**：临时测试脚本用完即删，不要提交到仓库
4. **构建产物**：确保 `.gitignore` 覆盖所有构建产物目录

---

*本计划由 Claude 自动生成，执行前请确认无遗漏。*
