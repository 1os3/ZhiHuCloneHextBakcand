# 敏感词管理 API

## 概述

敏感词管理API提供敏感词库的管理和文本过滤功能，用于内容审核和安全控制。

## API 端点

### 10.1 获取所有敏感词 (管理员/版主)
```http
GET /api/sensitive-words
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `search`: 搜索关键词
- `category`: 敏感词分类
- `level`: 敏感级别 (low|medium|high)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "word": "string",
        "category": "string",
        "level": "medium",
        "replacement": "***",
        "isActive": true,
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

### 10.2 添加敏感词 (管理员/版主)
```http
POST /api/sensitive-words
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "word": "string",
  "category": "string (可选)",
  "level": "low|medium|high (可选，默认medium)",
  "replacement": "string (可选，默认***)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "word": "string",
    "category": "string",
    "level": "medium",
    "replacement": "***",
    "isActive": true,
    "createdAt": "datetime"
  }
}
```

### 10.3 批量添加敏感词 (管理员/版主)
```http
POST /api/sensitive-words/batch
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "words": [
    {
      "word": "string",
      "category": "string (可选)",
      "level": "medium (可选)",
      "replacement": "*** (可选)"
    }
  ]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "added": 10,
    "skipped": 2,
    "errors": [
      {
        "word": "string",
        "error": "已存在"
      }
    ]
  }
}
```

### 10.4 删除敏感词 (管理员/版主)
```http
DELETE /api/sensitive-words
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "word": "string"
}
```

**响应**:
```json
{
  "success": true,
  "message": "敏感词删除成功"
}
```

### 10.5 批量删除敏感词 (管理员/版主)
```http
DELETE /api/sensitive-words/batch
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**请求体**:
```json
{
  "words": ["string1", "string2"]
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "deleted": 8,
    "notFound": 2
  }
}
```

### 10.6 检查文本是否包含敏感词
```http
POST /api/sensitive-words/check
```

**请求体**:
```json
{
  "text": "string",
  "level": "low|medium|high (可选，默认检查所有级别)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "hasSensitiveWords": true,
    "sensitiveWords": [
      {
        "word": "敏感词1",
        "category": "政治",
        "level": "high",
        "position": [10, 13]
      },
      {
        "word": "敏感词2",
        "category": "色情",
        "level": "medium",
        "position": [25, 28]
      }
    ],
    "riskLevel": "high"
  }
}
```

### 10.7 过滤文本中的敏感词
```http
POST /api/sensitive-words/filter
```

**请求体**:
```json
{
  "text": "string",
  "replacement": "string (可选，默认为***)",
  "level": "low|medium|high (可选，默认过滤所有级别)",
  "mode": "replace|mask|remove (可选，默认replace)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "originalText": "原始文本包含敏感词",
    "filteredText": "原始文本包含***",
    "sensitiveWords": [
      {
        "word": "敏感词",
        "category": "违禁",
        "level": "medium",
        "replacement": "***"
      }
    ],
    "filterCount": 1
  }
}
```

## 敏感词分类

### 预定义分类
- `political`: 政治敏感
- `violence`: 暴力血腥
- `pornography`: 色情低俗
- `gambling`: 赌博相关
- `drugs`: 毒品相关
- `fraud`: 诈骗相关
- `spam`: 垃圾信息
- `custom`: 自定义

### 敏感级别
- `low`: 低敏感度 - 轻微不当内容
- `medium`: 中敏感度 - 明显不当内容
- `high`: 高敏感度 - 严重违规内容

## 过滤模式

### replace 模式
- 将敏感词替换为指定字符
- 默认替换为 `***`
- 可自定义替换字符

### mask 模式
- 保留敏感词首尾字符
- 中间字符用 `*` 替换
- 例：`敏感词` → `敏*词`

### remove 模式
- 直接删除敏感词
- 不保留任何痕迹
- 可能影响文本连贯性

## 检测算法

### AC自动机算法
- 高效的多模式字符串匹配
- 支持大规模敏感词库
- 时间复杂度 O(n)

### 模糊匹配
- 支持同音字替换检测
- 支持繁简体转换检测
- 支持特殊符号干扰检测

### 语义分析
- 基于AI的语义理解
- 检测隐晦表达
- 上下文相关判断

## 管理功能

### 词库管理
- 支持分类管理
- 支持批量导入/导出
- 支持正则表达式
- 支持白名单机制

### 统计分析
- 敏感词命中统计
- 用户违规统计
- 内容风险分析
- 趋势报告生成

### 自动更新
- 定期更新词库
- 机器学习优化
- 社区举报集成
- 第三方词库同步

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数无效
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **409 Conflict**: 敏感词已存在
- **422 Unprocessable Entity**: 敏感词格式无效

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "SENSITIVE_WORD_EXISTS",
    "message": "敏感词已存在",
    "details": {
      "word": "违禁词",
      "existingId": "uuid"
    }
  }
}
```

## 注意事项

1. 敏感词检测区分大小写
2. 支持中英文混合检测
3. 检测结果会缓存以提高性能
4. 敏感词库定期自动更新
5. 支持正则表达式模式匹配
6. 白名单词汇不会被过滤
7. 管理员操作会记录审计日志
8. 支持自定义替换规则
9. 可配置不同场景的过滤策略
10. 提供API调用频率限制 