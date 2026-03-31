# 企业办公系统部署指南

## 免费部署方案

### 方案概述
本系统采用前后端分离架构，可以使用以下免费云服务进行部署：

| 服务 | 提供商 | 免费额度 |
|------|--------|----------|
| 前端托管 | Vercel | 永久免费 |
| 后端API | Railway / Render | 每月500小时 |
| 数据库 | Supabase | 500MB存储 |
| 文件存储 | Supabase Storage | 1GB存储 |

---

## 1. 数据库部署（Supabase）

### 1.1 注册Supabase
1. 访问 https://supabase.com
2. 使用GitHub账号登录
3. 创建新项目

### 1.2 获取数据库连接信息
1. 进入项目设置 → Database
2. 复制 Connection String
3. 格式：`postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`

### 1.3 配置环境变量
```bash
# apps/api/.env
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
```

---

## 2. 后端部署（Railway）

### 2.1 准备代码
```bash
# 进入后端目录
cd apps/api

# 安装依赖
npm install

# 生成Prisma客户端
npx prisma generate

# 部署数据库迁移
npx prisma migrate deploy
```

### 2.2 部署到Railway
1. 访问 https://railway.app
2. 从GitHub导入项目
3. 选择 `apps/api` 目录
4. 添加环境变量：
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CORS_ORIGIN`

### 2.3 获取API地址
部署成功后，Railway会提供一个域名，例如：`https://office-api.up.railway.app`

---

## 3. 前端部署（Vercel）

### 3.1 准备代码
```bash
# 进入前端目录
cd apps/web

# 安装依赖
npm install

# 构建
npm run build
```

### 3.2 部署到Vercel
1. 访问 https://vercel.com
2. 从GitHub导入项目
3. 配置构建设置：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `apps/web`

4. 添加环境变量：
   ```
   VITE_API_BASE_URL=https://office-api.up.railway.app/api
   VITE_WS_URL=https://office-api.up.railway.app
   ```

### 3.3 配置CORS
在后端环境变量中添加：
```
CORS_ORIGIN=https://your-frontend.vercel.app
```

---

## 4. 本地开发环境

### 4.1 启动数据库
使用Docker启动PostgreSQL：
```bash
docker run -d \
  --name office-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=office_system \
  -p 5432:5432 \
  postgres:15
```

### 4.2 启动后端
```bash
cd apps/api
npm install
cp .env.example .env
# 编辑 .env 配置数据库连接
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 4.3 启动前端
```bash
cd apps/web
npm install
cp .env.example .env.local
npm run dev
```

---

## 5. 系统配置

### 5.1 默认管理员账号
- 用户名：`admin`
- 密码：`admin123`

**重要**：首次登录后请立即修改密码！

### 5.2 修改系统名称
1. 使用管理员账号登录
2. 进入 系统管理 → 系统配置
3. 修改 `system_name` 配置项

---

## 6. 性能优化

### 6.1 数据库索引
系统已自动创建必要的索引，如需额外优化：
```sql
-- 消息查询优化
CREATE INDEX idx_messages_chat_created ON "messages"("chat_id", "created_at" DESC);

-- 审批查询优化
CREATE INDEX idx_approvals_status ON "approvals"("status", "created_at" DESC);
```

### 6.2 API响应优化
- 已启用数据库连接池
- 已配置API响应压缩
- 已添加请求限流

---

## 7. 安全建议

1. **修改默认密码**：首次登录后立即修改
2. **使用HTTPS**：生产环境强制使用HTTPS
3. **定期备份**：定期备份Supabase数据库
4. **环境变量**：不要将敏感信息提交到Git
5. **JWT密钥**：使用强随机字符串作为JWT密钥

---

## 8. 故障排查

### 8.1 数据库连接失败
- 检查DATABASE_URL格式
- 确认Supabase项目状态
- 检查IP白名单设置

### 8.2 API响应慢
- 检查数据库连接池配置
- 查看Railway资源使用情况
- 考虑升级Railway付费计划

### 8.3 前端无法连接API
- 检查CORS配置
- 确认环境变量设置
- 查看浏览器控制台错误

---

## 9. 升级维护

### 9.1 数据库迁移
```bash
cd apps/api
npx prisma migrate dev --name [迁移名称]
```

### 9.2 重新部署
- Railway会自动重新部署（Git推送触发）
- Vercel会自动重新部署

---

## 10. 技术支持

如有问题，请检查：
1. 各服务的日志输出
2. 浏览器开发者工具网络请求
3. 后端API健康检查端点：`/health`
