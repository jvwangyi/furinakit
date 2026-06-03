# FurinaKit 🎭

<div align="center">

**[中文](#中文)** | **[English](#english)** | **[日本語](#日本語)** | **[한국어](#한국어)**

---

### 芙宁娜的在线工具箱

**一站式文件处理平台 · 62 款专业工具 · Web / API / CLI 三端协同**

🌐 **公网访问地址：http://8.130.38.139:9003/furinakit**

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&style=flat-square)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css&style=flat-square)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-396%20passed-brightgreen?style=flat-square)](#测试覆盖)

<br/>

🌐 **[在线体验](http://8.130.38.139:9003/furinakit)** · [报告 Bug](https://github.com/jvwangyi/furinakit/issues) · [功能建议](https://github.com/jvwangyi/furinakit/issues)

</div>

---

## 中文

### ✨ 项目简介

FurinaKit 是一个现代化的在线工具箱，提供 **62 款专业文件处理工具**，涵盖 PDF、图片、视频、音频、文本、开发辅助等多个领域。采用 Next.js 16 构建，支持 Web 界面、REST API 和命令行工具三种使用方式，满足不同场景的需求。

### 🎯 核心特性

| 特性 | 说明 |
|------|------|
| 🛠️ **62 款工具** | PDF 处理、图片编辑、视频转换、音频剪辑、文本工具、开发辅助等 |
| 🌍 **四语言支持** | 中文 / English / 日本語 / 한국어 完整国际化 |
| 🎨 **精美界面** | 基于 shadcn/ui 的现代化设计，支持亮色/暗色主题 |
| 📱 **响应式设计** | 完美适配桌面端、平板和移动端 |
| ⚡ **三端可用** | Web 界面 / REST API / 命令行工具 |
| 🧪 **质量保障** | 346 个单元测试 + 50 个 E2E 测试，100% 工具覆盖 |
| 📖 **组件文档** | Storybook 驱动的交互式组件文档 |

### 📦 工具分类

<details>
<summary><strong>📄 PDF 处理 (10 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| pdf-merge | 合并多个 PDF 文件为一个 |
| pdf-split | 按页码或范围拆分 PDF |
| pdf-compress | 智能压缩 PDF 文件大小 |
| pdf-rotate | 旋转 PDF 页面方向 |
| pdf-extract-pages | 提取指定页面生成新文件 |
| pdf-delete-pages | 删除不需要的页面 |
| pdf-encrypt | 添加密码保护和权限控制 |
| pdf-watermark | 添加文字水印 |
| pdf-add-page-numbers | 自动添加页码 |
| pdf-to-image | PDF 转图片 (PNG/JPG) |

</details>

<details>
<summary><strong>🖼️ 图片处理 (11 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| image-compress | 智能压缩图片大小，支持批量 |
| image-convert | 转换格式 (PNG/JPG/WebP/GIF) |
| image-crop | 可视化裁剪图片 |
| image-resize | 调整图片尺寸，保持比例 |
| image-rotate | 旋转图片角度 |
| image-add-watermark | 添加文字或图片水印 |
| image-merge | 拼接多张图片 |
| image-to-pdf | 图片转 PDF 文档 |
| image-to-base64 | 图片转 Base64 编码 |
| base64-to-image | Base64 解码为图片 |
| image-to-ico | 生成 ICO 图标文件 |

</details>

<details>
<summary><strong>📝 文本处理 (12 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| json-format | JSON 格式化与验证 |
| json-to-csv | JSON 转 CSV 表格 |
| json-to-yaml | JSON 转 YAML 格式 |
| json-to-xml | JSON 转 XML 格式 |
| csv-to-json | CSV 转 JSON 数组 |
| csv-to-excel | CSV 转 Excel 表格 |
| excel-to-csv | Excel 转 CSV |
| markdown-to-html | Markdown 实时预览转 HTML |
| text-case | 大小写转换 (驼峰/蛇形/烤串等) |
| text-count | 字数、行数、段落统计 |
| text-diff | 文本差异对比，高亮显示 |
| base64 | Base64 编解码 |

</details>

<details>
<summary><strong>🎬 视频处理 (3 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| video-compress | 压缩视频大小，支持质量调节 |
| video-trim | 裁剪视频片段 |
| video-to-audio | 提取视频中的音频 |

</details>

<details>
<summary><strong>🎵 音频处理 (2 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| audio-convert | 转换格式 (MP3/WAV/AAC/OGG) |
| audio-trim | 裁剪音频片段 |

</details>

<details>
<summary><strong>💻 开发工具 (13 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| hash | 哈希计算 (MD5/SHA1/SHA256/SHA512) |
| base64 | Base64 编解码 |
| url-encode | URL 编解码 |
| timestamp | 时间戳与日期互转 |
| uuid-gen | UUID 生成器 |
| password-gen | 安全密码生成器 |
| regex-tester | 正则表达式测试与匹配 |
| color-convert | 颜色格式转换 (HEX/RGB/HSL) |
| cron-parser | Cron 表达式解析 |
| cron-gen | Cron 表达式生成器 |
| css-format | CSS 代码格式化 |
| html-format | HTML 代码格式化 |
| sql-format | SQL 语句格式化 |

</details>

<details>
<summary><strong>🔄 格式转换 (5 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| yaml-to-json | YAML 转 JSON |
| xml-to-json | XML 转 JSON |
| markdown-to-pdf | Markdown 转 PDF 文档 |
| csv-to-excel | CSV 转 Excel 表格 |
| image-to-base64 | 图片转 Base64 |

</details>

<details>
<summary><strong>📁 文件管理 (2 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| file-info | 查看文件详细信息 |
| file-hash | 计算文件哈希值 |

</details>

<details>
<summary><strong>🎨 手工创意 (1 个)</strong></summary>

| 工具 | 说明 |
|------|------|
| perler-beads | 拼豆图纸生成器，支持多种色板 |

</details>

### 🚀 快速开始

**在线使用（推荐）**

无需安装，直接访问：http://8.130.38.139:9003/furinakit

**本地部署**

```bash
# 克隆仓库
git clone https://github.com/jvwangyi/furinakit.git
cd furinakit

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000 开始使用。

### 📖 使用方式

**Web 界面**
访问 http://localhost:3000，选择工具即可使用。

**REST API**
```bash
# JSON 格式化
curl -X POST http://localhost:3000/api/text/json-format \
  -H "Content-Type: application/json" \
  -d '{"text": "{\"name\":\"test\"}", "indent": 2}'

# 图片压缩
curl -X POST http://localhost:3000/api/image/compress \
  -F "file=@image.png" \
  -F "quality=80" \
  -o compressed.png
```

**命令行工具**
```bash
npm run cli -- --help
npm run cli -- json-format '{"name":"test"}'
```

### 🧪 测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e

# Storybook
npm run storybook
```

### 📊 测试覆盖

| 类型 | 数量 | 状态 |
|------|------|------|
| 单元测试 | 346 | ✅ 全部通过 |
| E2E 测试 | 50 | ✅ 全部通过 |
| Storybook | 15 | ✅ 构建成功 |
| i18n 覆盖 | 100% | ✅ 无缺失 |

---

## English

### ✨ About

FurinaKit is a modern online toolbox providing **62 professional file processing tools** across PDF, image, video, audio, text, and developer utilities. Built with Next.js 16, it supports Web UI, REST API, and CLI interfaces to meet diverse workflow needs.

### 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🛠️ **62 Tools** | PDF processing, image editing, video conversion, audio trimming, text utilities, dev tools |
| 🌍 **4 Languages** | Chinese / English / Japanese / Korean with full i18n |
| 🎨 **Beautiful UI** | Modern design based on shadcn/ui with light/dark theme |
| 📱 **Responsive** | Perfect adaptation for desktop, tablet, and mobile |
| ⚡ **3 Interfaces** | Web UI / REST API / Command Line |
| 🧪 **Quality** | 346 unit tests + 50 E2E tests with 100% tool coverage |
| 📖 **Documentation** | Storybook-driven interactive component docs |

### 🚀 Quick Start

**Online (Recommended)**

No installation required: http://8.130.38.139:9003/furinakit

**Local Deployment**

```bash
git clone https://github.com/jvwangyi/furinakit.git
cd furinakit
npm install
npm run dev
```

Visit http://localhost:3000 to get started.

### 📖 Usage

**Web Interface**
Visit http://localhost:3000 and select a tool.

**REST API**
```bash
curl -X POST http://localhost:3000/api/text/json-format \
  -H "Content-Type: application/json" \
  -d '{"text": "{\"name\":\"test\"}", "indent": 2}'
```

**CLI**
```bash
npm run cli -- --help
npm run cli -- json-format '{"name":"test"}'
```

---

## 日本語

### ✨ 概要

FurinaKit は、PDF、画像、動画、音声、テキスト、開発ツールなど **62 のプロフェッショナルなファイル処理ツール** を提供するモダンなオンラインツールボックスです。Next.js 16 で構築され、Web UI、REST API、CLI の 3 つのインターフェースをサポートしています。

### 🎯 主な特徴

| 特徴 | 説明 |
|------|------|
| 🛠️ **62 ツール** | PDF 処理、画像編集、動画変換、音声トリミング、テキストツール、開発ツール |
| 🌍 **4 言語対応** | 中文 / English / 日本語 / 한국어 完全対応 |
| 🎨 **美しい UI** | shadcn/ui ベースのモダンデザイン、ライト/ダークテーマ対応 |
| 📱 **レスポンシブ** | デスクトップ、タブレット、モバイルに完全対応 |
| ⚡ **3 インターフェース** | Web UI / REST API / コマンドライン |
| 🧪 **品質保証** | 346 の単体テスト + 50 の E2E テスト、100% カバレッジ |
| 📖 **ドキュメント** | Storybook によるインタラクティブなコンポーネントドキュメント |

### 🚀 クイックスタート

**オンライン利用（推奨）**

インストール不要：http://8.130.38.139:9003/furinakit

**ローカルデプロイ**

```bash
git clone https://github.com/jvwangyi/furinakit.git
cd furinakit
npm install
npm run dev
```

http://localhost:3000 にアクセスして開始してください。

---

## 한국어

### ✨ 소개

FurinaKit은 PDF, 이미지, 비디오, 오디오, 텍스트, 개발 도구 등 **62개의 전문 파일 처리 도구**를 제공하는 현대적인 온라인 도구 상자입니다. Next.js 16으로 구축되었으며, Web UI, REST API, CLI의 3가지 인터페이스를 지원합니다.

### 🎯 주요 기능

| 기능 | 설명 |
|------|------|
| 🛠️ **62개 도구** | PDF 처리, 이미지 편집, 비디오 변환, 오디오 트리밍, 텍스트 도구, 개발 도구 |
| 🌍 **4개 언어** | 中文 / English / 日本語 / 한국어 완전 지원 |
| 🎨 **아름다운 UI** | shadcn/ui 기반 모던 디자인, 라이트/다크 테마 지원 |
| 📱 **반응형** | 데스크톱, 태블릿, 모바일 완벽 대응 |
| ⚡ **3가지 인터페이스** | Web UI / REST API / 커맨드 라인 |
| 🧪 **품질 보증** | 346개 단위 테스트 + 50개 E2E 테스트, 100% 커버리지 |
| 📖 **문서** | Storybook 기반 인터랙티브 컴포넌트 문서 |

### 🚀 빠른 시작

**온라인 사용 (권장)**

설치 필요 없음: http://8.130.38.139:9003/furinakit

**로컬 배포**

```bash
git clone https://github.com/jvwangyi/furinakit.git
cd furinakit
npm install
npm run dev
```

http://localhost:3000 에서 시작하세요.

---

## 📁 프로젝트 구조

```
furinakit/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── [category]/         # 동적 카테고리 라우트
│   │   ├── api/                # API 라우트
│   │   └── api-docs/           # API 문서 페이지
│   ├── components/
│   │   ├── layout/             # 레이아웃 컴포넌트
│   │   ├── shared/             # 공유 컴포넌트
│   │   ├── tools/              # 도구 컴포넌트
│   │   └── ui/                 # UI 컴포넌트 (shadcn/ui)
│   ├── lib/
│   │   ├── locales/            # i18n 파일 (zh/en/ja/ko)
│   │   └── tools/              # 도구 구현
│   ├── stories/                # Storybook stories
│   └── types/                  # TypeScript 타입 정의
├── tests/                      # 단위 테스트
├── e2e/                        # E2E 테스트
├── cli/                        # CLI 도구
└── docs/                       # 프로젝트 문서
```

---

## 🛠️ 개발 가이드

### 새 도구 추가

1. 도구 구현 생성: `src/lib/tools/<tool-name>.ts`
2. API 라우트 생성: `src/app/api/<category>/<tool-name>/route.ts`
3. 도구 등록: `src/lib/tools/index.ts`
4. i18n 번역 추가 (4개 언어 파일)
5. 테스트 작성: `tests/tools/<tool-name>.test.ts`

자세한 내용은 `CLAUDE.md`를 참조하세요.

### 코드 스타일

- TypeScript 엄격 모드 사용
- ESLint 규칙 준수
- shadcn/ui 스타일 컴포넌트
- `ToolError` + `ErrorCode`로 오류 처리

---

## 🤝 기여하기

Issue와 Pull Request를 환영합니다!

1. 이 저장소를 Fork하세요
2. 기능 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경 사항 커밋: `git commit -m 'feat: add amazing feature'`
4. 브랜치 푸시: `git push origin feature/amazing-feature`
5. Pull Request 생성

---

## 📄 라이선스

이 프로젝트는 [MIT License](LICENSE)를 따릅니다.

---

## 🙏 감사의 말

- [Next.js](https://nextjs.org/) - React 프레임워크
- [shadcn/ui](https://ui.shadcn.com/) - UI 컴포넌트 라이브러리
- [Tailwind CSS](https://tailwindcss.com/) - CSS 프레임워크
- [pdf-lib](https://pdf-lib.js.org/) - PDF 처리 라이브러리
- [Sharp](https://sharp.pixelplumbing.com/) - 이미지 처리 라이브러리
- [FFmpeg](https://ffmpeg.org/) - 비디오/오디오 처리

---

<div align="center">

**Made with ❤️ by FurinaKit Team**

[![GitHub stars](https://img.shields.io/github/stars/jvwangyi/furinakit?style=social)](https://github.com/jvwangyi/furinakit/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/jvwangyi/furinakit?style=social)](https://github.com/jvwangyi/furinakit/network/members)

</div>
