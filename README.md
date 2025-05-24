# 开源论坛系统 (ZhiHu Clone) - 后端API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/1os3/ZhiHuCloneHextBakcand)

一个仿知乎风格的现代论坛系统后端API，采用Node.js + Express + TypeScript构建，支持用户发帖、评论、点赞、收藏等功能。

**注意：这是一个纯后端项目，提供RESTful API接口。**

## 📖 API文档

完整的API文档请参考：[API.md](./API.md)

## 设计目的

本项目旨在构建一个高性能、可扩展的社区论坛系统后端，具有以下特点：

- **高性能**：采用现代化的技术栈，确保系统响应迅速
- **可扩展**：微服务架构设计，便于功能扩展
- **安全可靠**：完善的安全机制，保护用户数据和隐私
- **标准化**：遵循RESTful API设计规范
- **易于集成**：提供完整的API文档，便于前端集成

## 技术栈

### 后端
- Node.js + Express + TypeScript
- JWT 身份验证
- PostgreSQL 数据库
- Redis 缓存
- Docker 容器化

### 开发工具
- ESLint + Prettier 代码规范
- Jest 单元测试
- GitHub Actions CI/CD

## 系统架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│     客户端       │ ◄──► │     API网关     │ ◄──► │     后端服务     │
│   (任意前端)     │     │    (Nginx)     │     │   (Node.js)    │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                                  │
                                                                  ▼
                                                          ┌─────────────────┐
                                                          │                 │
                                                          │     数据库       │
                                                          │   (PostgreSQL)  │
                                                          │                 │
                                                          └─────────────────┘
```

## 功能特性

### 用户功能
- 用户注册/登录/登出
- 个人资料管理
- 发帖/评论/回复
- 点赞/收藏/关注
- 消息通知
- 搜索功能

### 管理功能
- 用户管理
- 内容审核
- 数据统计
- 系统设置

## 快速开始

### 环境要求

- Docker 20.10+
- Docker Compose 2.0+
- Node.js 16+ (仅开发环境)
- PostgreSQL 13+ (仅开发环境)
- Redis 6+ (仅开发环境)

## 🚀 部署方式

### 方式一：使用预构建的Docker镜像（推荐）

#### 1. 拉取最新镜像
```bash
# 从GitHub Container Registry拉取
docker pull ghcr.io/1os3/zhihu-clone-backend:latest

```

#### 2. 使用生产环境配置启动
```bash
# 克隆仓库获取配置文件
git clone https://github.com/1os3/ZhiHuCloneHextBakcand.git
cd ZhiHuClone/forum-server

# 更新docker-compose.prod.yml中的镜像名称
# 将 forum-server-api:latest 改为 ghcr.io/1os3/zhihu-clone-backend:latest

# 启动所有服务
docker-compose -f docker-compose.prod.yml up -d
```

#### 3. 验证部署
```bash
# 检查服务状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f api

# 测试API
curl http://localhost:3000/health
```

### 方式二：本地构建Docker镜像

#### 1. 克隆仓库
```bash
git clone https://github.com/1os3/ZhiHuCloneHextBakcand.git
cd ZhiHuClone/forum-server
```

#### 2. 构建镜像
```bash
# 构建API镜像
docker build -t forum-server-api:latest .

# 或使用构建脚本
./pack-all-images.sh  # Linux/macOS
# 或
./pack-all-images.ps1  # Windows PowerShell
```

#### 3. 启动服务
```bash
# 开发环境
docker-compose up -d

# 生产环境
docker-compose -f docker-compose.prod.yml up -d
```

### 方式三：本地开发环境

#### 1. 安装依赖
```bash
cd forum-server
npm install
```

#### 2. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env
```

#### 3. 启动数据库服务
```bash
# 只启动数据库和Redis
docker-compose up -d postgres redis
```

#### 4. 启动API服务
```bash
# 开发模式（热重载）
npm run dev

# 生产模式
npm run build
npm start
```

## 🔧 配置说明

### 环境变量配置

主要环境变量说明：

```bash
# 应用配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=forum
DATABASE_USER=postgres
DATABASE_PASSWORD=your_secure_password

# Redis配置
REDIS_HOST=redis
REDIS_PORT=6379

# JWT配置
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Cookie配置
COOKIE_SECRET=your_cookie_secret_key

# 日志配置
LOG_LEVEL=info
LOG_MAX_FILES=30
LOG_MAX_SIZE=10m
```

### 生产环境安全配置

⚠️ **重要：生产环境部署前请务必修改以下配置**

1. **修改默认密码**：
   - 数据库密码：`POSTGRES_PASSWORD`
   - pgAdmin密码：`PGADMIN_DEFAULT_PASSWORD`

2. **生成安全密钥**：
   - JWT密钥：`JWT_SECRET`
   - Cookie密钥：`COOKIE_SECRET`

3. **配置SSL证书**：
   - 将SSL证书放置在 `nginx/ssl/` 目录
   - 更新 `nginx/conf/` 中的配置文件

## 📊 服务访问

部署成功后，可以通过以下地址访问各项服务：

| 服务 | 地址 | 说明 |
|------|------|------|
| API服务 | http://localhost:3000 | 主要API接口 |
| API文档 | http://localhost:3000/api-docs | Swagger文档 |
| 健康检查 | http://localhost:3000/health | 服务状态检查 |
| pgAdmin | http://localhost:5050 | 数据库管理界面 |
| Nginx | http://localhost:80 | 反向代理（生产环境） |

## 🔍 故障排除

### 常见问题

1. **端口冲突**
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :3000
   
   # 修改docker-compose.yml中的端口映射
   ports:
     - "3001:3000"  # 将本地端口改为3001
   ```

2. **数据库连接失败**
   ```bash
   # 检查数据库容器状态
   docker-compose logs postgres
   
   # 手动测试数据库连接
   docker exec -it forum-postgres psql -U postgres -d forum
   ```

3. **权限问题**
   ```bash
   # 修复日志目录权限
   sudo chown -R 1000:1000 logs/
   
   # 修复数据卷权限
   docker-compose down
   docker volume rm forum-postgres-data
   docker-compose up -d
   ```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api
docker-compose logs -f postgres
docker-compose logs -f redis

# 查看应用日志文件
tail -f logs/app.log
tail -f logs/error.log
```

## 🐳 Docker镜像

### 自动构建

项目使用GitHub Actions自动构建和发布Docker镜像：

- **GitHub Container Registry**: `ghcr.io/1os3/zhihu-clone-backend`
- **触发条件**: 推送到master分支或创建版本标签
- **支持平台**: linux/amd64, linux/arm64

### 手动构建

```bash
# 构建单平台镜像
docker build -t zhihu-clone-backend:latest ./forum-server

# 构建多平台镜像
docker buildx build --platform linux/amd64,linux/arm64 \
  -t zhihu-clone-backend:latest ./forum-server --push
```

## 数据库设计

数据库设计遵循第三范式，主要包含以下表：

- `users` - 用户信息
- `posts` - 帖子
- `comments` - 评论
- `categories` - 分类
- `tags` - 标签
- `likes` - 点赞
- `favorites` - 收藏
- `follows` - 关注

## API文档

详细的API文档请参考 [API.md](./API.md)

包含以下模块：
- 用户管理 API
- 帖子管理 API
- 评论管理 API
- 分类管理 API
- 通知管理 API
- 私信管理 API
- 文件管理 API
- 系统管理 API

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

本项目采用 [MIT](LICENSE) 许可证

## 致谢

- 感谢所有贡献者
- 感谢开源社区提供的优秀工具和库
