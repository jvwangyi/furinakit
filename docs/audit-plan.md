# FurinaKit 快速审查 & 优化计划

> 审查日期：2026-06-01 | 版本：v0.1.0 | 工具总数：42 个 lib 工具，31 个有测试

---

## 1. 工具覆盖缺口

### P0 — 空分类（用户点击无内容）

| 分类 | 现状 | 影响 |
|------|------|------|
| **Audio** | Sidebar 有入口，0 个工具、0 个 API 路由 | 用户进入空白页，体验断裂 |
| **Convert** | Sidebar 有入口，0 个工具、0 个 API 路由 | 同上 |

**建议：**
- **短期**：从 Sidebar 移除空分类入口，或在分类页显示"即将上线"占位
- **中期**：Audio 至少实现 `audio-convert`（格式互转）、`audio-trim`（裁剪）；Convert 至少实现 `image-to-pdf`、`csv-to-excel`

### P1 — 测试覆盖缺口

以下工具 **有 lib 实现 + API 路由，但无对应测试**：

| 工具 | 文件 |
|------|------|
| pdf-merge | `src/lib/tools/pdf-merge.ts` |
| pdf-split | `src/lib/tools/pdf-split.ts` |
| pdf-watermark | `src/lib/tools/pdf-watermark.ts` |
| pdf-encrypt | `src/lib/tools/pdf-encrypt.ts` |
| image-resize | `src/lib/tools/image-resize.ts` |
| image-crop | `src/lib/tools/image-crop.ts` |
| image-convert | `src/lib/tools/image-convert.ts` |
| image-to-ico | `src/lib/tools/image-to-ico.ts` |
| text-diff | `src/lib/tools/text-diff.ts` |
| sql-format | `src/lib/tools/sql-format.ts` |

**建议：** 按风险优先补充测试 — pdf-encrypt（安全相关）、image-resize/crop（用户高频）排前。

### P2 — 高频工具缺失

用户常见需求但未覆盖：

- 文本加密/解密（AES/DES）
- HTML 转 Markdown（反向已有 Markdown→HTML）
- CSS/JS 压缩格式化
- 图片灰度化、模糊、亮度调节
- PDF 页码添加
- 音频格式转换、音频裁剪

---

## 2. 布局 / 组件优化

### P0 — ToolPage 过于臃肿

`src/app/[category]/[tool]/page.tsx`（628 行）承担了：
- 工具元数据获取
- 文件上传 / 预览状态管理
- 表单提交逻辑
- 结果渲染（文件下载 / 文本展示 / JSON 树 / Diff）
- 快捷键处理
- 图片/CSV 大小对比计算

**建议拆分：**
```
page.tsx              → 路由壳 + PerlerBeads 判断
ToolPageContainer.tsx → 状态管理 + 提交逻辑
ToolResult.tsx        → 结果渲染（文本/文件/JSON/Diff）
ToolFileSection.tsx   → 文件上传 + 预览 + 多文件导航
```

### P1 — ToolOptions 巨型 switch

`src/components/tools/ToolOptions.tsx`（1066 行）是单一 switch 语句，每个工具一个 case。

**建议：**
- 改为注册制：每个工具导出自己的 `Options` 组件，由 ToolOptions 根据 toolName 查找渲染
- 或使用配置驱动：定义 options schema（字段类型、label、默认值），ToolOptions 自动生成 UI

### P1 — 重复代码

| 位置 | 问题 |
|------|------|
| `categoryKeys` 映射 | 在 `page.tsx`、`[category]/page.tsx`、`ToolCard.tsx`、`MobileNav.tsx`、`Sidebar.tsx` 中各定义一份 |
| `TermLabel` 组件 | 在 `page.tsx` 和 `ToolOptions.tsx` 中各定义一份 |
| `formatFileSize` | 在 `FileUploader.tsx` 和 `page.tsx` 中各定义一份 |
| API 路由模板 | 38 个 route.ts 几乎相同结构（parseInput → tool.execute → response） |

**建议：** 抽取到共享 utils / 生成器函数。

### P2 — 首页与分类页重复

`src/app/page.tsx` 和 `src/app/[category]/page.tsx` 的 fetch + filter + 渲染逻辑高度相似。

**建议：** 抽取 `useTools(category?)` hook 和 `ToolGrid` 组件。

---

## 3. i18n 缺失

### P0 — 硬编码中文（影响所有非中文用户）

| 文件 | 行号 | 硬编码内容 |
|------|------|------------|
| `layout.tsx` | 19 | `title: "FurinaKit - 芙宁娜的工具箱"` |
| `layout.tsx` | 20 | `description: "优雅的在线工具箱..."` |
| `layout.tsx` | 33 | `<html lang="zh-CN">`（不随语言切换） |
| `MobileNav.tsx` | 57 | `aria-label={open ? '关闭菜单' : '打开菜单'}` |
| `page.tsx` | 583-588 | `"原始"` / `"处理后"` 大小对比标签 |
| `ToolOptions.tsx` | 500 | `t('opt.password') \|\| '用户密码'` fallback 硬编码 |
| `ToolOptions.tsx` | 508-523 | 多处 `\|\| '水印文字'` / `\|\| '居中'` 等 fallback |

**建议：**
1. `layout.tsx` metadata 改为动态生成（或至少用英文默认）
2. `<html lang>` 使用 `useI18n().locale` 动态设置
3. 移除所有 `|| '中文fallback'` 模式 — 确保翻译 key 完整

### P1 — 翻译 key 缺失

以下 key 在代码中使用但翻译表中不存在：

- `tool.ico_size`（ToolOptions.tsx:730）
- `tool.watermark_placeholder`（ToolOptions.tsx:524）
- `tool.perler-beads` 的 ja/ko `.help` 文本（日语/韩语缺少 help 文本）
- `perler.mode_dark_dominant` / `perler.mode_median_cut` / `perler.mode_kmeans` 在 zh 中缺失（en/ko 有）

### P1 — 韩语翻译中的中文残留

`ko` 翻译中多处出现中文注释标记 `//补充`，且部分翻译值包含中文字符（如 `tool.qrcode-gen.help` 中的 `多种`）。

### P2 — i18n 架构问题

- 所有 4 语言翻译打包在一个 1700+ 行的 `i18n.tsx` 文件中
- 无翻译完整性校验（缺少 key 在编译时不报错）
- `tError` 函数（1770-1778 行）有重复逻辑：`byCode` 和 `byMessage` 做的是同一件事

**建议：**
- 按语言拆分文件：`locales/zh.ts`、`locales/en.ts` 等
- 添加 CI 脚本校验各语言 key 集合一致
- 修复 `tError` 重复逻辑

---

## 4. 代码质量

### P0 — 类型安全

| 问题 | 位置 |
|------|------|
| `const [result, setResult] = useState<any>(null)` | `page.tsx:69` — 应定义 `ToolResult` 类型 |
| `tool.execute(input: any)` | `registry.ts:15` — input 无类型约束 |
| `Tool` 接口在 3 处重复定义 | `registry.ts`、`page.tsx`、`[category]/page.tsx` |
| API 路由无输入校验 | `parseInput` 不调用 `tool.inputSchema`（zod schema 定义了但未使用） |

**建议：**
- 统一 `Tool` 类型到 `src/types/tool.ts`，各处 import
- API 路由中增加 `tool.inputSchema.parse(input)` 校验
- result 使用 discriminated union 类型

### P1 — React 最佳实践

| 问题 | 位置 |
|------|------|
| `useEffect` 缺少依赖 | `page.tsx:101-110` — `handleSubmit` 未列入 deps |
| Sidebar fetch 错误静默吞掉 | `Sidebar.tsx:47` — `.catch(() => {})` |
| 无 ErrorBoundary | 任何组件崩溃 → 白屏 |
| `optionsKey = JSON.stringify(options)` 作为 effect 依赖 | `page.tsx:100` — 序列化开销，且不稳定 |

**建议：**
- 用 `useCallback` 包裹 `handleSubmit`，正确声明依赖
- Sidebar fetch 失败时显示降级 UI
- 添加根级 ErrorBoundary

### P2 — API 路由

- 38 个 route.ts 文件结构几乎完全相同，无共享中间件
- 无请求大小限制（仅 `limits.ts` 定义了常量但未在路由中使用）
- 无速率限制
- 无请求日志

**建议：** 创建 `createToolRoute(toolName)` 工厂函数，内置 parseInput + schema 校验 + 大小限制 + 错误处理 + 日志。

---

## 5. 移动端适配

### P0 — 关键布局问题

| 问题 | 影响 |
|------|------|
| Sidebar `hidden lg:block` — 移动端完全依赖 MobileNav | MobileNav 仅是下拉菜单，无侧滑抽屉，导航效率低 |
| 工具页 `max-w-4xl` 固定宽度 | 小屏下 Card 两侧留白过多 |
| 文件大小对比 `"原始"` / `"处理后"` 硬编码中文 | 非中文用户看到乱码（与 i18n P0 重叠） |

### P1 — 响应式细节

| 问题 | 位置 |
|------|------|
| Hero section `p-8` 固定内边距 | 小屏下过大，应为 `p-4 sm:p-6 lg:p-8` |
| Tool options `grid-cols-2` / `grid-cols-3` | 小屏下挤压，应 `grid-cols-1 sm:grid-cols-2` |
| 多文件导航按钮 `h-7 w-7` | 触摸目标偏小（推荐 ≥ 44px） |
| 搜索框 + 分类 Badge 行 | 未做 flex-wrap 优化，窄屏可能溢出 |

### P2 — 增强体验

- 添加 PWA manifest + service worker（工具类应用适合离线缓存）
- 移动端文件上传增加相机拍照选项
- 移动端 PDF 预览缩放手势支持
- 添加 viewport meta 的 `maximum-scale=1` 防止双击缩放干扰

---

## 优先级总览

| 优先级 | 数量 | 关键行动 |
|--------|------|----------|
| **P0** | 9 项 | 空分类处理、ToolPage 拆分、硬编码中文、类型安全、移动端布局 |
| **P1** | 12 项 | 测试补充、代码去重、翻译完善、React 最佳实践、响应式优化 |
| **P2** | 8 项 | 新工具开发、i18n 架构重构、API 工厂化、PWA 支持 |

---

## 建议执行顺序

1. **Week 1**：修复 P0 硬编码中文 + 空分类占位 → 立即改善多语言用户体验
2. **Week 2**：ToolPage 拆分 + 类型安全修复 → 降低后续开发维护成本
3. **Week 3**：测试补充 + 代码去重 → 提高代码质量和可维护性
4. **Week 4+**：响应式优化 + 新工具开发 → 功能完善
