# 评论管理 API

## 概述

评论管理API提供评论的创建、回复、点赞、删除等功能，支持嵌套评论结构。

## API 端点

### 3.1 获取评论详情
```http
GET /api/comments/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "string",
    "author": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    },
    "post": {
      "id": "uuid",
      "title": "string"
    },
    "parentId": "uuid",
    "quotedComment": {
      "id": "uuid",
      "content": "string",
      "author": {
        "username": "string",
        "nickname": "string"
      }
    },
    "likeCount": 10,
    "replyCount": 5,
    "isLiked": false,
    "isDeleted": false,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 3.2 获取评论回复
```http
GET /api/comments/:parentId/replies
```

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `sortBy`: 排序方式 (newest|oldest|most_liked)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "content": "string",
        "author": {
          "id": "uuid",
          "username": "string",
          "nickname": "string",
          "avatar": "string"
        },
        "parentId": "uuid",
        "quotedComment": {
          "id": "uuid",
          "content": "string",
          "author": {
            "username": "string",
            "nickname": "string"
          }
        },
        "likeCount": 5,
        "replyCount": 2,
        "isLiked": false,
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3.3 创建回复
```http
POST /api/comments/:parentId/replies
```
**需要认证**: ✅

**请求体**:
```json
{
  "content": "string (1-1000字符)",
  "postId": "uuid",
  "quotedCommentId": "uuid (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "string",
    "postId": "uuid",
    "parentId": "uuid",
    "quotedCommentId": "uuid",
    "authorId": "uuid",
    "likeCount": 0,
    "replyCount": 0,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 3.4 更新评论
```http
PUT /api/comments/:id
```
**需要认证**: ✅

**请求体**:
```json
{
  "content": "string (1-1000字符)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "string",
    "updatedAt": "datetime"
  }
}
```

### 3.5 删除评论
```http
DELETE /api/comments/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "message": "评论删除成功"
}
```

### 3.6 点赞评论
```http
POST /api/comments/:id/like
```
**需要认证**: ✅

**请求体**:
```json
{
  "like": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likeCount": 11
  }
}
```

## 评论结构说明

### 嵌套评论
- 支持多级嵌套评论结构
- `parentId` 为 null 表示顶级评论
- `parentId` 不为 null 表示回复评论

### 引用评论
- `quotedCommentId` 用于引用特定评论
- 引用的评论内容会在回复中显示
- 可以引用任何层级的评论

## 权限说明

### 编辑权限
- 只有评论作者可以编辑自己的评论
- 管理员和版主可以编辑任何评论

### 删除权限
- 评论作者可以删除自己的评论
- 帖子作者可以删除自己帖子下的评论
- 管理员和版主可以删除任何评论

### 软删除
- 删除的评论不会真正从数据库中移除
- 删除的评论显示为"该评论已被删除"
- 保留评论结构，避免破坏回复链

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数验证失败
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **404 Not Found**: 评论不存在
- **409 Conflict**: 资源冲突

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "评论内容不能为空",
    "details": {
      "field": "content",
      "value": ""
    }
  }
}
```

## 注意事项

1. 评论内容长度限制：1-1000字符
2. 评论内容会进行敏感词过滤
3. 删除评论采用软删除机制
4. 支持Markdown格式（部分语法）
5. 评论点赞不支持取消（设计决策）
6. 引用评论时会自动截取前100字符
7. 评论编辑有时间限制（发布后30分钟内）
8. 频繁评论会触发限流机制 