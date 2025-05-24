# 私信管理 API

## 概述

私信管理API提供用户间私信发送、接收、管理等功能，支持会话管理和批量操作。

## API 端点

### 6.1 发送私信
```http
POST /api/messages
```
**需要认证**: ✅

**请求体**:
```json
{
  "receiverId": "uuid",
  "content": "string (1-1000字符)",
  "type": "text|image|file (可选，默认text)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "string",
    "type": "text",
    "sender": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    },
    "receiver": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    },
    "status": "sent",
    "isRead": false,
    "createdAt": "datetime"
  }
}
```

### 6.2 获取私信详情
```http
GET /api/messages/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "string",
    "type": "text",
    "sender": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    },
    "receiver": {
      "id": "uuid",
      "username": "string",
      "nickname": "string",
      "avatar": "string"
    },
    "status": "delivered",
    "isRead": true,
    "readAt": "datetime",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 6.3 获取私信列表
```http
GET /api/messages
```
**需要认证**: ✅

**查询参数**:
- `conversationWith`: 对话用户ID
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认20)
- `status`: 消息状态 (sent|delivered|read)
- `type`: 消息类型 (text|image|file)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "content": "你好，很高兴认识你！",
        "type": "text",
        "sender": {
          "id": "uuid",
          "username": "zhangsan",
          "nickname": "张三",
          "avatar": "avatar-url"
        },
        "receiver": {
          "id": "uuid",
          "username": "lisi",
          "nickname": "李四",
          "avatar": "avatar-url"
        },
        "status": "read",
        "isRead": true,
        "readAt": "datetime",
        "createdAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6.4 获取会话列表
```http
GET /api/messages/conversations
```
**需要认证**: ✅

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "user": {
          "id": "uuid",
          "username": "zhangsan",
          "nickname": "张三",
          "avatar": "avatar-url",
          "isOnline": true
        },
        "lastMessage": {
          "id": "uuid",
          "content": "好的，明天见！",
          "type": "text",
          "senderId": "uuid",
          "createdAt": "datetime"
        },
        "unreadCount": 3,
        "totalMessages": 25,
        "updatedAt": "datetime"
      },
      {
        "user": {
          "id": "uuid",
          "username": "lisi",
          "nickname": "李四",
          "avatar": "avatar-url",
          "isOnline": false
        },
        "lastMessage": {
          "id": "uuid",
          "content": "谢谢你的帮助",
          "type": "text",
          "senderId": "uuid",
          "createdAt": "datetime"
        },
        "unreadCount": 0,
        "totalMessages": 12,
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6.5 更新私信状态
```http
PUT /api/messages/:id
```
**需要认证**: ✅

**请求体**:
```json
{
  "status": "read|archived|deleted"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "read",
    "readAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 6.6 批量更新私信状态
```http
PUT /api/messages/batch-update
```
**需要认证**: ✅

**请求体**:
```json
{
  "messageIds": ["uuid1", "uuid2", "uuid3"],
  "status": "read|archived|deleted"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "updated": 3,
    "failed": 0,
    "errors": []
  }
}
```

### 6.7 删除私信
```http
DELETE /api/messages/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "message": "私信删除成功"
}
```

### 6.8 批量删除私信
```http
DELETE /api/messages
```
**需要认证**: ✅

**请求体**:
```json
{
  "messageIds": ["uuid1", "uuid2", "uuid3"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "deleted": 3,
    "failed": 0
  }
}
```

### 6.9 获取未读私信数量
```http
GET /api/messages/unread-count
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "data": {
    "unreadCount": 8,
    "conversationCounts": [
      {
        "userId": "uuid",
        "username": "zhangsan",
        "unreadCount": 5
      },
      {
        "userId": "uuid",
        "username": "lisi",
        "unreadCount": 3
      }
    ]
  }
}
```

## 消息类型说明

### text (文本消息)
- 普通文本内容
- 支持Emoji表情
- 最大长度1000字符

### image (图片消息)
- 图片文件消息
- 支持jpg、png、gif格式
- 最大文件大小5MB

### file (文件消息)
- 文档文件消息
- 支持常见文档格式
- 最大文件大小10MB

## 消息状态说明

### sent (已发送)
- 消息已发送到服务器
- 等待对方接收

### delivered (已送达)
- 消息已送达对方设备
- 对方尚未查看

### read (已读)
- 对方已查看消息
- 包含读取时间

### archived (已归档)
- 消息已归档
- 不在主列表显示

### deleted (已删除)
- 消息已删除
- 软删除，可恢复

## 会话管理

### 会话创建
- 发送第一条消息时自动创建会话
- 会话按最后消息时间排序
- 支持会话置顶功能

### 会话状态
- 显示对方在线状态
- 显示未读消息数量
- 显示最后一条消息预览

### 会话操作
- 标记会话为已读
- 删除整个会话
- 屏蔽特定用户

## 隐私与安全

### 消息加密
- 传输过程使用HTTPS加密
- 敏感内容进行额外加密
- 支持端到端加密（可选）

### 隐私控制
- 可设置接收私信的权限
- 支持屏蔽特定用户
- 可举报不当私信

### 内容审核
- 自动过滤敏感词
- 检测垃圾信息
- 支持用户举报机制

## 实时功能

### WebSocket支持
- 实时消息推送
- 在线状态同步
- 消息状态更新

### 推送通知
- 新消息桌面通知
- 移动端推送通知
- 邮件通知（可选）

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数无效
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足或被屏蔽
- **404 Not Found**: 消息不存在
- **429 Too Many Requests**: 发送频率过快

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "USER_BLOCKED",
    "message": "该用户已屏蔽你，无法发送私信",
    "details": {
      "receiverId": "uuid"
    }
  }
}
```

## 限制说明

### 发送限制
- 每分钟最多发送20条私信
- 每天最多发送200条私信
- 新用户有额外限制

### 内容限制
- 文本消息最大1000字符
- 图片文件最大5MB
- 文档文件最大10MB

### 存储限制
- 私信保存期限为1年
- 超期消息自动删除
- VIP用户无存储限制

## 注意事项

1. 私信内容会进行敏感词过滤
2. 删除的私信采用软删除机制
3. 支持消息撤回（发送后5分钟内）
4. 屏蔽用户后无法收发私信
5. 系统会自动检测垃圾私信
6. 支持消息搜索功能
7. 可导出私信记录
8. 管理员可查看举报的私信内容 