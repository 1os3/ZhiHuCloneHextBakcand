# 文件管理 API

## 概述

文件管理API提供文件上传、下载、管理等功能，支持图片、文档、视频等多种文件类型。

## API 端点

### 8.1 上传文件
```http
POST /api/files
```
**需要认证**: ✅
**Content-Type**: `multipart/form-data`

**请求体**:
```
file: File (文件，必需)
description: string (文件描述，可选)
```

**支持的文件类型**:
- 图片: jpg, jpeg, png, gif, webp (最大5MB)
- 文档: pdf, doc, docx, txt, md (最大10MB)
- 视频: mp4, avi, mov (最大50MB)
- 音频: mp3, wav, aac (最大20MB)

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "string",
    "originalName": "string",
    "mimeType": "string",
    "size": 1024000,
    "url": "string",
    "thumbnailUrl": "string",
    "description": "string",
    "uploaderId": "uuid",
    "status": "active",
    "createdAt": "datetime"
  }
}
```

### 8.2 获取文件详情
```http
GET /api/files/:id
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "string",
    "originalName": "string",
    "mimeType": "string",
    "size": 1024000,
    "url": "string",
    "thumbnailUrl": "string",
    "description": "string",
    "uploader": {
      "id": "uuid",
      "username": "string",
      "nickname": "string"
    },
    "status": "active",
    "downloadCount": 100,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```

### 8.3 获取文件列表 (管理员/版主)
```http
GET /api/files
```
**需要认证**: ✅ **需要权限**: ADMIN/MODERATOR

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `type`: 文件类型 (image|document|video|audio)
- `uploaderId`: 上传者ID
- `status`: 文件状态 (active|inactive|deleted)
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
        "filename": "string",
        "originalName": "string",
        "mimeType": "string",
        "size": 1024000,
        "url": "string",
        "uploader": {
          "id": "uuid",
          "username": "string"
        },
        "status": "active",
        "downloadCount": 100,
        "createdAt": "datetime"
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

### 8.4 获取用户上传的文件列表
```http
GET /api/files/user/:userId
```

**查询参数**:
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认10)
- `type`: 文件类型

**响应**: 与获取文件列表相同

### 8.5 更新文件信息
```http
PUT /api/files/:id
```
**需要认证**: ✅

**请求体**:
```json
{
  "description": "string (可选)"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "description": "string",
    "updatedAt": "datetime"
  }
}
```

### 8.6 删除文件
```http
DELETE /api/files/:id
```
**需要认证**: ✅

**响应**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## 文件处理说明

### 图片处理
- 自动生成缩略图（150x150）
- 支持图片压缩和格式转换
- 自动提取EXIF信息
- 支持水印添加（可配置）

### 文档处理
- PDF文件生成预览图
- 文本文件自动编码检测
- 支持文档内容索引（搜索）

### 视频处理
- 自动生成视频缩略图
- 提取视频元信息（时长、分辨率等）
- 支持视频转码（可配置）

### 音频处理
- 提取音频元信息
- 生成音频波形图
- 支持音频格式转换

## 存储说明

### 存储策略
- 本地存储：开发环境
- 云存储：生产环境（支持阿里云OSS、腾讯云COS等）
- CDN加速：静态资源分发

### 文件命名
- 使用UUID作为文件名
- 保留原始文件扩展名
- 按日期分目录存储

### 安全措施
- 文件类型白名单验证
- 文件内容安全扫描
- 病毒检测（可配置）
- 访问权限控制

## 权限说明

### 上传权限
- 所有认证用户都可以上传文件
- 不同用户角色有不同的上传限制

### 访问权限
- 公开文件：所有人可访问
- 私有文件：仅上传者和管理员可访问
- 受保护文件：需要特定权限

### 管理权限
- 用户只能管理自己上传的文件
- 管理员可以管理所有文件
- 版主可以管理指定分类的文件

## 限制说明

### 文件大小限制
- 图片文件：最大5MB
- 文档文件：最大10MB
- 视频文件：最大50MB
- 音频文件：最大20MB

### 上传频率限制
- 普通用户：每分钟最多10个文件
- VIP用户：每分钟最多50个文件
- 管理员：无限制

### 存储空间限制
- 普通用户：总共1GB
- VIP用户：总共10GB
- 管理员：无限制

## 错误响应

### 常见错误

- **400 Bad Request**: 文件格式不支持或文件过大
- **401 Unauthorized**: 未认证
- **403 Forbidden**: 权限不足或超出限制
- **404 Not Found**: 文件不存在
- **413 Payload Too Large**: 文件过大
- **415 Unsupported Media Type**: 不支持的文件类型

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "文件大小超出限制",
    "details": {
      "maxSize": "5MB",
      "actualSize": "8MB"
    }
  }
}
```

## 注意事项

1. 上传的文件会自动进行安全扫描
2. 图片文件会自动生成多种尺寸的缩略图
3. 文件删除采用软删除，可以恢复
4. 支持断点续传（大文件）
5. 文件访问会记录下载统计
6. 定期清理未使用的文件
7. 支持文件批量操作
8. 文件上传支持进度回调 