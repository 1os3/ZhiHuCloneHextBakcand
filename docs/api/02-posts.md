# 帖子管理 API

## 概述

帖子管理API提供帖子的创建、编辑、搜索、点赞、收藏等功能。

## API 端点

### 2.1 获取帖子列表
```http
GET /api/posts
```

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `categoryId`: 分类ID
- `authorId`: 作者ID
- `status`: 帖子状态 (draft|published|archived)
- `isPinned`: 是否置顶 (true|false)
- `isFeatured`: 是否精选 (true|false)
- `sortBy`: 排序方式 (newest|oldest|most_viewed|most_liked|most_commented)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "summary": "string",
        "coverImage": "string",
        "author": {
          "id": "uuid",
          "username": "string",
          "nickname": "string",
          "avatar": "string"
        },
        "category": {
          "id": "uuid",
          "name": "string"
        },
        "tags": [
          {
            "id": "uuid",
            "name": "string"
          }
        ],
        "status": "published",
        "isPinned": false,
        "isFeatured": false,
        "viewCount": 100,
        "likeCount": 50,
        "commentCount": 20,
        "createdAt": "datetime",
        "updatedAt": "datetime"
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

### 2.2 获取帖子详情
```http
GET /api/posts/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "summary": "string",
    "coverImage": "string",
    "author": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string",
      "bio": "string"
    },
    "category": {
      "id": "uuid",
      "name": "string",
      "description": "string"
    },
    "tags": [
      {
        "id": "uuid",
        "name": "string"
      }
    ],
    "attachments": ["url"],
    "status": "published",
    "isPinned": false,
    "isFeatured": false,
    "viewCount": 100,
    "likeCount": 50,
    "commentCount": 20,
    "isLiked": false,
    "isFavorited": false,
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "publishedAt": "datetime"
  }
}
```

### 2.3 搜索帖子
```http
POST /api/posts/search
```

**请求体**:
```json
{
  "search": "string (搜索关键词)",
  "searchType": "all|title|content|tag|author",
  "categoryId": "uuid (可选)",
  "authorId": "uuid (可选)",
  "tagIds": ["uuid"] (可选),
  "status": "draft|published|archived",
  "sortBy": "newest|oldest|most_viewed|most_liked|most_commented",
  "hasAttachments": "boolean (可选)",
  "hasCoverImage": "boolean (可选)",
  "publishedAfter": "datetime (可选)",
  "publishedBefore": "datetime (可选)",
  "page": 1,
  "limit": 10
}
```

**响应**: 与获取帖子列表相同

### 2.4 创建帖子
```http
POST /api/posts
```
**需要认证**: ✅

**请求体**:
```json
{
  "title": "string (5-100字符)",
  "content": "string (最少10字符)",
  "summary": "string (可选，最多200字符)",
  "categoryId": "uuid",
  "tagIds": ["uuid"] (可选，最多10个),
  "attachments": ["url"] (可选，最多5个),
  "coverImage": "url (可选)",
  "status": "draft|published|archived"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "string",
    "content": "string",
    "summary": "string",
    "coverImage": "string",
    "categoryId": "uuid",
    "tagIds": ["uuid"],
    "attachments": ["url"],
    "status": "published",
    "authorId": "uuid",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 2.5 更新帖子
```http
PUT /api/posts/:id
```
**需要认证**: ✅

**请求体**: 与创建帖子相同，所有字段都是可选的

**响应**: 与创建帖子相同

### 2.6 删除帖子
```http
DELETE /api/posts/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "message": "帖子删除成功"
}
```

### 2.7 点赞帖子
```http
POST /api/posts/:id/like
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
    "likeCount": 51
  }
}
```

### 2.8 收藏帖子
```http
POST /api/posts/:id/favorite
```
**需要认证**: ✅

**请求体**:
```json
{
  "favorite": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "isFavorited": true,
    "favoriteCount": 25
  }
}
```

## 管理员功能

### 2.9 置顶帖子 (管理员/版主)
```http
PUT /api/posts/:id/pin
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "isPinned": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isPinned": true,
    "updatedAt": "datetime"
  }
}
```

### 2.10 精选帖子 (管理员/版主)
```http
PUT /api/posts/:id/featured
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "isFeatured": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isFeatured": true,
    "updatedAt": "datetime"
  }
}
```

## 帖子状态说明

- `draft`: 草稿 - 仅作者可见
- `published`: 已发布 - 公开可见
- `archived`: 已归档 - 仅作者和管理员可见

## 排序方式说明

- `newest`: 按创建时间降序
- `oldest`: 按创建时间升序
- `most_viewed`: 按浏览量降序
- `most_liked`: 按点赞数降序
- `most_commented`: 按评论数降序

## 搜索类型说明

- `all`: 全文搜索（标题+内容）
- `title`: 仅搜索标题
- `content`: 仅搜索内容
- `tag`: 搜索标签
- `author`: 搜索作者

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数验证失败
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足（如编辑他人帖子）
- **404 Not Found**: 帖子不存在
- **409 Conflict**: 资源冲突

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "标题长度不能少于5个字符",
    "details": {
      "field": "title",
      "value": "abc"
    }
  }
}
```

## 注意事项

1. 标题长度限制：5-100字符
2. 内容最少10字符
3. 摘要最多200字符
4. 最多可添加10个标签
5. 最多可添加5个附件
6. 只有作者和管理员可以编辑/删除帖子
7. 草稿状态的帖子仅作者可见
8. 所有内容都会进行敏感词过滤
9. 帖子浏览会自动增加浏览计数 