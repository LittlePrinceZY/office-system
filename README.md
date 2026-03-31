# 🏢 智慧办公系统

一个功能完善的企业级办公系统，包含通讯录、即时通讯、审批管理、公示公告、财务报销、客户管理等核心模块。

## ✨ 功能特性

### 核心模块
- 👥 **通讯录** - 组织架构管理、员工信息、部门管理
- 💬 **即时通讯** - 单聊、群聊、文字/图片/文件消息、@功能
- 📋 **审批管理** - 自定义审批流程、表单设计器、审批流转
- 📢 **公示公告** - 公告发布、分类管理、阅读统计
- 💰 **财务报销** - 报销申请、审批流程、统计报表
- 👔 **客户管理** - CRM系统、联系人管理、合同管理、跟进记录

### 系统特性
- 🔐 **RBAC权限管理** - 基于角色的访问控制
- 🎨 **双模式界面** - 门户模式 + 办公模式
- ⚡ **实时通讯** - WebSocket实时消息推送
- 📱 **响应式设计** - 适配桌面和移动设备
- 🌐 **云端部署** - 支持免费云服务部署

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 14+
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd office-system
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装后端依赖
cd apps/api && npm install

# 安装前端依赖
cd ../web && npm install
```

3. **配置环境变量**
```bash
# 后端配置
cd apps/api
cp .env.example .env
# 编辑 .env 文件，配置数据库连接

# 前端配置
cd ../web
cp .env.example .env.local
# 编辑 .env.local 文件，配置API地址
```

4. **初始化数据库**
```bash
cd apps/api
npx prisma migrate dev
npx prisma db seed
```

5. **启动开发服务器**
```bash
# 启动后端（端口3001）
cd apps/api
npm run dev

# 启动前端（端口3000）
cd apps/web
npm run dev
```

6. **访问系统**
- 前端地址：http://localhost:3000
- 后端API：http://localhost:3001/api
- 默认管理员：admin / admin123

## 📁 项目结构

```
office-system/
├── apps/
│   ├── api/                 # 后端API (Node.js + Express)
│   │   ├── src/
│   │   │   ├── routes/      # API路由
│   │   │   ├── services/    # 业务逻辑
│   │   │   ├── middleware/  # 中间件
│   │   │   └── utils/       # 工具函数
│   │   └── prisma/          # 数据库Schema
│   └── web/                 # 前端应用 (React + Ant Design)
│       ├── src/
│       │   ├── pages/       # 页面组件
│       │   ├── components/  # 公共组件
│       │   ├── stores/      # 状态管理
│       │   └── utils/       # 工具函数
│       └── public/          # 静态资源
├── docs/                    # 文档
└── package.json             # 根目录配置
```

## 🛠️ 技术栈

### 后端
- **运行时**: Node.js 20
- **框架**: Express.js
- **语言**: TypeScript
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **认证**: JWT
- **实时通信**: Socket.io

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **UI组件库**: Ant Design 5
- **状态管理**: Zustand
- **路由**: React Router v6
- **构建工具**: Vite

## 🌐 部署

### 免费部署方案

| 服务 | 提供商 | 免费额度 |
|------|--------|----------|
| 前端托管 | Vercel | 永久免费 |
| 后端API | Railway | 每月500小时 |
| 数据库 | Supabase | 500MB存储 |

详细部署指南请查看 [docs/deployment.md](./docs/deployment.md)

## 🔧 系统配置

### 修改系统名称
1. 使用管理员账号登录
2. 进入 系统管理 → 系统配置
3. 修改 `system_name` 配置项

### 权限管理
- 超级管理员拥有所有权限
- 支持自定义角色和权限分配
- 支持部门级别的数据隔离

## 📊 性能指标

- API响应时间: < 5ms（本地环境）
- 支持并发用户: 100+
- 数据库连接池: 自动管理
- 前端首屏加载: < 2s

## 🔐 安全特性

- JWT认证 + Refresh Token
- 密码bcrypt加密
- API请求限流
- SQL注入防护
- XSS防护
- CORS配置

## 📝 开发计划

- [x] 用户权限管理
- [x] 通讯录管理
- [x] 即时通讯
- [x] 审批管理
- [x] 公示公告
- [x] 财务报销
- [x] 客户管理
- [ ] 日程管理
- [ ] 文件管理
- [ ] 报表统计
- [ ] 移动端适配

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 💬 联系我们

如有问题或建议，欢迎通过以下方式联系：
- 邮箱：support@example.com
- 问题反馈：GitHub Issues

---

**注意**：本项目仅供学习和参考使用，生产环境使用前请进行充分测试。
