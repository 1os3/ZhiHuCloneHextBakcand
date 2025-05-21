# 论坛系统API文档

## 用户模块

### 注册用户
- **路径**: `POST /api/users/register`
- **功能**: 用户注册
- **请求体**:
  ```json
  {
    "username": "用户名",
    "email": "电子邮箱",
    "password": "密码",
    "nickname": "昵称(可选)"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "用户ID",
        "username": "用户名",
        "email": "电子邮箱",
        "nickname": "昵称",
        "role": "角色",
        "status": "状态"
      },
      "token": "JWT令牌"
    }
  }
  ```

### 用户登录
- **路径**: `POST /api/users/login`
- **功能**: 用户登录
- **请求体**:
  ```json
  {
    "usernameOrEmail": "用户名或电子邮箱",
    "password": "密码"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "user": {
        "id": "用户ID",
        "username": "用户名",
        "email": "电子邮箱",
        "nickname": "昵称",
        "role": "角色",
        "status": "状态"
      },
      "token": "JWT令牌",
      "refreshToken": "刷新令牌"
    }
  }
  ```

### 刷新令牌
- **路径**: `POST /api/users/refresh-token`
- **功能**: 刷新访问令牌
- **请求体**:
  ```json
  {
    "refreshToken": "刷新令牌"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "token": "新的JWT令牌"
    }
  }
  ```

### 获取当前用户信息
- **路径**: `GET /api/users/me`
- **功能**: 获取当前登录用户信息
- **请求头**: `Authorization: Bearer <token>`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "用户ID",
      "username": "用户名",
      "email": "电子邮箱",
      "nickname": "昵称",
      "role": "角色",
      "status": "状态",
      "avatar": "头像URL",
      "bio": "个人简介"
    }
  }
  ```

### 更新用户资料
- **路径**: `PUT /api/users/profile`
- **功能**: 更新用户资料
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "nickname": "新昵称",
    "avatar": "新头像URL",
    "bio": "新个人简介"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "用户ID",
      "username": "用户名",
      "email": "电子邮箱",
      "nickname": "新昵称",
      "avatar": "新头像URL",
      "bio": "新个人简介"
    }
  }
  ```

### 忘记密码
- **路径**: `POST /api/users/forgot-password`
- **功能**: 发送密码重置邮件
- **请求体**:
  ```json
  {
    "email": "电子邮箱"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "success": true
    }
  }
  ```

## 帖子模块

### 创建帖子
- **路径**: `POST /api/posts`
- **功能**: 创建新帖子
- **请求头**: `Authorization: Bearer <token>`
- **请求体**:
  ```json
  {
    "title": "帖子标题",
    "content": "帖子内容",
    "categoryId": "分类ID",
    "tagIds": ["标签ID1", "标签ID2"],
    "status": "PUBLISHED或DRAFT"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "帖子ID",
      "title": "帖子标题",
      "content": "帖子内容",
      "authorId": "作者ID",
      "author": {
        "id": "作者ID",
        "username": "作者用户名"
      },
      "categoryId": "分类ID",
      "category": {
        "id": "分类ID",
        "name": "分类名称"
      },
      "tags": [
        {
          "id": "标签ID1",
          "name": "标签名称1"
        },
        {
          "id": "标签ID2",
          "name": "标签名称2"
        }
      ]
    }
  }
  ```

### 获取帖子详情
- **路径**: `GET /api/posts/:id`
- **功能**: 获取帖子详情
- **参数**: `id` - 帖子ID
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "帖子ID",
      "title": "帖子标题",
      "content": "帖子内容",
      "authorId": "作者ID",
      "author": {
        "id": "作者ID",
        "username": "作者用户名"
      },
      "categoryId": "分类ID",
      "category": {
        "id": "分类ID",
        "name": "分类名称"
      },
      "tags": [],
      "viewCount": 浏览数,
      "likeCount": 点赞数,
      "commentCount": 评论数,
      "createdAt": "创建时间",
      "updatedAt": "更新时间"
    }
  }
  ```

### 获取帖子列表
- **路径**: `GET /api/posts`
- **功能**: 获取帖子列表
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `categoryId`: 分类ID（可选）
  - `search`: 搜索关键词（可选）
  - `searchType`: 搜索类型（可选）all/title/content/tag/author
  - `sortBy`: 排序方式（可选）newest/oldest/most_viewed/most_liked/most_commented
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "帖子ID",
          "title": "帖子标题",
          "summary": "帖子摘要",
          "authorId": "作者ID",
          "author": {
            "id": "作者ID",
            "username": "作者用户名"
          },
          "categoryId": "分类ID",
          "category": {
            "id": "分类ID",
            "name": "分类名称"
          },
          "viewCount": 浏览数,
          "likeCount": 点赞数,
          "commentCount": 评论数,
          "createdAt": "创建时间"
        }
      ],
      "total": 总记录数,
      "page": 当前页码,
      "limit": 每页数量
    }
  }
  ```

## 评论模块

### 创建评论
- **路径**: `POST /api/posts/:postId/comments`
- **功能**: 创建评论
- **请求头**: `Authorization: Bearer <token>`
- **参数**: `postId` - 帖子ID
- **请求体**:
  ```json
  {
    "content": "评论内容"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "评论ID",
      "content": "评论内容",
      "authorId": "作者ID",
      "author": {
        "id": "作者ID",
        "username": "作者用户名",
        "nickname": "作者昵称",
        "avatar": "作者头像"
      },
      "postId": "帖子ID",
      "createdAt": "创建时间"
    }
  }
  ```

### 创建回复
- **路径**: `POST /api/comments/:parentId/replies`
- **功能**: 创建回复评论
- **请求头**: `Authorization: Bearer <token>`
- **参数**: `parentId` - 父评论ID
- **请求体**:
  ```json
  {
    "content": "回复内容"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "评论ID",
      "content": "回复内容",
      "authorId": "作者ID",
      "author": {
        "id": "作者ID",
        "username": "作者用户名",
        "nickname": "作者昵称",
        "avatar": "作者头像"
      },
      "postId": "帖子ID",
      "parentId": "父评论ID",
      "createdAt": "创建时间"
    }
  }
  ```

## 通知模块

### 获取通知列表
- **路径**: `GET /api/notifications`
- **功能**: 获取用户通知列表
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `read`: 是否已读（可选）true/false
  - `type`: 通知类型（可选）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "通知ID",
          "type": "通知类型",
          "title": "通知标题",
          "content": "通知内容",
          "read": 是否已读,
          "createdAt": "创建时间"
        }
      ],
      "total": 总记录数,
      "page": 当前页码,
      "limit": 每页数量
    }
  }
  ```

### 标记通知为已读
- **路径**: `PUT /api/notifications/:id`
- **功能**: 标记通知为已读
- **请求头**: `Authorization: Bearer <token>`
- **参数**: `id` - 通知ID
- **请求体**:
  ```json
  {
    "read": true
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "通知ID",
      "read": true
    }
  }
  ```

## 文件上传模块

### 上传文件
- **路径**: `POST /api/files`
- **功能**: 上传文件
- **请求头**: `Authorization: Bearer <token>`
- **请求体**: `multipart/form-data` 格式
  - `file`: 文件
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "id": "文件ID",
      "filename": "存储文件名",
      "originalname": "原始文件名",
      "mimetype": "MIME类型",
      "size": 文件大小,
      "url": "访问URL",
      "uploaderId": "上传者ID",
      "createdAt": "上传时间"
    }
  }
  ```

## 安全与管理模块

### 敏感词检查
- **路径**: `POST /api/sensitive-words/check`
- **功能**: 检查文本是否包含敏感词
- **请求体**:
  ```json
  {
    "text": "待检查文本"
  }
  ```
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "containsSensitiveWords": true/false,
      "words": ["敏感词1", "敏感词2"]
    }
  }
  ```

### 获取IP黑白名单列表
- **路径**: `GET /api/ip-filters`
- **功能**: 获取IP过滤规则列表
- **请求头**: `Authorization: Bearer <token>`
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "规则ID",
          "ipAddress": "IP地址",
          "type": "WHITE或BLACK",
          "reason": "原因",
          "expiresAt": "过期时间",
          "createdAt": "创建时间"
        }
      ],
      "total": 总记录数
    }
  }
  ```

### 获取操作日志
- **路径**: `GET /api/admin/logs/activity`
- **功能**: 获取操作日志列表
- **请求头**: `Authorization: Bearer <token>`
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认20）
  - `userId`: 用户ID（可选）
  - `action`: 操作类型（可选）
  - `startDate`: 开始日期（可选）
  - `endDate`: 结束日期（可选）
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "items": [
        {
          "id": "日志ID",
          "userId": "用户ID",
          "username": "用户名",
          "action": "操作类型",
          "details": "操作详情",
          "ipAddress": "IP地址",
          "userAgent": "用户代理",
          "createdAt": "操作时间"
        }
      ],
      "total": 总记录数,
      "page": 当前页码,
      "limit": 每页数量
    }
  }
  ```
