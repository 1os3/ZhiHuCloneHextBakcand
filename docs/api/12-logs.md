# 日志管理 API

## 概述

日志管理API提供系统操作日志、访问日志的查询、统计分析、清理等功能，用于系统监控和审计。

## API 端点

### 12.1 获取操作日志列表 (管理员)
```http
GET /api/logs/activity
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `userId`: 用户ID
- `action`: 操作类型 (create|update|delete|login|logout)
- `resource`: 资源类型 (user|post|comment|category)
- `level`: 日志级别 (info|warn|error)
- `startDate`: 开始时间
- `endDate`: 结束时间
- `ip`: IP地址

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "user": {
          "username": "admin",
          "nickname": "管理员"
        },
        "action": "delete",
        "resource": "post",
        "resourceId": "uuid",
        "description": "删除帖子《技术分享》",
        "details": {
          "postTitle": "技术分享",
          "reason": "违规内容",
          "originalAuthor": "user123"
        },
        "level": "warn",
        "ip": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "datetime"
      },
      {
        "id": "uuid",
        "userId": "uuid",
        "user": {
          "username": "user123",
          "nickname": "普通用户"
        },
        "action": "create",
        "resource": "post",
        "resourceId": "uuid",
        "description": "创建帖子《新手指南》",
        "details": {
          "postTitle": "新手指南",
          "categoryId": "uuid",
          "tags": ["指南", "新手"]
        },
        "level": "info",
        "ip": "192.168.1.101",
        "userAgent": "Mozilla/5.0...",
        "createdAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 500,
      "totalPages": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 12.2 获取访问日志列表 (管理员)
```http
GET /api/logs/access
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `userId`: 用户ID
- `method`: HTTP方法 (GET|POST|PUT|DELETE)
- `path`: 请求路径
- `status`: HTTP状态码
- `minDuration`: 最小响应时间 (毫秒)
- `maxDuration`: 最大响应时间 (毫秒)
- `startDate`: 开始时间
- `endDate`: 结束时间
- `ip`: IP地址

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "uuid",
        "user": {
          "username": "user123",
          "nickname": "普通用户"
        },
        "method": "POST",
        "path": "/api/posts",
        "query": "?category=tech",
        "status": 201,
        "duration": 150,
        "requestSize": 1024,
        "responseSize": 512,
        "ip": "192.168.1.101",
        "userAgent": "Mozilla/5.0...",
        "referer": "https://example.com/create",
        "createdAt": "datetime"
      },
      {
        "id": "uuid",
        "userId": null,
        "user": null,
        "method": "GET",
        "path": "/api/posts",
        "query": "?page=1&limit=10",
        "status": 200,
        "duration": 85,
        "requestSize": 0,
        "responseSize": 2048,
        "ip": "192.168.1.102",
        "userAgent": "Mozilla/5.0...",
        "referer": "https://example.com/",
        "createdAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 10000,
      "totalPages": 1000,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 12.3 获取访问统计数据 (管理员)
```http
GET /api/logs/stats
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `period`: 统计周期 (hour|day|week|month)
- `startDate`: 开始时间
- `endDate`: 结束时间
- `groupBy`: 分组方式 (time|user|ip|path|status)

**响应**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 50000,
      "uniqueUsers": 1200,
      "uniqueIPs": 800,
      "averageResponseTime": 120,
      "errorRate": 0.05,
      "period": "day",
      "startDate": "datetime",
      "endDate": "datetime"
    },
    "timeSeriesData": [
      {
        "time": "2024-01-01T00:00:00Z",
        "requests": 2500,
        "users": 150,
        "errors": 12,
        "avgResponseTime": 115
      },
      {
        "time": "2024-01-01T01:00:00Z",
        "requests": 3200,
        "users": 180,
        "errors": 8,
        "avgResponseTime": 125
      }
    ],
    "topPaths": [
      {
        "path": "/api/posts",
        "requests": 8500,
        "percentage": 17.0
      },
      {
        "path": "/api/users/me",
        "requests": 6200,
        "percentage": 12.4
      }
    ],
    "topUsers": [
      {
        "userId": "uuid",
        "username": "power_user",
        "requests": 1500,
        "percentage": 3.0
      }
    ],
    "statusCodeDistribution": {
      "200": 42000,
      "201": 3000,
      "400": 2000,
      "401": 1500,
      "403": 800,
      "404": 500,
      "500": 200
    },
    "geographicDistribution": [
      {
        "country": "CN",
        "requests": 25000,
        "percentage": 50.0
      },
      {
        "country": "US",
        "requests": 15000,
        "percentage": 30.0
      }
    ]
  }
}
```

### 12.4 清理过期日志 (管理员)
```http
POST /api/logs/cleanup
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "logType": "activity|access|all",
  "retentionDays": 90,
  "batchSize": 1000,
  "dryRun": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "logType": "activity",
    "deletedCount": 15000,
    "retentionDays": 90,
    "cutoffDate": "datetime",
    "duration": 5.2,
    "dryRun": false
  }
}
```

## 操作日志类型

### 用户操作
- `login`: 用户登录
- `logout`: 用户登出
- `register`: 用户注册
- `update_profile`: 更新资料
- `change_password`: 修改密码

### 内容操作
- `create_post`: 创建帖子
- `update_post`: 更新帖子
- `delete_post`: 删除帖子
- `create_comment`: 创建评论
- `delete_comment`: 删除评论

### 管理操作
- `ban_user`: 封禁用户
- `unban_user`: 解封用户
- `delete_user`: 删除用户
- `update_role`: 更新角色
- `create_category`: 创建分类

### 系统操作
- `system_start`: 系统启动
- `system_stop`: 系统停止
- `backup_create`: 创建备份
- `config_update`: 配置更新

## 日志级别说明

### info (信息)
- 正常操作记录
- 用户行为日志
- 系统状态信息
- 最常见的日志级别

### warn (警告)
- 潜在问题提醒
- 异常但可处理的情况
- 性能警告
- 需要关注但不紧急

### error (错误)
- 系统错误记录
- 操作失败日志
- 异常堆栈信息
- 需要立即处理

### debug (调试)
- 详细执行信息
- 开发调试数据
- 仅开发环境记录
- 性能分析数据

## 访问日志字段说明

### 请求信息
- `method`: HTTP请求方法
- `path`: 请求路径
- `query`: 查询参数
- `headers`: 请求头信息
- `body`: 请求体 (敏感信息已脱敏)

### 响应信息
- `status`: HTTP状态码
- `duration`: 响应时间 (毫秒)
- `requestSize`: 请求大小 (字节)
- `responseSize`: 响应大小 (字节)

### 用户信息
- `userId`: 用户ID (已认证用户)
- `ip`: 客户端IP地址
- `userAgent`: 用户代理字符串
- `referer`: 来源页面

## 统计分析功能

### 时间序列分析
- 按小时/天/周/月统计
- 请求量趋势分析
- 用户活跃度分析
- 错误率趋势监控

### 用户行为分析
- 最活跃用户排行
- 用户访问模式
- 功能使用统计
- 用户留存分析

### 性能分析
- 响应时间分布
- 慢查询识别
- 资源使用统计
- 瓶颈点分析

### 安全分析
- 异常访问检测
- 攻击模式识别
- IP风险评估
- 安全事件统计

## 日志存储策略

### 分级存储
- 热数据：最近7天，高速存储
- 温数据：最近30天，普通存储
- 冷数据：30天以上，归档存储
- 历史数据：超过1年，压缩存储

### 数据压缩
- 实时压缩算法
- 批量压缩任务
- 重复数据去除
- 索引优化

### 备份策略
- 每日增量备份
- 每周全量备份
- 异地备份存储
- 备份数据验证

## 隐私保护

### 数据脱敏
- 敏感字段加密
- IP地址部分隐藏
- 用户信息匿名化
- 请求参数过滤

### 访问控制
- 基于角色的访问
- 操作权限验证
- 数据范围限制
- 审计日志记录

### 合规要求
- GDPR合规处理
- 数据保留期限
- 用户数据删除
- 隐私政策遵循

## 监控告警

### 实时监控
- 错误率监控
- 响应时间监控
- 请求量监控
- 系统资源监控

### 告警规则
- 阈值告警
- 趋势告警
- 异常检测告警
- 自定义规则告警

### 通知方式
- 邮件通知
- 短信通知
- 钉钉/企微通知
- Webhook回调

## 错误响应

### 常见错误

- **400 Bad Request**: 查询参数无效
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **422 Unprocessable Entity**: 清理参数无效

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "日期范围无效",
    "details": {
      "startDate": "2024-01-01",
      "endDate": "2023-12-31"
    }
  }
}
```

## 性能优化

### 查询优化
- 索引优化
- 分页查询
- 缓存机制
- 异步处理

### 存储优化
- 分表分库
- 数据压缩
- 冷热分离
- 定期清理

### 网络优化
- 数据压缩传输
- CDN加速
- 批量操作
- 连接池优化

## 注意事项

1. 日志数据量大，查询时注意性能
2. 敏感信息已自动脱敏处理
3. 日志保留期限根据配置自动清理
4. 大量数据导出建议使用异步方式
5. 统计数据可能有轻微延迟
6. 清理操作不可逆，请谨慎操作
7. 支持实时日志流查看
8. 日志查询支持全文搜索 