# FurinaKit 开发进度

## 已完成

### 安全加固
- [x] 邮箱验证注册（6位验证码，10分钟有效）
- [x] 验证码防暴力破解（crypto.randomInt + 5次锁定）
- [x] Session token httpOnly cookie
- [x] 注册防枚举（统一返回 needVerification）
- [x] 速率限制（rate-limiter-flexible）
- [x] 密码强度校验（≥8位 + 字母数字）
- [x] 邮箱格式校验
- [x] 用户名 XSS 过滤（sanitizeName）
- [x] 错误信息脱敏
- [x] 验证码发送失败阻断注册

### 功能开发
- [x] GitHub OAuth 登录（allowDangerousEmailAccountLinking）
- [x] 用户仪表盘（/dashboard）
- [x] 使用历史记录（自动记录到数据库）
- [x] 收藏功能（登录存数据库，未登录存 localStorage）
- [x] 用户统计（总使用、常用排行）
- [x] API Key 管理（创建/删除/小眼睛/复制）
- [x] API Key localStorage 持久化
- [x] 工具参数记忆（useToolMemory hook）

### 基础设施
- [x] CI 增强（type-check + lint + security audit）
- [x] CD 部署工作流（deploy.yml）
- [x] 结构化日志（pino）
- [x] Docker Compose + Nginx 反向代理
- [x] 临时文件自动清理
- [x] 环境变量模板（.env.example）
- [x] PR 模板 + 安全策略

### 文件安全
- [x] Magic bytes 类型检测
- [x] MIME 类型白名单
- [x] 危险扩展名黑名单
- [x] 文件名清洗
- [x] 操作超时保护

### i18n
- [x] 四语言支持（zh/en/ja/ko）
- [x] Dashboard/API Key 翻译
- [x] ToolOptions 翻译（72处硬编码修复）
- [x] 翻译文件完整性验证（937 key × 4语言，全部一致）

### UI/UX
- [x] 星空粒子背景（Canvas，跟随触摸，随机颜色）
- [x] 移动端适配（粒子数量/范围缩小）
- [x] 文本对比工具 DiffViewer 修复
- [x] 进制转换等工具默认值修复

### 文档
- [x] CLAUDE.md 开发规范
- [x] SECURITY.md 安全策略

### 最终审查 (2026-06-05)
- [x] TypeScript 类型检查：零错误通过
- [x] Next.js 构建：103 静态页面成功生成
- [x] i18n 完整性：zh/en/ja/ko 各 937 key，完全一致
- [x] 代码质量：无残留 console.log，错误处理规范
- [x] 安全配置：所有 auth 路由有速率限制，httpOnly cookie，文件类型校验
- [x] Dashboard 页面中文硬编码已全部修复

## 待办
- [ ] 低优先级：AuthButton.tsx 中 `登录` 文本改用 i18n `t()`
- [ ] 低优先级：api-keys 路由添加显式速率限制
- [ ] SEO：部分工具页面动态 metadata
- [ ] 低危安全：CSRF token、VerificationToken 定时清理
- [ ] 处理历史文件可重新下载
