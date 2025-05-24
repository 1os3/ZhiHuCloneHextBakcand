# 通知管理 API

## 概述

通知管理API提供系统通知的获取、标记已读、删除等功能，支持多种通知类型。

## API 端点

### 5.1 获取通知列表
```http
GET /api/notifications
```
**需要认证**: ✅

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `type`: 通知类型 (like|comment|follow|system|message)
- `isRead`: 是否已读 (true|false)
- `createdAfter`: 创建时间起始
- `createdBefore`: 创建时间结束

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "like",
        "title": "有人点赞了你的帖子",
        "content": "用户张三点赞了你的帖子《技术分享》",
        "data": {
          "postId": "uuid",
          "postTitle": "技术分享",
          "userId": "uuid",
          "username": "zhangsan"
        },
        "isRead": false,
        "createdAt": "datetime",
        "updatedAt": "datetime"
      },
      {
        "id": "uuid",
        "type": "comment",
        "title": "有人评论了你的帖子",
        "content": "用户李四评论了你的帖子《技术分享》",
        "data": {
          "postId": "uuid",
          "commentId": "uuid",
          "commentContent": "很不错的分享！",
          "userId": "uuid",
          "username": "lisi"
        },
        "isRead": true,
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

### 5.2 获取通知详情
```http
GET /api/notifications/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "follow",
    "title": "有人关注了你",
    "content": "用户王五关注了你",
    "data": {
      "userId": "uuid",
      "username": "wangwu",
      "nickname": "王五",
      "avatar": "avatar-url"
    },
    "isRead": false,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 5.3 标记通知为已读
```http
PUT /api/notifications/:id
```
**需要认证**: ✅

**请求体**:
```json
{
  "isRead": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "isRead": true,
    "updatedAt": "datetime"
  }
}
```

### 5.4 批量标记通知为已读
```http
PUT /api/notifications/batch-update
```
**需要认证**: ✅

**请求体**:
```json
{
  "notificationIds": ["uuid1", "uuid2", "uuid3"],
  "isRead": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "updated": 3,
    "failed": 0
  }
}
```

### 5.5 删除通知
```http
DELETE /api/notifications/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "message": "通知删除成功"
}
```

### 5.6 获取未读通知数量
```http
GET /api/notifications/unread-count
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 15,
    "byType": {
      "like": 5,
      "comment": 8,
      "follow": 2,
      "system": 0,
      "message": 0
    }
  }
}
```

## 通知类型说明

### like (点赞通知)
- 帖子被点赞
- 评论被点赞
- 数据包含：帖子/评论信息、点赞用户信息

### comment (评论通知)
- 帖子被评论
- 评论被回复
- 数据包含：帖子信息、评论内容、评论用户信息

### follow (关注通知)
- 被用户关注
- 数据包含：关注用户信息

### system (系统通知)
- 系统公告
- 账户状态变更
- 安全提醒
- 数据包含：通知详细信息

### message (私信通知)
- 收到新私信
- 数据包含：发送者信息、消息预览

## 通知数据结构

### 通知数据字段
```typescript
interface NotificationData {
  // 帖子相关
  postId?: string;
  postTitle?: string;
  
  // 评论相关
  commentId?: string;
  commentContent?: string;
  
  // 用户相关
  userId?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  
  // 私信相关
  messageId?: string;
  messagePreview?: string;
  
  // 系统通知相关
  actionUrl?: string;
  actionText?: string;
}
```

## 通知触发机制

### 自动触发
- 用户互动行为（点赞、评论、关注）
- 系统事件（账户变更、安全提醒）
- 定时任务（系统公告推送）

### 通知规则
- 不会给自己发送通知
- 重复操作不会重复通知
- 支持通知频率限制
- 支持用户通知偏好设置

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数无效
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **404 Not Found**: 通知不存在

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "NOTIFICATION_NOT_FOUND",
    "message": "通知不存在",
    "details": {
      "notificationId": "uuid"
    }
  }
}
```

## 注意事项

1. 通知只能被接收者查看和操作
2. 删除的通知无法恢复
3. 通知有效期为30天，过期自动清理
4. 批量操作最多支持100个通知
5. 通知内容会进行敏感词过滤
6. 支持实时推送（WebSocket）
7. 通知偏好设置影响通知生成
8. 系统通知优先级最高，无法关闭 