# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖
RUN npm install

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p public scripts

# 编译 TypeScript
RUN npm run build

# 生产阶段
FROM node:18-alpine AS production

# 安装必要的工具
RUN apk add --no-cache postgresql-client wget

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm install --only=production

# 创建必要的目录
RUN mkdir -p dist public scripts logs

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist/ ./dist/

# 复制其他必要文件
COPY --from=builder /app/public/ ./public/
COPY --from=builder /app/scripts/ ./scripts/

# 创建启动脚本
RUN echo '#!/bin/sh' > /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# 等待数据库就绪' >> /app/docker-entrypoint.sh && \
    echo 'echo "Waiting for PostgreSQL to be ready..."' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'until pg_isready -h $DATABASE_HOST -p $DATABASE_PORT -U $DATABASE_USER; do' >> /app/docker-entrypoint.sh && \
    echo '  echo "PostgreSQL is unavailable - sleeping"' >> /app/docker-entrypoint.sh && \
    echo '  sleep 2' >> /app/docker-entrypoint.sh && \
    echo 'done' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo 'echo "PostgreSQL is up - starting application"' >> /app/docker-entrypoint.sh && \
    echo '' >> /app/docker-entrypoint.sh && \
    echo '# 启动应用' >> /app/docker-entrypoint.sh && \
    echo 'node dist/server.js' >> /app/docker-entrypoint.sh

# 设置执行权限
RUN chmod +x /app/docker-entrypoint.sh

# 创建空的 init-db.sh 脚本如果不存在
RUN if [ ! -f ./scripts/init-db.sh ]; then \
    echo '#!/bin/sh\necho "No database initialization script provided"' > ./scripts/init-db.sh; \
    fi

# 设置执行权限
RUN chmod +x ./scripts/init-db.sh

# 暴露端口
EXPOSE 3000

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
CMD ["/app/docker-entrypoint.sh"]
