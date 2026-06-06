# PDF Preview 修复计划

## 问题描述
1. 有时只能预览一页（pageCount 可能为 0 或渲染失败）
2. 有时多页显示空白（canvas 渲染异常）

## 当前实现
- 文件：`src/components/tools/PDFPreview.tsx`
- 依赖：`pdfjs-dist@5.7.284`
- 架构：单 canvas + 手动分页

## 修复方案

### Step 1: 诊断并修复现有问题
- 检查 worker 加载是否稳定
- 检查 canvas 渲染错误处理
- 添加 fallback 机制

### Step 2: 改进为多页预览
- 方案 A：继续用 pdfjs-dist，但改为多 canvas 渲染（推荐）
- 方案 B：引入 react-pdf 库
- 方案 C：引入 @embedpdf/react-pdf-viewer（功能最强但依赖重）

### Step 3: 添加功能
- 虚拟滚动（只渲染可见页）
- 缩放控制
- 全屏预览

## 参考项目
- https://github.com/wojtekmaj/react-pdf
- https://github.com/nicolo-ribaudo/tc39-proposal-await-dictionary (PDF 虚拟化思路)
