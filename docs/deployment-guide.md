# FurinaKit 部署指南

> 环境配置、CI/CD、Docker 部署

---

## 目录

- [环境变量](#环境变量)
- [本地开发](#本地开发)
- [生产部署](#生产部署)
- [CI/CD](#cicd)
- [Docker 部署](#docker-部署)
- [Nginx 配置](#nginx-配置)

---

## 环境变量

### 必需的环境变量

| 变量 | 说明 | 示例 |
|------|------|------|
| `DATABASE_URL` | 数据库连接字符串 | `file:./dev.db` (开发) |
| `NEXTAUTH_SECRET` | NextAuth 加密密钥 | `your-random-secret` |
| `NEXTAUTH_URL` | 应用 URL | `http://localhost:3000` |

### 可选的环境变量

| 变量 | 说明 | 用途 |
|------|------|------|
| `GITHUB_ID` | GitHub OAuth Client ID | GitHub 登录 |
| `GITHUB_SECRET` | GitHub OAuth Client Secret | GitHub 登录 |
| `RESEND_API_KEY` | Resend API Key | 邮件发送 |
| `EMAIL_FROM` | 发件人地址 | 邮件发送 |
| `SENTRY_DSN` | Sentry DSN | 错误监控 |
| `LOG_LEVEL` | 日志级别 | 日志配置 |

### 环境变量文件

```
.env.example    # 示例文件（提交到 git）
.env.local      # 本地配置（不提交到 git）
.env.production # 生产配置（不提交到 git）
```

### 配置步骤

```bash
# 1. 复制示例文件
cp .env.example .env.local

# 2. 编辑配置
vim .env.local

# 3. 生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

---

## 本地开发

### 环境要求

- Node.js 22+
- npm 10+
- FFmpeg（音视频工具必需）

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/jvwangyi/furinakit.git
cd furinakit

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local

# 4. 初始化数据库
npx prisma migrate dev
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

### 开发命令

| 命令 | 用途 |
|------|------|
| `npm run dev` | 启动开发服务器（Turbopack） |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm test` | 运行单元测试 |
| `npm run test:e2e` | 运行 E2E 测试 |
| `npm run storybook` | 启动 Storybook |

---

## 生产部署

### 构建

```bash
# 1. 安装依赖
npm ci

# 2. 生成 Prisma Client
npx prisma generate

# 3. 构建
npm run build

# 4. 启动
npm start
```

### 环境变量配置

生产环境需要配置：

```bash
# 数据库（PostgreSQL 推荐）
DATABASE_URL="postgresql://user:password@host:5432/furinakit"

# NextAuth
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://yourdomain.com/furinakit"

# GitHub OAuth（可选）
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"

# 邮件（可选）
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="FurinaKit <noreply@yourdomain.com>"
```

### basePath 配置

项目默认 basePath 为 `/furinakit`，可通过环境变量修改：

```bash
# .env.production
NEXT_PUBLIC_BASE_PATH="/furinakit"
```

---

## CI/CD

### GitHub Actions

项目使用 GitHub Actions 进行 CI/CD：

**CI 流程** (`.github/workflows/ci.yml`)：
- 触发：push/PR 到 master/main
- 步骤：类型检查 → Lint → 安全审计 → 测试 → 构建

**部署流程** (`.github/workflows/deploy.yml`)：
- 触发：push 到 master
- 步骤：测试 → 构建 → Docker 构建 → 部署

### CI 配置

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [master, main]
  pull_request:
    branches: [master, main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npm run lint
      - run: npm audit --audit-level=high
      - run: npx vitest run
      - run: npm run build
```

### 部署配置

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [master]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npx prisma generate
      - run: npx tsc --noEmit
      - run: npx vitest run
      - run: npm run build
```

---

## Docker 部署

### Dockerfile

```dockerfile
FROM node:22-alpine AS base

# 依赖安装阶段
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t furinakit .

# 运行容器
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXTAUTH_SECRET="..." \
  -e NEXTAUTH_URL="https://yourdomain.com/furinakit" \
  furinakit
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/furinakit
      - NEXTAUTH_SECRET=your-secret
      - NEXTAUTH_URL=https://yourdomain.com/furinakit
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=furinakit
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Nginx 配置

### 反向代理配置

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL 配置
    ssl_certificate /etc/ssl/certs/yourdomain.com.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.com.key;

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # 文件上传大小限制
    client_max_body_size 100M;

    # 反向代理
    location /furinakit/ {
        proxy_pass http://localhost:3000/furinakit/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态文件缓存
    location /furinakit/_next/static/ {
        proxy_cache_valid 60m;
        add_header Cache-Control "public, immutable, max-age=31536000";
    }
}
```

### Nginx 命令

```bash
# 测试配置
nginx -t

# 重新加载配置
nginx -s reload

# 查看状态
systemctl status nginx
```

---

## 监控和日志

### 应用日志

项目使用 pino 进行日志记录：

```typescript
import { logger } from '@/lib/logger';

logger.info('User logged in', { userId: '123' });
logger.error('Database error', { error: err.message });
```

### 日志级别

| 级别 | 用途 |
|------|------|
| `fatal` | 致命错误，进程退出 |
| `error` | 错误，但进程继续 |
| `warn` | 警告，潜在问题 |
| `info` | 信息，正常操作 |
| `debug` | 调试，详细信息 |
| `trace` | 跟踪，最详细 |

### 健康检查

```bash
# 健康检查端点
curl http://localhost:3000/furinakit/api/health
```

---

## 故障排查

### 常见问题

**构建失败**
```bash
# 检查类型错误
npx tsc --noEmit

# 检查依赖
npm install

# 清理缓存
rm -rf .next node_modules
npm install
```

**数据库连接失败**
```bash
# 检查数据库状态
npx prisma db push

# 重新生成 Client
npx prisma generate

# 查看数据库
npx prisma studio
```

**端口占用**
```bash
# 查看端口占用
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

---

## 回滚

### Git 回滚

```bash
# 回滚到上一个版本
git revert HEAD

# 回滚到特定版本
git revert <commit-hash>

# 强制回滚（慎用）
git reset --hard <commit-hash>
```

### Docker 回滚

```bash
# 查看历史镜像
docker images furinakit

# 运行旧版本
docker run -p 3000:3000 furinakit:<old-tag>
```
