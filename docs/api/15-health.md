# 健康检查 API

## 概述

健康检查API提供系统状态监控功能，用于负载均衡器和监控系统检查服务可用性。

## API 端点

### 15.1 系统健康检查
```http
GET /health
```

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345,
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "ok",
      "responseTime": 15
    },
    "redis": {
      "status": "ok",
      "responseTime": 2
    },
    "storage": {
      "status": "ok",
      "freeSpace": "85%"
    }
  },
  "metrics": {
    "memoryUsage": "45%",
    "cpuUsage": "30%",
    "activeConnections": 150
  }
}
```

## 状态说明

### 整体状态
- `ok`: 系统正常运行
- `warning`: 系统运行但有警告
- `error`: 系统异常

### 服务状态
- `database`: 数据库连接状态
- `redis`: 缓存服务状态
- `storage`: 存储服务状态

### 响应时间
- 单位：毫秒
- 超过100ms会标记为警告
- 超过1000ms会标记为错误

## 监控指标

### 系统指标
- `uptime`: 系统运行时间（秒）
- `memoryUsage`: 内存使用率
- `cpuUsage`: CPU使用率
- `activeConnections`: 活跃连接数

### 业务指标
- `totalUsers`: 总用户数
- `activeUsers`: 活跃用户数
- `totalPosts`: 总帖子数
- `requestsPerMinute`: 每分钟请求数

## 使用场景

1. **负载均衡器检查**: 判断实例是否可用
2. **监控告警**: 系统异常时触发告警
3. **自动扩缩容**: 根据负载自动调整实例数量
4. **运维监控**: 实时了解系统状态

## 注意事项

1. 健康检查不需要认证
2. 响应时间应控制在100ms内
3. 检查频率建议不超过每10秒一次
4. 异常状态会返回HTTP 503状态码
5. 包含敏感信息时需要权限控制 