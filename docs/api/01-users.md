# 用户管理 API

## 概述

用户管理API提供用户注册、登录、资料管理等功能。

## API 端点

### 1.1 用户注册
```http
POST /api/users/register
```

**请求体**:
```json
{
  "username": "string (3-20字符，字母数字下划线连字符)",
  "email": "string (有效邮箱)",
  "password": "string (8-100字符，包含大小写字母和数字)",
  "nickname": "string (可选，最多50字符)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "nickname": "string",
      "role": "user",
      "status": "active",
      "emailVerified": false,
      "createdAt": "datetime"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### 1.2 用户登录
```http
POST /api/users/login
```

**请求体**:
```json
{
  "usernameOrEmail": "string",
  "password": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "nickname": "string",
      "role": "user",
      "status": "active",
      "lastLoginAt": "datetime"
    },
    "token": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### 1.3 刷新Token
```http
POST /api/users/refresh-token
```

**请求体**:
```json
{
  "refreshToken": "string"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "token": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### 1.4 获取当前用户信息
```http
GET /api/users/me
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "nickname": "string",
    "avatar": "string",
    "bio": "string",
    "role": "user",
    "status": "active",
    "emailVerified": true,
    "phoneVerified": false,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 1.5 更新用户资料
```http
PUT /api/users/profile
```
**需要认证**: ✅

**请求体**:
```json
{
  "nickname": "string (可选)",
  "avatar": "string (可选)",
  "bio": "string (可选，最多500字符)",
  "phone": "string (可选，手机号格式)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "nickname": "string",
    "avatar": "string",
    "bio": "string",
    "phone": "string",
    "updatedAt": "datetime"
  }
}
```

### 1.6 修改密码
```http
PUT /api/users/change-password
```
**需要认证**: ✅

**请求体**:
```json
{
  "currentPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码修改成功"
}
```

### 1.7 忘记密码
```http
POST /api/users/forgot-password
```

**请求体**:
```json
{
  "email": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "重置密码邮件已发送"
}
```

### 1.8 重置密码
```http
POST /api/users/reset-password
```

**请求体**:
```json
{
  "token": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "密码重置成功"
}
```

### 1.9 邮箱验证
```http
GET /api/users/verify-email/:token
```

**响应**:
```json
{
  "success": true,
  "message": "邮箱验证成功"
}
```

## 管理员功能

### 1.10 获取用户列表 (管理员)
```http
GET /api/users
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `search`: 搜索关键词
- `role`: 用户角色 (user|moderator|admin)
- `status`: 用户状态 (active|inactive|banned)
- `emailVerified`: 邮箱验证状态 (true|false)
- `createdAfter`: 创建时间起始 (ISO 8601)
- `createdBefore`: 创建时间结束 (ISO 8601)
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "username": "string",
        "email": "string",
        "nickname": "string",
        "role": "user",
        "status": "active",
        "emailVerified": true,
        "createdAt": "datetime",
        "lastLoginAt": "datetime"
      }
    ],
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

### 1.11 获取用户详情 (管理员)
```http
GET /api/users/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "nickname": "string",
    "avatar": "string",
    "bio": "string",
    "role": "user",
    "status": "active",
    "emailVerified": true,
    "phoneVerified": false,
    "phone": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "lastLoginAt": "datetime"
  }
}
```

### 1.12 管理员更新用户 (管理员)
```http
PUT /api/users/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "username": "string (可选)",
  "email": "string (可选)",
  "nickname": "string (可选)",
  "role": "user|moderator|admin (可选)",
  "status": "active|inactive|banned (可选)",
  "emailVerified": "boolean (可选)",
  "phoneVerified": "boolean (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "nickname": "string",
    "role": "user",
    "status": "active",
    "emailVerified": true,
    "phoneVerified": false,
    "updatedAt": "datetime"
  }
}
```

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数验证失败
- **401 Unauthorized**: 未认证或token无效
- **403 Forbidden**: 权限不足
- **404 Not Found**: 用户不存在
- **409 Conflict**: 用户名或邮箱已存在

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "用户名长度不能少于3个字符",
    "details": {
      "field": "username",
      "value": "ab"
    }
  }
}
```

## 注意事项

1. 密码必须包含至少一个大写字母、一个小写字母和一个数字
2. 用户名只能包含字母、数字、下划线和连字符
3. 邮箱地址必须是有效格式
4. JWT token有效期为24小时
5. Refresh token有效期为30天
6. 管理员操作会记录到操作日志中 