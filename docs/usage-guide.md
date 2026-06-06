# FurinaKit 使用指南

> Web 界面、REST API、命令行工具三端使用说明

---

## 目录

- [Web 界面](#web-界面)
- [REST API](#rest-api)
- [命令行工具](#命令行工具)
- [API 认证](#api-认证)
- [错误处理](#错误处理)

---

## Web 界面

### 访问地址

- **在线体验**：http://8.130.38.139:9003/furinakit
- **本地开发**：http://localhost:3000

### 使用方式

1. 访问首页，浏览工具卡片或使用搜索
2. 点击工具进入工具页面
3. 上传文件或输入文本
4. 调整选项参数
5. 点击执行按钮
6. 查看结果，下载文件或复制文本

### 功能特性

| 功能 | 说明 |
|------|------|
| 工具搜索 | 支持名称、描述、分类搜索 |
| 分类筛选 | 按 PDF、图片、视频等分类筛选 |
| 最近使用 | 自动记录最近使用的工具 |
| 收藏工具 | 登录后可收藏常用工具 |
| 主题切换 | 支持亮色/暗色主题 |
| 语言切换 | 支持中文/English/日本語/한국어 |

---

## REST API

### 基础信息

- **Base URL**：`http://localhost:3000/furinakit/api`
- **在线文档**：http://localhost:3000/furinakit/api-docs
- **OpenAPI 规范**：`docs/api/openapi.yaml`

### 请求格式

**文本工具**：
```bash
curl -X POST http://localhost:3000/furinakit/api/text/json-format \
  -H "Content-Type: application/json" \
  -d '{"text": "{\"name\":\"test\"}", "indent": 2}'
```

**文件工具**：
```bash
curl -X POST http://localhost:3000/furinakit/api/image/compress \
  -F "file=@image.png" \
  -F "quality=80" \
  -o compressed.png
```

### 响应格式

**成功响应**：
```json
{
  "success": true,
  "data": {
    "text": "格式化后的 JSON"
  }
}
```

**错误响应**：
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "输入格式错误"
  }
}
```

### API 路由列表

#### 文本工具 (`/api/text/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/text/json-format` | POST | JSON 格式化 |
| `/text/json-to-csv` | POST | JSON 转 CSV |
| `/text/json-to-yaml` | POST | JSON 转 YAML |
| `/text/json-to-xml` | POST | JSON 转 XML |
| `/text/csv-to-json` | POST | CSV 转 JSON |
| `/text/markdown-to-html` | POST | Markdown 转 HTML |
| `/text/text-case` | POST | 大小写转换 |
| `/text/text-count` | POST | 字数统计 |
| `/text/diff` | POST | 文本对比 |
| `/text/base64` | POST | Base64 编解码 |
| `/text/hash` | POST | 哈希计算 |
| `/text/url-encode` | POST | URL 编解码 |
| `/text/regex-tester` | POST | 正则测试 |

#### 图片工具 (`/api/image/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/image/compress` | POST | 图片压缩 |
| `/image/convert` | POST | 格式转换 |
| `/image/crop` | POST | 图片裁剪 |
| `/image/resize` | POST | 图片缩放 |
| `/image/rotate` | POST | 图片旋转 |
| `/image/add-watermark` | POST | 添加水印 |
| `/image/add-text` | POST | 添加文字 |
| `/image/merge` | POST | 图片合并 |
| `/image/to-ico` | POST | 转 ICO |
| `/image/gif-maker` | POST | GIF 制作 |
| `/image/image-compare` | POST | 图片对比 |
| `/image/image-exif` | POST | EXIF 信息 |

#### PDF 工具 (`/api/pdf/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/pdf/merge` | POST | PDF 合并 |
| `/pdf/split` | POST | PDF 拆分 |
| `/pdf/compress` | POST | PDF 压缩 |
| `/pdf/rotate` | POST | PDF 旋转 |
| `/pdf/extract-pages` | POST | 提取页面 |
| `/pdf/delete-pages` | POST | 删除页面 |
| `/pdf/encrypt` | POST | PDF 加密 |
| `/pdf/watermark` | POST | PDF 水印 |
| `/pdf/add-page-numbers` | POST | 添加页码 |
| `/pdf/to-image` | POST | PDF 转图片 |

#### 视频工具 (`/api/video/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/video/compress` | POST | 视频压缩 |
| `/video/trim` | POST | 视频裁剪 |
| `/video/to-audio` | POST | 视频转音频 |
| `/video/video-thumbnail` | POST | 视频缩略图 |

#### 音频工具 (`/api/audio/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/audio/convert` | POST | 音频转换 |
| `/audio/trim` | POST | 音频裁剪 |

#### 开发工具 (`/api/dev/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/dev/timestamp` | POST | 时间戳转换 |
| `/dev/uuid-gen` | POST | UUID 生成 |
| `/dev/password-gen` | POST | 密码生成 |
| `/dev/color-convert` | POST | 颜色转换 |
| `/dev/cron-parser` | POST | Cron 解析 |
| `/dev/cron-gen` | POST | Cron 生成 |
| `/dev/css-format` | POST | CSS 格式化 |
| `/dev/js-format` | POST | JS 格式化 |
| `/dev/html-format` | POST | HTML 格式化 |
| `/dev/sql-format` | POST | SQL 格式化 |
| `/dev/jwt-decode` | POST | JWT 解码 |
| `/dev/qrcode-gen` | POST | 二维码生成 |
| `/dev/barcode-gen` | POST | 条形码生成 |
| `/dev/base-converter` | POST | 进制转换 |
| `/dev/url-parser` | POST | URL 解析 |
| `/dev/lorem-gen` | POST | Lorem 生成 |
| `/dev/ascii-art` | POST | ASCII 艺术字 |
| `/dev/code-minify` | POST | 代码压缩 |
| `/dev/dns-lookup` | POST | DNS 查询 |
| `/dev/ssl-checker` | POST | SSL 检查 |
| `/dev/ip-lookup` | POST | IP 查询 |
| `/dev/user-agent-parser` | POST | UA 解析 |
| `/dev/json-schema-validate` | POST | JSON Schema 校验 |
| `/dev/openapi-viewer` | POST | OpenAPI 查看 |
| `/dev/font-preview` | POST | 字体预览 |
| `/dev/unit-converter` | POST | 单位换算 |
| `/dev/text-crypto` | POST | 文本加密 |
| `/dev/css-gradient` | POST | CSS 渐变 |
| `/dev/color-palette` | POST | 调色板 |
| `/dev/svg-optimize` | POST | SVG 优化 |

#### 格式转换 (`/api/convert/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/convert/yaml-to-json` | POST | YAML 转 JSON |
| `/convert/xml-to-json` | POST | XML 转 JSON |
| `/convert/markdown-to-pdf` | POST | Markdown 转 PDF |
| `/convert/csv-to-excel` | POST | CSV 转 Excel |
| `/convert/excel-to-csv` | POST | Excel 转 CSV |
| `/convert/image-to-pdf` | POST | 图片转 PDF |
| `/convert/image-to-base64` | POST | 图片转 Base64 |
| `/convert/base64-to-image` | POST | Base64 转图片 |

#### 文件工具 (`/api/file/`)

| 路由 | 方法 | 说明 |
|------|------|------|
| `/file/file-info` | POST | 文件信息 |
| `/file/file-hash` | POST | 文件哈希 |

#### 系统 API

| 路由 | 方法 | 说明 |
|------|------|------|
| `/tools` | GET | 获取工具列表 |
| `/health` | GET | 健康检查 |
| `/recent-tools` | GET | 最近使用工具 |
| `/stats` | GET | 使用统计 |
| `/feedback` | POST | 提交反馈 |

---

## 命令行工具

### 安装

```bash
# 克隆仓库
git clone https://github.com/jvwangyi/furinakit.git
cd furinakit

# 安装依赖
npm install
```

### 使用方式

```bash
# 查看帮助
npm run cli -- --help

# 使用工具
npm run cli -- <category> <tool> [options]
```

### 命令列表

#### 文本命令

```bash
# JSON 格式化
npm run cli -- text json-format '{"name":"test"}'

# 哈希计算
npm run cli -- text hash "hello world" --algorithm sha256

# Base64 编码
npm run cli -- text base64 "hello world" --encode

# URL 编码
npm run cli -- text url-encode "https://example.com/path with spaces"

# 文本对比
npm run cli -- text diff "old text" "new text"
```

#### 图片命令

```bash
# 图片压缩
npm run cli -- image compress input.png --quality 80

# 格式转换
npm run cli -- image convert input.png --format webp

# 图片裁剪
npm run cli -- image crop input.png --width 100 --height 100

# 图片缩放
npm run cli -- image resize input.png --width 800 --height 600
```

#### PDF 命令

```bash
# PDF 合并
npm run cli -- pdf merge file1.pdf file2.pdf --output merged.pdf

# PDF 拆分
npm run cli -- pdf split input.pdf --pages 1-3

# PDF 压缩
npm run cli -- pdf compress input.pdf --quality medium

# PDF 旋转
npm run cli -- pdf rotate input.pdf --angle 90
```

### 命令选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `--output, -o` | 输出文件路径 | `-o output.png` |
| `--quality, -q` | 质量参数 | `-q 80` |
| `--format, -f` | 输出格式 | `-f webp` |
| `--width, -w` | 宽度 | `-w 800` |
| `--height, -h` | 高度 | `-h 600` |
| `--algorithm, -a` | 算法 | `-a sha256` |
| `--encode, -e` | 编码模式 | `-e` |
| `--decode, -d` | 解码模式 | `-d` |
| `--pages, -p` | 页码范围 | `-p 1-3,5` |
| `--angle` | 旋转角度 | `--angle 90` |

---

## API 认证

### 公开 API

大部分工具 API 无需认证，可直接调用。

### 用户 API

需要认证的 API：

| API | 说明 |
|-----|------|
| `/user/favorites` | 用户收藏 |
| `/user/history` | 使用历史 |
| `/user/stats` | 用户统计 |
| `/auth/api-keys` | API Key 管理 |

### 认证方式

**Session 认证**（Web 端）：
- 登录后自动维护 Session
- Cookie 自动携带

**API Key 认证**（API/CLI）：
```bash
# 在请求头中携带 API Key
curl -X POST http://localhost:3000/furinakit/api/text/hash \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "hello"}'
```

### 获取 API Key

1. 登录 Web 界面
2. 进入仪表盘 → API Key 管理
3. 创建新的 API Key
4. 复制保存（仅显示一次）

---

## 错误处理

### 错误码

| 错误码 | 说明 |
|--------|------|
| `INVALID_INPUT` | 输入格式错误 |
| `FILE_TOO_LARGE` | 文件过大 |
| `UNSUPPORTED_FORMAT` | 不支持的格式 |
| `PROCESSING_ERROR` | 处理失败 |
| `RATE_LIMITED` | 请求过于频繁 |
| `UNAUTHORIZED` | 未授权 |
| `NOT_FOUND` | 资源不存在 |

### 错误响应示例

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "JSON 格式错误：缺少引号",
    "details": {
      "line": 1,
      "column": 15
    }
  }
}
```

### 常见问题

**Q: 文件上传失败**
A: 检查文件大小是否超过限制（默认 100MB），检查文件格式是否支持。

**Q: API 返回 429**
A: 请求过于频繁，稍后重试。默认限制：60 请求/分钟。

**Q: CLI 命令找不到**
A: 确保已安装依赖 `npm install`，使用 `npm run cli --` 而不是直接 `cli`。

---

## 示例代码

### JavaScript/Node.js

```javascript
// 文本工具
const response = await fetch('http://localhost:3000/furinakit/api/text/json-format', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ text: '{"name":"test"}', indent: 2 }),
});
const result = await response.json();

// 文件工具
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('quality', '80');

const response = await fetch('http://localhost:3000/furinakit/api/image/compress', {
  method: 'POST',
  body: formData,
});
const blob = await response.blob();
```

### Python

```python
import requests

# 文本工具
response = requests.post(
    'http://localhost:3000/furinakit/api/text/json-format',
    json={'text': '{"name":"test"}', 'indent': 2}
)
result = response.json()

# 文件工具
with open('image.png', 'rb') as f:
    response = requests.post(
        'http://localhost:3000/furinakit/api/image/compress',
        files={'file': f},
        data={'quality': '80'}
    )
with open('compressed.png', 'wb') as f:
    f.write(response.content)
```

### cURL

```bash
# 文本工具
curl -X POST http://localhost:3000/furinakit/api/text/hash \
  -H "Content-Type: application/json" \
  -d '{"text": "hello world", "algorithm": "sha256"}'

# 文件工具
curl -X POST http://localhost:3000/furinakit/api/image/compress \
  -F "file=@image.png" \
  -F "quality=80" \
  -o compressed.png
```

---

*本文档更新于 2026-06-06*
