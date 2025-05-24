# 文件管理 API (管理员)

## 概述

管理员文件管理API提供文件的高级管理功能，包括批量操作、状态管理、清理维护等，仅限管理员使用。

## API 端点

### 13.1 获取所有文件列表 (管理员)
```http
GET /api/admin/files
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `type`: 文件类型 (image|document|video|audio)
- `status`: 文件状态 (active|inactive|deleted|quarantine)
- `uploaderId`: 上传者ID
- `sizeMin`: 最小文件大小 (字节)
- `sizeMax`: 最大文件大小 (字节)
- `createdAfter`: 创建时间起始
- `createdBefore`: 创建时间结束
- `sortBy`: 排序字段 (size|created|downloads|name)
- `sortOrder`: 排序方向 (asc|desc)

**响应**:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "filename": "document_20240101_001.pdf",
        "originalName": "重要文档.pdf",
        "mimeType": "application/pdf",
        "size": 2048576,
        "url": "https://cdn.example.com/files/uuid.pdf",
        "thumbnailUrl": "https://cdn.example.com/thumbs/uuid.jpg",
        "description": "用户上传的重要文档",
        "uploader": {
          "id": "uuid",
          "username": "user123",
          "nickname": "普通用户",
          "email": "user@example.com"
        },
        "status": "active",
        "downloadCount": 25,
        "lastDownload": "datetime",
        "isReferenced": true,
        "referenceCount": 3,
        "references": [
          {
            "type": "post",
            "id": "uuid",
            "title": "技术分享"
          }
        ],
        "metadata": {
          "width": 1920,
          "height": 1080,
          "duration": null,
          "pages": 10
        },
        "createdAt": "datetime",
        "updatedAt": "datetime"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 500,
      "totalPages": 50,
      "hasNext": true,
      "hasPrev": false
    },
    "summary": {
      "totalFiles": 500,
      "totalSize": 1073741824,
      "byType": {
        "image": 300,
        "document": 150,
        "video": 30,
        "audio": 20
      },
      "byStatus": {
        "active": 450,
        "inactive": 30,
        "deleted": 15,
        "quarantine": 5
      }
    }
  }
}
```

### 13.2 获取文件详情 (管理员)
```http
GET /api/admin/files/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "image_20240101_001.jpg",
    "originalName": "风景照片.jpg",
    "mimeType": "image/jpeg",
    "size": 1048576,
    "url": "https://cdn.example.com/files/uuid.jpg",
    "thumbnailUrl": "https://cdn.example.com/thumbs/uuid.jpg",
    "description": "美丽的风景照片",
    "uploader": {
      "id": "uuid",
      "username": "photographer",
      "nickname": "摄影师",
      "email": "photo@example.com",
      "role": "user",
      "status": "active"
    },
    "status": "active",
    "downloadCount": 150,
    "lastDownload": "datetime",
    "isReferenced": true,
    "referenceCount": 5,
    "references": [
      {
        "type": "post",
        "id": "uuid",
        "title": "摄影技巧分享",
        "author": "photographer"
      },
      {
        "type": "comment",
        "id": "uuid",
        "content": "这张照片很棒！",
        "author": "user123"
      }
    ],
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "JPEG",
      "colorSpace": "sRGB",
      "exif": {
        "camera": "Canon EOS R5",
        "lens": "RF 24-70mm f/2.8L IS USM",
        "iso": 100,
        "aperture": "f/8",
        "shutterSpeed": "1/125"
      }
    },
    "scanResults": {
      "virusScan": {
        "status": "clean",
        "scannedAt": "datetime",
        "engine": "ClamAV"
      },
      "contentScan": {
        "status": "safe",
        "scannedAt": "datetime",
        "confidence": 0.95
      }
    },
    "accessLog": [
      {
        "action": "download",
        "userId": "uuid",
        "username": "user123",
        "ip": "192.168.1.100",
        "timestamp": "datetime"
      }
    ],
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 13.3 更新文件状态 (管理员)
```http
PATCH /api/admin/files/:id/status
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "status": "active|inactive|deleted|quarantine",
  "reason": "string (状态变更原因)",
  "notifyUser": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "quarantine",
    "reason": "内容审核中",
    "updatedBy": {
      "id": "uuid",
      "username": "admin"
    },
    "updatedAt": "datetime"
  }
}
```

### 13.4 删除文件 (管理员)
```http
DELETE /api/admin/files/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `force`: 是否强制删除 (true|false，默认false)
- `reason`: 删除原因

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "deleted": true,
    "force": false,
    "reason": "违规内容",
    "affectedReferences": 3,
    "deletedAt": "datetime"
  }
}
```

### 13.5 批量删除文件 (管理员)
```http
POST /api/admin/files/batch-delete
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "fileIds": ["uuid1", "uuid2", "uuid3"],
  "force": false,
  "reason": "批量清理违规文件"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "totalRequested": 3,
    "successCount": 2,
    "failedCount": 1,
    "results": [
      {
        "id": "uuid1",
        "success": true,
        "message": "删除成功"
      },
      {
        "id": "uuid2",
        "success": true,
        "message": "删除成功"
      },
      {
        "id": "uuid3",
        "success": false,
        "error": "文件正在被引用，无法删除"
      }
    ],
    "totalAffectedReferences": 5
  }
}
```

### 13.6 清理过期文件 (管理员)
```http
POST /api/admin/files/cleanup/expired
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "expiredDays": 30,
  "status": "deleted|inactive",
  "dryRun": false,
  "batchSize": 100
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cleanupType": "expired",
    "expiredDays": 30,
    "totalScanned": 1000,
    "eligibleCount": 150,
    "cleanedCount": 150,
    "freedSpace": 1073741824,
    "duration": 5.2,
    "dryRun": false
  }
}
```

### 13.7 清理未使用文件 (管理员)
```http
POST /api/admin/files/cleanup/unused
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "unusedDays": 7,
  "excludeTypes": ["image"],
  "dryRun": false,
  "batchSize": 100
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "cleanupType": "unused",
    "unusedDays": 7,
    "totalScanned": 500,
    "eligibleCount": 80,
    "cleanedCount": 75,
    "skippedCount": 5,
    "freedSpace": 524288000,
    "duration": 3.8,
    "dryRun": false
  }
}
```

### 13.8 获取文件统计 (管理员)
```http
GET /api/admin/files/stats
```
**需要认证**: ✅ **需要权限**: ADMIN

**查询参数**:
- `period`: 统计周期 (day|week|month|year)
- `startDate`: 开始时间
- `endDate`: 结束时间

**响应**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalFiles": 5000,
      "totalSize": 10737418240,
      "totalDownloads": 50000,
      "activeFiles": 4500,
      "inactiveFiles": 300,
      "deletedFiles": 150,
      "quarantineFiles": 50
    },
    "typeDistribution": {
      "image": {
        "count": 3000,
        "size": 6442450944,
        "percentage": 60.0
      },
      "document": {
        "count": 1500,
        "size": 3221225472,
        "percentage": 30.0
      },
      "video": {
        "count": 300,
        "size": 858993459,
        "percentage": 6.0
      },
      "audio": {
        "count": 200,
        "size": 214748365,
        "percentage": 4.0
      }
    },
    "uploadTrends": [
      {
        "date": "2024-01-01",
        "uploads": 150,
        "size": 157286400,
        "downloads": 1200
      },
      {
        "date": "2024-01-02",
        "uploads": 180,
        "size": 188743680,
        "downloads": 1450
      }
    ],
    "topUploaders": [
      {
        "userId": "uuid",
        "username": "power_user",
        "fileCount": 500,
        "totalSize": 1073741824,
        "percentage": 10.0
      }
    ],
    "storageUsage": {
      "used": 10737418240,
      "available": 53687091200,
      "total": 64424509440,
      "usagePercentage": 16.67
    },
    "securityStats": {
      "virusDetected": 5,
      "quarantinedFiles": 50,
      "cleanFiles": 4945,
      "lastScanTime": "datetime"
    }
  }
}
```

## 文件状态说明

### active (活跃)
- 正常可用状态
- 可以被下载和引用
- 默认状态

### inactive (非活跃)
- 暂时禁用状态
- 不可下载但保留文件
- 可以恢复为活跃状态

### deleted (已删除)
- 软删除状态
- 文件标记为删除但未物理删除
- 可以恢复

### quarantine (隔离)
- 安全隔离状态
- 疑似有害或违规内容
- 需要人工审核

## 清理策略

### 过期文件清理
- 基于文件状态和时间
- 清理已删除或非活跃的过期文件
- 可配置过期天数

### 未使用文件清理
- 清理没有被引用的文件
- 基于最后访问时间
- 可排除特定文件类型

### 孤儿文件清理
- 清理数据库中不存在记录的物理文件
- 清理物理文件不存在的数据库记录
- 保持数据一致性

## 安全扫描

### 病毒扫描
- 使用ClamAV等引擎
- 定期扫描所有文件
- 自动隔离可疑文件

### 内容扫描
- AI内容识别
- 检测违规内容
- 自动分类和标记

### 完整性检查
- 文件哈希验证
- 检测文件损坏
- 自动修复或标记

## 监控告警

### 存储监控
- 磁盘空间使用率
- 文件增长趋势
- 异常上传检测

### 安全监控
- 病毒检测告警
- 违规内容告警
- 异常访问模式

### 性能监控
- 文件访问性能
- 下载速度监控
- 服务可用性

## 权限管理

### 操作权限
- 仅管理员可执行
- 操作日志记录
- 敏感操作需要确认

### 数据访问
- 可查看所有用户文件
- 可访问详细元数据
- 可查看引用关系

### 批量操作
- 支持批量状态更新
- 支持批量删除
- 操作结果详细反馈

## 错误响应

### 常见错误

- **400 Bad Request**: 请求参数无效
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足
- **404 Not Found**: 文件不存在
- **409 Conflict**: 文件正在被使用

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "FILE_IN_USE",
    "message": "文件正在被引用，无法删除",
    "details": {
      "fileId": "uuid",
      "referenceCount": 3,
      "references": [
        {
          "type": "post",
          "id": "uuid",
          "title": "技术分享"
        }
      ]
    }
  }
}
```

## 最佳实践

### 文件管理
1. 定期清理过期和未使用文件
2. 监控存储空间使用情况
3. 及时处理隔离文件
4. 保持文件元数据完整

### 安全管理
1. 定期进行安全扫描
2. 及时处理安全告警
3. 监控异常上传行为
4. 建立应急响应流程

### 性能优化
1. 合理设置批量操作大小
2. 在低峰期执行清理任务
3. 使用CDN加速文件访问
4. 定期优化存储结构

## 注意事项

1. 删除操作需要谨慎，建议先使用软删除
2. 批量操作可能耗时较长，建议异步执行
3. 清理操作不可逆，建议先执行dry-run
4. 文件引用关系复杂，删除前需要检查
5. 安全扫描可能影响性能，建议在低峰期执行
6. 管理员操作会记录详细日志
7. 大文件操作需要考虑网络和存储性能
8. 支持文件恢复功能，但有时间限制 