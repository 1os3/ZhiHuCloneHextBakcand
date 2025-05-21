# 知乎风格论坛系统 (ZhiHu Clone)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一个仿知乎风格的现代论坛系统，采用前后端分离架构，支持用户发帖、评论、点赞、收藏等功能。

## 设计目的

本项目旨在构建一个高性能、可扩展的社区论坛系统，具有以下特点：

- **用户友好**：简洁直观的界面，类似知乎的交互体验
- **高性能**：采用现代化的技术栈，确保系统响应迅速
- **可扩展**：微服务架构设计，便于功能扩展
- **安全可靠**：完善的安全机制，保护用户数据和隐私
- **多端适配**：响应式设计，适配PC和移动端

## 技术栈

### 前端
- React + TypeScript
- Redux Toolkit 状态管理
- Ant Design 组件库
- Axios HTTP客户端

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
│     前端应用     │ ◄──► │     API网关     │ ◄──► │     微服务      │
│  (React/Redux)  │     │    (Nginx)     │     │   (Node.js)    │
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

- Node.js 16+
- PostgreSQL 13+
- Redis 6+
- Docker (可选)

### 后端部署

1. 克隆仓库
```bash
git clone https://github.com/1os3/ZhiHuCloneHextBakcand.git
cd ZhiHuClone/forum-server
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
复制 `.env.example` 文件并重命名为 `.env`，然后根据需要进行配置。

4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

### 使用Docker部署

```bash
# 使用Docker Compose启动所有服务
docker-compose up -d

# 停止服务
docker-compose down
```

### 前端部署

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm start
```

4. 构建生产版本
```bash
npm run build
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
