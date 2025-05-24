# 知乎克隆项目 API 文档

## 基本信息

- **基础URL**: `http://localhost:3000`
- **API版本**: v1
- **API前缀**: `/api`
- **认证方式**: JWT Bearer Token
- **内容类型**: `application/json`

## 认证说明

### JWT Token
大部分API需要在请求头中包含JWT token：
```
Authorization: Bearer <your-jwt-token>
```

### CSRF保护
所有POST、PUT、DELETE请求需要包含CSRF token：
```
X-CSRF-Token: <csrf-token>
```

获取CSRF token：
```http
GET /api/csrf/token
```

## 用户角色

- `USER`: 普通用户
- `MODERATOR`: 版主
- `ADMIN`: 管理员

## 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息",
    "details": {}
  }
}
```

## API 文档目录

### 核心功能
1. [用户管理 API](./docs/api/01-users.md) - 注册、登录、资料管理
2. [帖子管理 API](./docs/api/02-posts.md) - 创建、编辑、搜索、点赞
3. [评论管理 API](./docs/api/03-comments.md) - 回复、点赞、嵌套评论
4. [分类管理 API](./docs/api/04-categories.md) - 分类层级、管理功能

### 交互功能
5. [通知管理 API](./docs/api/05-notifications.md) - 消息通知、已读状态
6. [私信管理 API](./docs/api/06-messages.md) - 用户间私信、会话管理
7. [举报管理 API](./docs/api/07-reports.md) - 内容举报、管理员处理

### 文件与内容
8. [文件管理 API](./docs/api/08-files.md) - 上传、管理、清理
9. [Markdown 处理 API](./docs/api/09-markdown.md) - 内容解析、摘要提取
10. [敏感词管理 API](./docs/api/10-sensitive-words.md) - 内容审核、词库管理

### 系统管理
11. [IP 过滤管理 API](./docs/api/11-ip-filters.md) - 访问控制、安全管理
12. [日志管理 API](./docs/api/12-logs.md) - 操作记录、访问统计
13. [文件管理 API (管理员)](./docs/api/13-admin-files.md) - 管理员文件操作

### 系统功能
14. [CSRF 令牌 API](./docs/api/14-csrf.md) - 安全令牌
15. [健康检查 API](./docs/api/15-health.md) - 系统状态监控

## 通用规范

### 错误代码说明

| 错误代码 | HTTP状态码 | 说明 |
|---------|-----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未认证或token无效 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 429 | 请求频率超限 |
| INTERNAL_SERVER_ERROR | 500 | 服务器内部错误 |

### 分页参数

大部分列表API支持分页参数：
- `page`: 页码，从1开始 (默认: 1)
- `limit`: 每页数量 (默认: 10, 最大: 100)

分页响应格式：
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 排序参数

支持排序的API通常接受以下参数：
- `sortBy`: 排序字段
- `sortOrder`: 排序方向 (`asc` 或 `desc`)

### 搜索参数

支持搜索的API通常接受：
- `search`: 搜索关键词
- `searchFields`: 搜索字段 (可选)

## 注意事项

1. 所有时间字段使用ISO 8601格式
2. UUID字段必须是有效的UUID v4格式
3. 文件上传大小限制为10MB
4. API请求频率限制：每分钟100次请求
5. 敏感操作需要额外的权限验证
6. 所有用户输入都会进行敏感词过滤
7. 管理员操作会记录到操作日志中 