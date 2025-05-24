# CSRF 令牌 API

## 概述

CSRF令牌API提供跨站请求伪造保护功能，确保API调用的安全性。

## API 端点

### 14.1 获取CSRF令牌
```http
GET /api/csrf/token
```

**响应**:
```json
{
  "success": true,
  "data": {
    "csrfToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

## 使用说明

### 令牌获取
- 在进行任何POST、PUT、DELETE请求前，需要先获取CSRF令牌
- 令牌有效期为1小时
- 建议在应用启动时获取并缓存

### 令牌使用
- 在请求头中添加：`X-CSRF-Token: <token>`
- 或在请求体中添加：`_csrf: <token>`
- 令牌验证失败会返回403错误

### 自动刷新
- 令牌过期前会在响应头中返回新令牌
- 前端应监听`X-New-CSRF-Token`响应头
- 自动更新本地缓存的令牌

## 安全特性

1. 令牌与用户会话绑定
2. 令牌具有时效性
3. 令牌包含随机性
4. 支持令牌轮换
5. 防止重放攻击

## 注意事项

1. GET请求不需要CSRF令牌
2. 令牌区分大小写
3. 令牌不能在URL中传递
4. 建议使用HTTPS传输
5. 令牌泄露时应立即刷新 