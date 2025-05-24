# API 文档说明

## 文档结构

本项目的API文档已按功能模块拆分为多个独立文档，便于查阅和维护。

### 核心功能模块
- [用户管理 API](./api/01-users.md) - 用户注册、登录、资料管理
- [帖子管理 API](./api/02-posts.md) - 帖子创建、编辑、搜索、点赞
- [评论管理 API](./api/03-comments.md) - 评论回复、点赞、嵌套结构
- [分类管理 API](./api/04-categories.md) - 分类层级、管理功能

### 交互功能模块
- [通知管理 API](./api/05-notifications.md) - 消息通知、已读状态
- [私信管理 API](./api/06-messages.md) - 用户间私信、会话管理
- [举报管理 API](./api/07-reports.md) - 内容举报、管理员处理

### 文件与内容模块
- [文件管理 API](./api/08-files.md) - 文件上传、管理、清理
- [Markdown 处理 API](./api/09-markdown.md) - 内容解析、摘要提取
- [敏感词管理 API](./api/10-sensitive-words.md) - 内容审核、词库管理

### 系统管理模块
- [IP 过滤管理 API](./api/11-ip-filters.md) - 访问控制、安全管理
- [日志管理 API](./api/12-logs.md) - 操作记录、访问统计
- [文件管理 API (管理员)](./api/13-admin-files.md) - 管理员文件操作

### 系统功能模块
- [CSRF 令牌 API](./api/14-csrf.md) - 安全令牌
- [健康检查 API](./api/15-health.md) - 系统状态监控

## 快速开始

### 1. 基础配置
```javascript
// API基础配置
const API_BASE_URL = 'http://localhost:3000';
const API_PREFIX = '/api';

// 请求头配置
const headers = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <your-jwt-token>',
  'X-CSRF-Token': '<csrf-token>'
};
```

### 2. 获取CSRF令牌
```javascript
// 获取CSRF令牌
const getCsrfToken = async () => {
  const response = await fetch(`${API_BASE_URL}/api/csrf/token`);
  const data = await response.json();
  return data.data.csrfToken;
};
```

### 3. 用户认证
```javascript
// 用户登录
const login = async (usernameOrEmail, password) => {
  const csrfToken = await getCsrfToken();
  
  const response = await fetch(`${API_BASE_URL}/api/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({
      usernameOrEmail,
      password
    })
  });
  
  return response.json();
};
```

### 4. 发起认证请求
```javascript
// 创建帖子示例
const createPost = async (postData, token) => {
  const csrfToken = await getCsrfToken();
  
  const response = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify(postData)
  });
  
  return response.json();
};
```

## 错误处理

### 统一错误格式
```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误信息",
    "details": {}
  }
}
```

### 常见错误处理
```javascript
const handleApiResponse = async (response) => {
  const data = await response.json();
  
  if (!data.success) {
    switch (data.error.code) {
      case 'UNAUTHORIZED':
        // 重新登录
        redirectToLogin();
        break;
      case 'VALIDATION_ERROR':
        // 显示验证错误
        showValidationErrors(data.error.details);
        break;
      case 'RATE_LIMIT_EXCEEDED':
        // 显示限流提示
        showRateLimitMessage();
        break;
      default:
        // 显示通用错误
        showErrorMessage(data.error.message);
    }
    throw new Error(data.error.message);
  }
  
  return data.data;
};
```

## 最佳实践

### 1. 请求拦截器
```javascript
// 使用axios拦截器自动添加认证头
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const csrfToken = localStorage.getItem('csrfToken');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  if (csrfToken && ['post', 'put', 'delete'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = csrfToken;
  }
  
  return config;
});
```

### 2. 响应拦截器
```javascript
// 自动处理token刷新
axios.interceptors.response.use(
  (response) => {
    // 检查新的CSRF令牌
    const newCsrfToken = response.headers['x-new-csrf-token'];
    if (newCsrfToken) {
      localStorage.setItem('csrfToken', newCsrfToken);
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      // 尝试刷新token
      await refreshToken();
      return axios.request(error.config);
    }
    return Promise.reject(error);
  }
);
```

### 3. 分页处理
```javascript
// 通用分页组件
const usePagination = (apiCall) => {
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  
  const loadPage = async (page = 1, limit = 10) => {
    setLoading(true);
    try {
      const response = await apiCall({ page, limit });
      setData(response.items);
      setPagination(response.pagination);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return { data, pagination, loading, loadPage };
};
```

## 开发工具

### 1. Postman集合
项目提供了Postman集合文件，包含所有API的示例请求：
- 导入 `postman/zhihu-clone-api.json`
- 配置环境变量：`baseUrl`, `token`, `csrfToken`

### 2. OpenAPI规范
API文档遵循OpenAPI 3.0规范，可以：
- 使用Swagger UI查看交互式文档
- 生成客户端SDK
- 进行API测试

### 3. 类型定义
TypeScript类型定义文件：
```typescript
// types/api.ts
export interface User {
  id: string;
  username: string;
  email: string;
  nickname?: string;
  avatar?: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'inactive' | 'banned';
}

export interface Post {
  id: string;
  title: string;
  content: string;
  summary?: string;
  author: User;
  category: Category;
  tags: Tag[];
  status: 'draft' | 'published' | 'archived';
}
```

## 版本控制

### API版本
- 当前版本：v1
- 版本前缀：`/api`
- 向后兼容：保证至少2个版本的兼容性

### 更新日志
- 新增功能：小版本号递增
- 破坏性变更：大版本号递增
- 安全修复：补丁版本号递增

## 支持与反馈

如有问题或建议，请：
1. 查看相关API文档
2. 检查错误响应格式
3. 提交Issue到项目仓库
4. 联系开发团队

---

**注意**: 本文档会随着API的更新而持续维护，请关注版本变更。 