# IP 过滤管理 API

## 概述

IP过滤管理API提供IP访问控制、黑白名单管理、安全防护等功能，用于保护系统安全。

## API 端点

### 11.1 检查IP访问权限
```http
GET /api/ip-filters/check
```

**查询参数**:
- `ip`: IP地址 (可选，默认使用请求IP)

**响应**:
```json
{
  "success": true,
  "data": {
    "ip": "192.168.1.100",
    "allowed": true,
    "reason": "IP在白名单中",
    "matchedRule": {
      "id": "uuid",
      "type": "whitelist",
      "pattern": "192.168.1.*",
      "description": "内网IP白名单"
    },
    "riskLevel": "low"
  }
}
```

### 11.2 获取IP过滤规则列表 (管理员)
```http
GET /api/ip-filters
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `type`: 规则类型 (whitelist|blacklist|rate_limit|geo_block)
- `status`: 规则状态 (active|inactive|expired)
- `pattern`: IP模式搜索

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "blacklist",
        "pattern": "192.168.1.100",
        "description": "恶意IP封禁",
        "action": "block",
        "priority": 100,
        "status": "active",
        "hitCount": 25,
        "lastHit": "datetime",
        "expiresAt": "datetime",
        "createdBy": {
          "id": "uuid",
          "username": "admin"
        },
        "createdAt": "datetime",
        "updatedAt": "datetime"
      },
      {
        "id": "uuid",
        "type": "rate_limit",
        "pattern": "10.0.0.*",
        "description": "内网限流规则",
        "action": "rate_limit",
        "config": {
          "maxRequests": 1000,
          "timeWindow": 3600
        },
        "priority": 50,
        "status": "active",
        "hitCount": 156,
        "lastHit": "datetime",
        "createdAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 11.3 创建IP过滤规则 (管理员)
```http
POST /api/ip-filters
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "type": "blacklist|whitelist|rate_limit|geo_block",
  "pattern": "string (IP地址或模式)",
  "description": "string (规则描述)",
  "action": "block|allow|rate_limit|log_only",
  "priority": 100,
  "config": {
    "maxRequests": 100,
    "timeWindow": 3600,
    "blockDuration": 86400
  },
  "expiresAt": "datetime (可选)",
  "isActive": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "blacklist",
    "pattern": "192.168.1.100",
    "description": "恶意IP封禁",
    "action": "block",
    "priority": 100,
    "config": {},
    "status": "active",
    "hitCount": 0,
    "expiresAt": "datetime",
    "createdBy": {
      "id": "uuid",
      "username": "admin"
    },
    "createdAt": "datetime"
  }
}
```

### 11.4 更新IP过滤规则 (管理员)
```http
PUT /api/ip-filters/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "description": "string (可选)",
  "action": "block|allow|rate_limit|log_only (可选)",
  "priority": 100,
  "config": {
    "maxRequests": 200,
    "timeWindow": 3600
  },
  "expiresAt": "datetime (可选)",
  "isActive": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "rate_limit",
    "pattern": "10.0.0.*",
    "description": "更新后的描述",
    "action": "rate_limit",
    "priority": 100,
    "config": {
      "maxRequests": 200,
      "timeWindow": 3600
    },
    "status": "inactive",
    "updatedAt": "datetime"
  }
}
```

### 11.5 删除IP过滤规则 (管理员)
```http
DELETE /api/ip-filters/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

**响应**:
```json
{
  "success": true,
  "message": "IP过滤规则删除成功"
}
```

### 11.6 清理过期规则 (管理员)
```http
POST /api/ip-filters/cleanup
```
**需要认证**: ✅ **需要权限**: ADMIN

**响应**:
```json
{
  "success": true,
  "data": {
    "cleanedCount": 15,
    "totalRules": 100,
    "cleanupTime": "datetime"
  }
}
```

## 规则类型说明

### whitelist (白名单)
- 允许特定IP访问
- 优先级最高
- 绕过其他限制
- 适用于可信IP

### blacklist (黑名单)
- 禁止特定IP访问
- 直接拒绝请求
- 记录访问尝试
- 适用于恶意IP

### rate_limit (限流)
- 限制访问频率
- 超出限制暂时阻止
- 可配置时间窗口
- 适用于防止滥用

### geo_block (地理封锁)
- 基于地理位置封锁
- 支持国家/地区级别
- 可配置例外规则
- 适用于合规要求

## 动作类型说明

### block (阻止)
- 直接拒绝请求
- 返回403错误
- 记录阻止日志
- 最严格的处理

### allow (允许)
- 无条件允许访问
- 绕过其他规则
- 白名单专用
- 最宽松的处理

### rate_limit (限流)
- 限制访问频率
- 超出后临时阻止
- 可配置恢复时间
- 平衡安全和可用性

### log_only (仅记录)
- 记录访问日志
- 不影响访问
- 用于监控分析
- 观察模式

## IP模式格式

### 单个IP
```
192.168.1.100
2001:db8::1
```

### IP范围
```
192.168.1.1-192.168.1.100
192.168.1.0/24
```

### 通配符模式
```
192.168.1.*
192.168.*.100
*.example.com
```

### CIDR表示法
```
192.168.1.0/24
10.0.0.0/8
2001:db8::/32
```

## 配置参数说明

### 限流配置
```json
{
  "maxRequests": 100,
  "timeWindow": 3600,
  "blockDuration": 86400,
  "burstAllowed": 10
}
```

### 地理封锁配置
```json
{
  "blockedCountries": ["CN", "RU"],
  "allowedCountries": ["US", "CA"],
  "checkProxy": true,
  "trustCloudflare": true
}
```

### 高级配置
```json
{
  "checkUserAgent": true,
  "requireHttps": false,
  "logLevel": "info",
  "alertThreshold": 1000
}
```

## 优先级说明

### 优先级规则
- 数值越大优先级越高
- 白名单优先级最高 (1000+)
- 黑名单次之 (500-999)
- 限流规则较低 (100-499)
- 默认规则最低 (1-99)

### 匹配顺序
1. 检查白名单规则
2. 检查黑名单规则
3. 检查限流规则
4. 检查地理封锁
5. 应用默认策略

## 监控与统计

### 访问统计
- 规则命中次数
- 最后命中时间
- 阻止请求统计
- 地理分布统计

### 实时监控
- 当前活跃IP
- 异常访问检测
- 攻击模式识别
- 自动响应机制

### 报警机制
- 异常流量告警
- 新威胁IP告警
- 规则失效告警
- 系统状态告警

## 安全特性

### 自动防护
- DDoS攻击检测
- 暴力破解防护
- 扫描行为识别
- 异常模式检测

### 威胁情报
- 恶意IP数据库
- 实时威胁更新
- 社区共享情报
- 第三方数据源

### 应急响应
- 快速封禁机制
- 临时规则部署
- 批量处理能力
- 回滚机制

## 错误响应

### 常见错误

- **400 Bad Request**: 规则格式错误
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足或IP被封禁
- **409 Conflict**: 规则冲突
- **422 Unprocessable Entity**: 规则验证失败

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "IP_BLOCKED",
    "message": "您的IP地址已被封禁",
    "details": {
      "ip": "192.168.1.100",
      "rule": "恶意IP封禁",
      "expiresAt": "datetime"
    }
  }
}
```

## 最佳实践

### 规则设计
1. 白名单优先原则
2. 最小权限原则
3. 定期审查规则
4. 测试规则效果

### 性能优化
1. 合理设置优先级
2. 避免过于复杂的模式
3. 定期清理过期规则
4. 使用缓存机制

### 安全建议
1. 监控规则命中情况
2. 设置合理的过期时间
3. 建立应急响应流程
4. 定期更新威胁情报

## 注意事项

1. IP过滤规则立即生效
2. 白名单规则优先级最高
3. 过期规则会自动失效
4. 管理员操作会记录日志
5. 支持IPv4和IPv6地址
6. 可配置代理检测
7. 支持CDN场景下的真实IP获取
8. 规则变更会触发缓存刷新 