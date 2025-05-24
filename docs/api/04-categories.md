# 分类管理 API

## 概述

分类管理API提供帖子分类的创建、管理、层级结构等功能。

## API 端点

### 4.1 获取分类列表
```http
GET /api/categories
```

**查询参数**:
- `parentId`: 父分类ID (可选，获取子分类)
- `isActive`: 是否激活 (true|false)
- `includePostCount`: 是否包含帖子数量 (true|false)

**响应**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "技术",
      "description": "技术相关讨论",
      "icon": "tech-icon",
      "order": 1,
      "isActive": true,
      "parentId": null,
      "postCount": 150,
      "children": [
        {
          "id": "uuid",
          "name": "前端开发",
          "description": "前端技术讨论",
          "order": 1,
          "postCount": 80
        }
      ],
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```

### 4.2 获取所有分类
```http
GET /api/categories/all
```

**响应**: 返回扁平化的所有分类列表

### 4.3 获取分类详情
```http
GET /api/categories/:id
```

### 4.4 获取分类帖子数量
```http
GET /api/categories/:id/post-count
```

### 4.5 创建分类 (管理员)
```http
POST /api/categories
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "name": "string (2-50字符)",
  "description": "string (可选，最多200字符)",
  "icon": "string (可选)",
  "order": "number (可选，0-1000)",
  "isActive": "boolean (可选，默认true)",
  "parentId": "uuid (可选)"
}
```

### 4.6 更新分类 (管理员)
```http
PUT /api/categories/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

### 4.7 删除分类 (管理员)
```http
DELETE /api/categories/:id
```
**需要认证**: ✅ **需要权限**: ADMIN

### 4.8 更新分类排序 (管理员)
```http
PUT /api/categories/order
```
**需要认证**: ✅ **需要权限**: ADMIN

**请求体**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "order": 1
    }
  ]
}
```

## 分类层级

- 支持多级分类结构
- 最多支持3级分类
- 删除父分类时子分类会移动到根级别
- 分类排序在同级别内有效

## 注意事项

1. 分类名称在同级别内必须唯一
2. 删除分类前需要先移动或删除该分类下的帖子
3. 分类图标支持Font Awesome图标名称
4. 分类描述支持Markdown格式
5. 分类排序数字越小越靠前 