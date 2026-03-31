# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制根目录的 package.json 和 package-lock.json
COPY package*.json ./

# 复制 apps/api 的 package.json
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# 安装所有依赖（包括 workspaces）
RUN npm ci

# 复制源代码
COPY apps/api ./apps/api

# 生成 Prisma 客户端
RUN cd apps/api && npx prisma generate

# 编译 TypeScript
RUN cd apps/api && npm run build

# 生产阶段
FROM node:20-alpine

WORKDIR /app

# 安装必要的系统依赖
RUN apk add --no-cache openssl

# 复制 package.json
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# 安装生产依赖
RUN npm ci --only=production

# 生成 Prisma 客户端
RUN cd apps/api && npx prisma generate

# 从构建阶段复制编译后的代码
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# 暴露端口
EXPOSE 3001

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动命令
CMD ["node", "apps/api/dist/index.js"]
