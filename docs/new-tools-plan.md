# 新工具实现计划

**创建时间：** 2026-06-04
**状态：** 进行中

## 实现顺序

### 1. 单位换算器 (unit-converter) ⬅️ 当前
- 分类：dev
- 输入：数值 + 源单位 + 目标单位
- 覆盖：长度/重量/温度/面积/体积/速度
- 参考：base-converter.ts 的结构

### 2. 条形码生成器 (barcode-gen)
- 分类：convert
- 输入：文本 + 格式(Code128/EAN13/EAN8/UPC)
- 依赖：可能需要 jsbarcode 库

### 3. 文本加密/解密 (text-crypto)
- 分类：dev
- 输入：文本 + 密钥 + 算法(AES/DES/Base64)
- 依赖：crypto-js 或 Web Crypto API

### 4. CSS 渐变生成器 (css-gradient)
- 分类：dev
- 输入：颜色 + 角度 + 类型
- 纯前端工具

### 5. 图片 EXIF 查看器 (image-exif)
- 分类：image
- 输入：图片文件
- 依赖：exifr 库

### 6. Markdown 实时编辑器 (markdown-live)
- 分类：text
- 输入：Markdown 文本
- 依赖：marked + 本地预览

## 每个工具的文件结构

```
src/lib/tools/{tool-name}.ts          # 工具定义
src/app/api/{category}/{tool-name}/route.ts  # API 路由
src/lib/locales/zh.json              # 中文翻译
src/lib/locales/en.json              # 英文翻译
src/lib/locales/ja.json              # 日文翻译
src/lib/locales/ko.json              # 韩文翻译
tests/tools/{tool-name}.test.ts      # 单元测试
```
