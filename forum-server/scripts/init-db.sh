#!/bin/bash

# 等待 PostgreSQL 启动
echo "Waiting for PostgreSQL to start..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL started, initializing database..."

# 运行数据库迁移
npm run typeorm migration:run

# 如果需要，可以在这里添加初始数据的插入
# 例如创建管理员账户等

echo "Database initialization completed!"
