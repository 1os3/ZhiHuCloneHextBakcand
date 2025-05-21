# 论坛系统部署指南

## 系统概述

这是一个完整的论坛系统，包含以下组件：

- 后端API服务 (Node.js + Express + TypeScript)
- PostgreSQL数据库 (持久化存储)
- Redis缓存服务
- Nginx反向代理
- PgAdmin数据库管理工具

本系统使用Docker容器化，可以在任何安装了Docker的计算机上运行，无需安装其他依赖。

## 部署前提条件

- Docker Engine 版本 20.10.0 或更高
- Docker Compose 版本 2.0.0 或更高
- 至少 2GB 内存
- 至少 10GB 磁盘空间（用于存储数据和日志）

## 部署步骤

### Windows系统

1. 确保已安装Docker Desktop并正在运行
2. 将整个分发包解压到任意目录
3. 打开PowerShell或命令提示符，导航到解压目录
4. 运行启动脚本：
   ```powershell
   .\start-forum.ps1
   ```

### Linux/macOS系统

1. 确保已安装Docker Engine和Docker Compose
2. 将整个分发包解压到任意目录
3. 打开终端，导航到解压目录
4. 给脚本添加执行权限并运行：
   ```bash
   chmod +x start-forum.sh
   ./start-forum.sh
   ```

## 访问方式

部署成功后，可通过以下方式访问系统：

- **论坛API服务**：http://localhost:3000
  - 健康检查：http://localhost:3000/health
  
- **Web界面**：http://localhost:80

- **PostgreSQL数据库**：
  - 主机：localhost
  - 端口：5432
  - 用户名：postgres
  - 密码：postgres
  - 数据库名：forum

- **PgAdmin数据库管理工具**：http://localhost:5050
  - 登录邮箱：admin@example.com
  - 密码：admin
  - 连接数据库时使用服务器地址：postgres（不是localhost）

## 数据持久化

数据库数据存储在Docker命名卷中，即使容器停止或重启，数据也不会丢失。具体卷名为：

- `forum-postgres-data`：数据库文件
- `forum-redis-data`：缓存数据
- `forum-pgadmin-data`：PgAdmin配置
- `forum-logs-data`：系统日志

## 常用操作命令

### 查看运行状态

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志

```bash
# 查看API服务日志
docker logs forum-server

# 查看数据库日志
docker logs forum-postgres
```

### 停止服务

```bash
docker-compose -f docker-compose.prod.yml down
```

### 重启服务

```bash
docker-compose -f docker-compose.prod.yml restart
```

### 完全卸载（会删除所有数据）

```bash
docker-compose -f docker-compose.prod.yml down -v
```

## 安全注意事项

1. 默认配置使用简单密码，生产环境部署时应修改 `docker-compose.prod.yml` 中的密码和密钥
2. 默认暴露了数据库和Redis端口，生产环境部署时可以考虑移除这些端口映射
3. 生产环境建议配置SSL证书以启用HTTPS

## 问题排查

1. 如果启动失败，请检查Docker是否正常运行
2. 查看容器日志可以帮助诊断问题 (`docker logs [容器名]`)
3. 确保所需端口未被其他应用占用（3000, 5432, 6379, 5050, 80, 443）

## API文档

详细的API文档请参考 `API.md` 文件。
