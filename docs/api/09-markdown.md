# Markdown 处理 API

## 概述

Markdown处理API提供Markdown内容的解析、摘要提取、封面图片提取、内容验证等功能。

## API 端点

### 9.1 解析Markdown
```http
POST /api/markdown/parse
```

**请求体**:
```json
{
  "content": "string (Markdown内容)",
  "options": {
    "sanitize": true,
    "allowHtml": false,
    "enableToc": true,
    "enableCodeHighlight": true,
    "enableMath": false
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "html": "<h1>标题</h1><p>内容...</p>",
    "toc": [
      {
        "level": 1,
        "title": "标题",
        "anchor": "title",
        "children": []
      }
    ],
    "metadata": {
      "wordCount": 150,
      "readingTime": 1,
      "hasImages": true,
      "hasCodeBlocks": false,
      "hasTables": true
    }
  }
}
```

### 9.2 带文件引用的解析
```http
POST /api/markdown/parse-with-files
```
**需要认证**: ✅

**请求体**:
```json
{
  "content": "string (包含文件引用的Markdown内容)",
  "fileIds": ["uuid1", "uuid2"],
  "options": {
    "sanitize": true,
    "allowHtml": false,
    "enableToc": true,
    "enableCodeHighlight": true,
    "enableMath": false,
    "processFileReferences": true
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "html": "<h1>标题</h1><p>内容...</p><img src='file-url' alt='图片'>",
    "toc": [
      {
        "level": 1,
        "title": "标题",
        "anchor": "title",
        "children": []
      }
    ],
    "processedFiles": [
      {
        "id": "uuid1",
        "originalRef": "![图片](file:uuid1)",
        "processedRef": "![图片](https://cdn.example.com/files/uuid1.jpg)",
        "type": "image"
      }
    ],
    "metadata": {
      "wordCount": 150,
      "readingTime": 1,
      "hasImages": true,
      "hasCodeBlocks": false,
      "hasTables": true,
      "fileReferences": 2
    }
  }
}
```

### 9.3 提取摘要
```http
POST /api/markdown/extract-summary
```
**需要认证**: ✅

**请求体**:
```json
{
  "content": "string (Markdown内容)",
  "maxLength": 200,
  "preserveFormatting": false
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "summary": "这是从Markdown内容中提取的摘要...",
    "originalLength": 1500,
    "summaryLength": 180,
    "truncated": true,
    "extractionMethod": "auto"
  }
}
```

### 9.4 提取封面图片
```http
POST /api/markdown/extract-cover
```
**需要认证**: ✅

**请求体**:
```json
{
  "content": "string (Markdown内容)",
  "preferredPosition": "first|largest|manual",
  "fallbackToDefault": true
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "coverImage": "https://example.com/image.jpg",
    "imageInfo": {
      "alt": "图片描述",
      "title": "图片标题",
      "position": "first",
      "size": "large"
    },
    "allImages": [
      {
        "url": "https://example.com/image1.jpg",
        "alt": "图片1",
        "position": 1
      },
      {
        "url": "https://example.com/image2.jpg",
        "alt": "图片2",
        "position": 2
      }
    ]
  }
}
```

### 9.5 验证Markdown内容
```http
POST /api/markdown/validate
```
**需要认证**: ✅

**请求体**:
```json
{
  "content": "string (Markdown内容)",
  "rules": {
    "maxLength": 10000,
    "allowHtml": false,
    "allowScripts": false,
    "checkLinks": true,
    "checkImages": true,
    "requireTitle": true
  }
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": [
      {
        "type": "broken_link",
        "message": "链接可能无法访问",
        "line": 15,
        "url": "https://example.com/broken"
      }
    ],
    "statistics": {
      "wordCount": 1200,
      "characterCount": 8500,
      "headingCount": 5,
      "linkCount": 8,
      "imageCount": 3,
      "codeBlockCount": 2
    }
  }
}
```

## 解析选项说明

### sanitize (内容清理)
- `true`: 清理潜在的恶意内容
- `false`: 保留原始内容
- 默认: `true`

### allowHtml (允许HTML)
- `true`: 允许HTML标签
- `false`: 转义HTML标签
- 默认: `false`

### enableToc (启用目录)
- `true`: 生成目录结构
- `false`: 不生成目录
- 默认: `true`

### enableCodeHighlight (代码高亮)
- `true`: 启用代码语法高亮
- `false`: 普通代码块
- 默认: `true`

### enableMath (数学公式)
- `true`: 支持LaTeX数学公式
- `false`: 不处理数学公式
- 默认: `false`

## 文件引用格式

### 图片引用
```markdown
![图片描述](file:uuid)
![图片描述](file:uuid "图片标题")
```

### 文档引用
```markdown
[文档名称](file:uuid)
[下载文档](file:uuid "文档描述")
```

### 视频引用
```markdown
![视频](file:uuid)
<video src="file:uuid" controls></video>
```

## 摘要提取策略

### auto (自动提取)
- 提取前几段内容
- 智能断句处理
- 保持语义完整

### manual (手动指定)
- 使用`<!-- summary -->`标记
- 提取标记内的内容
- 支持自定义摘要

### first_paragraph (首段提取)
- 提取第一段内容
- 适合新闻类文章
- 简单快速

## 封面图片选择

### first (第一张)
- 选择文档中第一张图片
- 最常用的策略
- 快速简单

### largest (最大的)
- 选择尺寸最大的图片
- 需要图片尺寸信息
- 视觉效果更好

### manual (手动指定)
- 使用`<!-- cover: url -->`标记
- 完全自定义控制
- 最灵活的方式

## 内容验证规则

### 长度限制
- `maxLength`: 最大字符数
- `minLength`: 最小字符数
- 超出限制会报错

### 内容安全
- `allowHtml`: 是否允许HTML
- `allowScripts`: 是否允许脚本
- `checkMalicious`: 检查恶意内容

### 链接检查
- `checkLinks`: 验证链接有效性
- `allowExternalLinks`: 允许外部链接
- `requireHttps`: 要求HTTPS链接

### 结构要求
- `requireTitle`: 要求标题
- `maxHeadingLevel`: 最大标题级别
- `requireSummary`: 要求摘要

## 支持的Markdown语法

### 基础语法
- 标题 (H1-H6)
- 段落和换行
- 强调 (粗体、斜体)
- 列表 (有序、无序)
- 链接和图片
- 代码 (行内、块)

### 扩展语法
- 表格
- 删除线
- 任务列表
- 脚注
- 定义列表
- 缩略语

### 自定义扩展
- 文件引用
- 数学公式 (可选)
- 图表 (可选)
- 视频嵌入
- 代码高亮

## 错误响应

### 常见错误

- **400 Bad Request**: Markdown语法错误
- **401 Unauthorized**: 未认证 (需要认证的端点)
- **413 Payload Too Large**: 内容过大
- **422 Unprocessable Entity**: 内容验证失败

### 错误示例

```json
{
  "success": false,
  "error": {
    "code": "MARKDOWN_SYNTAX_ERROR",
    "message": "Markdown语法错误",
    "details": {
      "line": 15,
      "column": 8,
      "expected": "closing bracket",
      "actual": "end of line"
    }
  }
}
```

## 性能优化

### 缓存机制
- 解析结果缓存
- 文件引用缓存
- 摘要提取缓存

### 异步处理
- 大文档异步解析
- 批量文件处理
- 后台摘要生成

### 限制说明
- 单次解析最大100KB
- 文件引用最多50个
- 图片处理最大10MB

## 注意事项

1. Markdown内容会进行敏感词过滤
2. 文件引用需要有访问权限
3. 解析结果会缓存30分钟
4. 支持实时预览功能
5. 大文档建议分段处理
6. 数学公式需要额外配置
7. 代码高亮支持主流语言
8. 图片会自动压缩和优化 