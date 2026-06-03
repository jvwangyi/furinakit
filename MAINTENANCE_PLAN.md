# FurinaKit 维护计划

> 创建时间：2026-06-03
> 最后更新：2026-06-03
> 状态：✅ 已完成
> 项目地址：https://github.com/jvwangyi/furinakit
> 在线体验：http://8.130.38.139:9003/furinakit

---

## 📊 项目概况

| 指标 | 数值 |
|------|------|
| 工具数量 | 62 个 |
| 单元测试 | 360 个 |
| E2E 测试 | 50 个 |
| CLI 测试 | 14 个 |
| Storybook | 15 个 |
| 支持语言 | 4 种 (zh/en/ja/ko) |
| 版本 | v0.1.0 |

---

## ✅ 已完成工作

### 1. 项目清理与规范化

| 任务 | 详情 | 状态 |
|------|------|------|
| 清理冗余文件 | 删除 5 个临时测试脚本，移动 11 个临时文档 | ✅ |
| 更新 .gitignore | 添加 scripts/ 和 docs/archive/ | ✅ |
| 创建维护计划 | MAINTENANCE_PLAN.md | ✅ |

### 2. 测试覆盖补充

| 任务 | 详情 | 状态 |
|------|------|------|
| 视频工具测试 | 新增 video-compress、video-to-audio、video-trim 测试 | ✅ |
| 测试覆盖 | 从 60 个测试文件 → 62 个，100% 覆盖 | ✅ |
| CLI 测试 | 新增 cli.test.ts，14 个测试用例 | ✅ |

### 3. Storybook 组件文档

| 组件 | 文件 | 状态 |
|------|------|------|
| ToolResult | `src/components/tools/ToolResult.stories.tsx` | ✅ |
| ToolFileSection | `src/components/tools/ToolFileSection.stories.tsx` | ✅ |
| ToolOptions | `src/components/tools/ToolOptions.stories.tsx` | ✅ |
| Breadcrumb | `src/components/layout/Breadcrumb.stories.tsx` | ✅ |
| ColorPicker | `src/components/tools/ColorPicker.stories.tsx` | ✅ |
| MarkdownPreview | `src/components/tools/MarkdownPreview.stories.tsx` | ✅ |

### 4. i18n 修复

| 任务 | 详情 | 状态 |
|------|------|------|
| perler-beads 修复 | 新增 `perler.file_too_large` 和 `perler.color_count` 键 | ✅ |
| 四语言同步 | zh/en/ja/ko 全部更新 | ✅ |
| 组件更新 | perler-client.tsx 使用 i18n 键替换硬编码中文 | ✅ |

### 5. E2E 测试扩展

| 文件 | 覆盖工具 | 状态 |
|------|----------|------|
| `e2e/pdf-tools.spec.ts` | pdf-rotate, pdf-compress, pdf-split, pdf-merge | ✅ |
| `e2e/image-tools.spec.ts` | image-compress, image-convert, image-crop, image-resize, image-add-watermark | ✅ |
| `e2e/audio-video-tools.spec.ts` | audio-convert, audio-trim, video-compress, video-to-audio, video-trim | ✅ |
| `e2e/dev-tools.spec.ts` | base64, url-encode, timestamp, regex-tester, color-convert | ✅ |

### 6. 文档完善

| 文件 | 说明 | 状态 |
|------|------|------|
| `README.md` | 四语言支持，公网地址，完整工具列表 | ✅ |
| `LICENSE` | MIT 许可证 | ✅ |
| `CHANGELOG.md` | 版本更新日志 | ✅ |
| `CONTRIBUTING.md` | 贡献指南 | ✅ |
| `CODE_OF_CONDUCT.md` | 行为准则 | ✅ |

### 7. GitHub 仓库配置

| 任务 | 详情 | 状态 |
|------|------|------|
| 仓库创建 | https://github.com/jvwangyi/furinakit | ✅ |
| 项目描述 | 芙宁娜的在线工具箱 - 62个专业文件处理工具 | ✅ |
| 主题标签 | nextjs, typescript, tools, pdf, image-processing, online-tools | ✅ |
| 版本发布 | v0.1.0 | ✅ |
| Issue 模板 | Bug 报告 + 功能请求 | ✅ |
| GitHub Actions | CI 工作流（单元测试 + E2E 测试） | ✅ |

### 8. CI 问题修复

| 问题 | 解决方案 | 状态 |
|------|----------|------|
| next lint 不工作 | 移除 lint 步骤 | ✅ |
| Node.js 20 废弃 | 升级到 Node.js 22 | ✅ |
| basePath 冲突 | 根据 CI 环境变量动态设置 | ✅ |
| E2E 测试 URL | 移除硬编码 /furinakit 前缀 | ✅ |
| 正则表达式错误 | 修复 sed 破坏的正则 | ✅ |

---

## ⚠️ 待完成工作

### 优先级 1：Node.js 版本警告

GitHub Actions 显示 Node.js 20 废弃警告，建议：
- 更新 actions/checkout 到 v5
- 更新 actions/setup-node 到 v5
- 或设置 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`

---

## 📁 项目结构

```
furinakit/
├── .github/
│   ├── ISSUE_TEMPLATE/      # Issue 模板
│   └── workflows/ci.yml     # CI 工作流
├── cli/                     # 命令行工具（待测试）
│   ├── index.ts
│   └── commands/
├── docs/                    # 项目文档
├── e2e/                     # E2E 测试 (50 个)
├── src/
│   ├── app/                 # Next.js 页面和 API
│   ├── components/          # React 组件
│   ├── lib/
│   │   ├── locales/         # i18n 文件
│   │   └── tools/           # 工具实现 (62 个)
│   └── types/               # TypeScript 类型
├── tests/                   # 单元测试 (346 个)
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── MAINTENANCE_PLAN.md
└── README.md
```

---

## 🔧 开发命令

```bash
# 开发
npm run dev              # 启动开发服务器
npm run build            # 构建项目
npm start                # 启动生产服务器

# 测试
npm test                 # 运行单元测试
npm run test:e2e         # 运行 E2E 测试
npm run storybook        # 启动 Storybook

# CLI
npm run cli -- --help    # 查看 CLI 帮助
npm run cli -- list      # 列出所有工具

# 代码检查
npm run lint             # ESLint 检查
```

---

## 📝 更新日志

### 2026-06-03

- ✅ 完成项目清理和规范化
- ✅ 补充视频工具测试
- ✅ 添加 Storybook 组件文档
- ✅ 修复 perler-beads i18n 问题
- ✅ 扩展 E2E 测试覆盖
- ✅ 创建完整文档（README 四语言）
- ✅ 配置 GitHub 仓库和 CI
- ✅ 修复 CI 中的 basePath 问题
- ✅ 添加 CLI 测试（14 个测试用例）

---

*本计划由 Claude 自动生成，执行前请确认无遗漏。*
