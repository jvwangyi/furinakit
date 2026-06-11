# FurinaKit 学术模块深度审查报告

## 审查概要

审查了 9 个阶段的前端组件和后端 API，发现并修复了 **7 个关键问题**，涉及功能断裂、数据流错误和用户体验缺失。

---

## Stage 1: Literature（文献检索）✅ 已良好

**当前实现：**
- 自然语言输入 → 800ms 防抖 LLM 分析 → 关键词提取 → 双源搜索（Semantic Scholar + arXiv）
- 支持关键词编辑（添加/删除/修改）
- 年份/引用量/排序筛选，分页显示
- 引用网络（citations/references），引用验证
- 搜索历史（localStorage），去重（Jaccard 相似度）

**评价：** 实现完善，体验流畅。搜索建议、关键词高亮、分页、筛选等功能齐全。无需修改。

---

## Stage 2: Review（综述生成）🔧 已优化

**当前实现：**
- 风格选择（APA/IEEE/GB），语言选择（中/英）
- LLM 流式生成综述
- 支持复制、导出（MD/DOCX/LaTeX）、保存到项目

**发现的问题：**
- ❌ 质量检查 API（`/api/academic/quality-check`）存在但 UI 未集成
- 风格校准 API 存在但未集成（可通过 `styleProfile` 参数传递）

**已修复：**
- ✅ 在综述输出下方添加了「写作质量检查」区域
- ✅ 5 维评分（逻辑连贯性、段落过渡、引用密度、句式多样性、学术用语规范）
- ✅ 每个维度显示评分（1-10）、评估摘要、改进建议
- ✅ 总体质量评分显示

---

## Stage 3: Integrity（完整性检查）🔧 已修复

**当前实现：**
- 7 种 AI 失败模式检查（M1-M7）
- Material Passport 生成
- 流式输出检查进度

**发现的问题：**
- ❌ **严重：** 前端监听 `type: 'result'` 事件，但 API 发送 `type: 'summary'` — 结构化结果永远不会被解析！用户只能看到原始流文本。
- ❌ 没有累积单个检查结果（`type: 'check_result'`）

**已修复：**
- ✅ 添加 `checkResults` 状态累积单个检查结果
- ✅ 监听 `type: 'check_result'` 和 `type: 'summary'` 事件
- ✅ 从 summary 数据正确构建 `IntegrityResult` 结构
- ✅ 结构化展示 PASS/FAIL/SUSPECTED 状态

---

## Stage 4: Peer Review（模拟审稿）✅ 已良好

**当前实现：**
- Sprint Contract 两阶段协议：Phase 1 承诺评分计划 → Phase 2 按计划评分
- EIC 分析 → 3 审稿人 → Devil's Advocate → 最终裁决
- DA 让步阈值（≥4）正确实现
- 评分条可视化，Strengths/Weaknesses 对比展示

**评价：** 实现完善。Sprint Contract 防止事后调整评分，DA 让步逻辑合理。无需修改。

---

## Stage 5: Revision（修改）🔧 已大幅优化

**当前实现（修改前）：**
- 仅一个文本框 + 保存按钮
- 显示审稿意见但无 AI 辅助

**发现的问题：**
- ❌ **严重：** revision-coach API 完全未集成！用户没有任何 AI 辅助来处理审稿意见
- ❌ 没有苏格拉底式对话引导
- ❌ 没有修改计划生成

**已修复：**
- ✅ 添加「AI 辅导」和「手动记录」双模式切换
- ✅ AI 辅导模式：调用 `/api/academic/revision-coach` API
- ✅ 支持最多 8 轮苏格拉底式对话
- ✅ 对话界面：Bot/User 头像、消息气泡、自动滚动
- ✅ 自动生成修改计划（Revision Plan）：按优先级列出行动项
- ✅ 修改计划可一键导入到手动记录模式
- ✅ API Key 配置集成

---

## Stage 6: Re-Review（验证修改）🔧 已修复

**当前实现：**
- 粘贴修改后论文 → 调用 assess API → 显示结果

**发现的问题：**
- ❌ **严重：** 调用 assess API 时未传递 `previousReview` 参数 — 运行的是全新审稿而非对比审稿！
- ❌ 未处理 `re_reviewer_result` 事件（对比审稿的特殊结果格式）

**已修复：**
- ✅ 从已有审稿意见中提取 `previousReview` 并传递给 API
- ✅ 添加 `re_reviewer_result` 事件处理：显示 concerns_addressed、overall_improvement、updated_recommendation
- ✅ 结果展示更清晰，包含问题解决状态

---

## Stage 7: Final Integrity（最终完整性检查）🔧 已修复

**当前实现：**
- 与 Stage 3 类似的 UI，带零容忍提示

**发现的问题：**
- ❌ **严重：** 发送 `zeroTolerance: true` 参数，但 API 读取 `mode: 'deep'` — 深度模式永远不会激活！
- ❌ 同 Stage 3 的 SSE 事件解析问题

**已修复：**
- ✅ 改为发送 `mode: 'deep'` 参数
- ✅ 修复 SSE 事件解析（同 Stage 3）

---

## Stage 8: Export（导出）🔧 已修复

**当前实现：**
- 可选择包含的章节（综述/完整性/审稿/修改）
- 支持 MD/DOCX/LaTeX 三种格式

**发现的问题：**
- ❌ LaTeX 导出：每个列表项都生成独立的 `\begin{itemize}...\end{itemize}` — 产生无效 LaTeX！

**已修复：**
- ✅ 实现正确的列表状态追踪（`inItemize`/`inEnumerate`）
- ✅ 连续列表项合并到同一个 list 环境中
- ✅ 遇到非列表行或空行时正确关闭 list 环境

---

## Stage 9: Process Summary（协作质量评估）🔧 已优化

**当前实现（修改前）：**
- 仅显示静态数据：各阶段计数、最新审稿/完整性结果、完成状态

**发现的问题：**
- ❌ `/api/academic/summary` API 存在但完全未集成
- ❌ 没有 LLM 驱动的 6 维评分
- ❌ 没有项目完成报告

**已修复：**
- ✅ 添加「生成总结」按钮，调用 `/api/academic/summary` API
- ✅ 6 维评分可视化：研究深度、写作质量、审稿严格度、修改响应度、完整性、可复现性
- ✅ 每个维度显示进度条（颜色编码：绿/黄/红）
- ✅ 总体评分 + 等级标签（Excellent/Good/Acceptable/Needs Work）
- ✅ 优势和改进方向分栏展示
- ✅ 项目完成报告（叙事性总结）
- ✅ 传递项目上下文（名称、主题、论文列表）给 API

---

## 整体流水线审查

### 流程顺序 ✅
9 个阶段顺序合理：Literature → Review → Integrity → Peer Review → Revision → Re-Review → Final Integrity → Export → Process Summary

### 阶段导航 ✅
- PipelineStepper 正确显示 completed/current/accessible/locked 状态
- 「进入下一阶段」按钮在查看当前阶段时显示
- 点击已完成或当前阶段可切换视图

### API Key 管理 ✅
- 每个需要 LLM 的阶段都有 API Key 配置入口
- 无 API Key 时显示配置提示（LiteratureStage 有专门的提示卡片）
- API Key 存储在 localStorage，不发送到服务器

---

## 修改文件清单

| 文件 | 修改类型 |
|------|----------|
| `IntegrityStage.tsx` | 修复 SSE 事件解析，添加 checkResults 状态 |
| `FinalIntegrityStage.tsx` | 修复 mode: 'deep' 参数，修复 SSE 事件解析 |
| `RevisionStage.tsx` | **重写** — 添加 AI 辅导对话界面 |
| `ReReviewStage.tsx` | 传递 previousReview，处理 re_reviewer_result |
| `ReviewStage.tsx` | 添加质量检查集成 |
| `ProcessSummaryStage.tsx` | **重写** — 添加 LLM 驱动的 6 维评分 |
| `export/route.ts` | 修复 LaTeX 列表生成 |
| `projects/[id]/page.tsx` | 更新 ProcessSummaryStage props |

## 验证

- ✅ `npx tsc --noEmit` — 零错误
- ✅ `npx next build` — 构建成功
