# 举报管理 API

## 概述

举报管理API提供内容举报、管理员处理举报等功能，用于维护社区秩序和内容质量。

## API 端点

### 7.1 创建举报
```http
POST /api/reports
```
**需要认证**: ✅

**请求体**:
```json
{
  "targetType": "post|comment|user",
  "targetId": "uuid",
  "reason": "spam|inappropriate|harassment|copyright|other",
  "description": "string (可选，最多500字符)",
  "evidence": ["url"] (可选，证据文件URL)
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "targetType": "post",
    "targetId": "uuid",
    "reason": "inappropriate",
    "description": "该帖子包含不当内容",
    "evidence": ["evidence-url"],
    "reporter": {
      "id": "uuid",
      "username": "string"
    },
    "status": "pending",
    "createdAt": "datetime"
  }
}
```

### 7.2 获取举报列表 (管理员/版主)
```http
GET /api/reports
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `status`: 举报状态 (pending|investigating|resolved|rejected)
- `targetType`: 举报目标类型 (post|comment|user)
- `reason`: 举报原因
- `reporterId`: 举报人ID
- `handlerId`: 处理人ID
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
        "targetType": "post",
        "targetId": "uuid",
        "target": {
          "id": "uuid",
          "title": "被举报的帖子标题",
          "author": {
            "username": "author123"
          }
        },
        "reason": "inappropriate",
        "description": "该帖子包含不当内容",
        "evidence": ["evidence-url"],
        "reporter": {
          "id": "uuid",
          "username": "reporter123",
          "nickname": "举报者"
        },
        "handler": {
          "id": "uuid",
          "username": "admin123",
          "nickname": "管理员"
        },
        "status": "investigating",
        "priority": "medium",
        "createdAt": "datetime",
        "updatedAt": "datetime",
        "handledAt": "datetime"
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

### 7.3 获取举报详情 (管理员/版主)
```http
GET /api/reports/:id
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "targetType": "comment",
    "targetId": "uuid",
    "target": {
      "id": "uuid",
      "content": "被举报的评论内容",
      "author": {
        "id": "uuid",
        "username": "commenter123",
        "nickname": "评论者"
      },
      "post": {
        "id": "uuid",
        "title": "相关帖子标题"
      }
    },
    "reason": "harassment",
    "description": "该评论涉嫌骚扰其他用户",
    "evidence": ["screenshot1.jpg", "screenshot2.jpg"],
    "reporter": {
      "id": "uuid",
      "username": "reporter123",
      "nickname": "举报者",
      "email": "reporter@example.com"
    },
    "handler": {
      "id": "uuid",
      "username": "moderator123",
      "nickname": "版主"
    },
    "status": "resolved",
    "priority": "high",
    "resolution": "内容已删除，用户已警告",
    "actionTaken": "delete_content",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "handledAt": "datetime"
  }
}
```

### 7.4 处理举报 (管理员/版主)
```http
PUT /api/reports/:id/resolve
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "status": "resolved|rejected",
  "resolution": "string (处理结果说明)",
  "actionTaken": "no_action|warning|delete_content|suspend_user|ban_user",
  "notes": "string (可选，内部备注)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "resolved",
    "resolution": "内容已删除，用户已收到警告",
    "actionTaken": "delete_content",
    "handler": {
      "id": "uuid",
      "username": "admin123"
    },
    "handledAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 7.5 获取待处理举报数量 (管理员/版主)
```http
GET /api/reports/pending-count
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**响应**:
```json
{
  "success": true,
  "data": {
    "pendingCount": 15,
    "byPriority": {
      "high": 3,
      "medium": 8,
      "low": 4
    },
    "byType": {
      "post": 8,
      "comment": 5,
      "user": 2
    },
    "byReason": {
      "spam": 6,
      "inappropriate": 4,
      "harassment": 3,
      "copyright": 1,
      "other": 1
    }
  }
}
```

## 举报原因说明

### spam (垃圾信息)
- 广告推广
- 重复发布
- 无意义内容
- 恶意刷屏

### inappropriate (不当内容)
- 色情低俗
- 暴力血腥
- 政治敏感
- 违法违规

### harassment (骚扰行为)
- 人身攻击
- 恶意诽谤
- 跟踪骚扰
- 威胁恐吓

### copyright (版权侵犯)
- 未授权转载
- 盗用他人作品
- 商标侵权
- 专利侵权

### other (其他)
- 不符合以上分类的其他问题
- 需要在描述中详细说明

## 举报状态说明

### pending (待处理)
- 举报已提交
- 等待管理员处理
- 系统自动分配优先级

### investigating (调查中)
- 管理员已接手处理
- 正在调查核实
- 可能需要更多证据

### resolved (已解决)
- 举报已处理完成
- 采取了相应措施
- 记录处理结果

### rejected (已驳回)
- 举报不成立
- 内容符合规范
- 记录驳回原因

## 处理措施说明

### no_action (无需处理)
- 举报不成立
- 内容符合规范
- 无需采取措施

### warning (警告)
- 向用户发送警告
- 记录违规行为
- 不影响账户状态

### delete_content (删除内容)
- 删除违规内容
- 保留删除记录
- 通知相关用户

### suspend_user (暂停用户)
- 临时禁用账户
- 设置暂停期限
- 可申请恢复

### ban_user (封禁用户)
- 永久禁用账户
- 无法恢复使用
- 严重违规处理

## 优先级说明

### high (高优先级)
- 严重违规内容
- 涉及法律问题
- 影响用户安全
- 需要紧急处理

### medium (中优先级)
- 一般违规内容
- 影响用户体验
- 常规处理流程

### low (低优先级)
- 轻微违规内容
- 边界模糊问题
- 可延后处理

## 举报流程

### 用户举报
1. 发现违规内容
2. 选择举报原因
3. 填写详细描述
4. 提供相关证据
5. 提交举报申请

### 管理员处理
1. 接收举报通知
2. 查看举报详情
3. 调查核实内容
4. 决定处理措施
5. 记录处理结果
6. 通知相关用户

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数无效
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **404 Not Found**: 举报不存在
- **409 Conflict**: 重复举报

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_REPORT",
    "message": "你已经举报过该内容",
    "details": {
      "targetId": "uuid",
      "existingReportId": "uuid"
    }
  }
}
```

## 注意事项

1. 每个用户对同一内容只能举报一次
2. 恶意举报会被记录并可能受到处罚
3. 举报处理结果会通知举报人
4. 被举报用户有申诉权利
5. 管理员操作会记录到审计日志
6. 举报数据会用于改进内容审核算法
7. 严重违规会同步到其他平台
8. 支持匿名举报（特殊情况） 