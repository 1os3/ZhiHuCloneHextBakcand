import { logger } from '../config/logger.config';

// 自定义API错误类
export class ApiError extends Error {
  statusCode: number;
  status: number; // 添加status属性，与statusCode相同
  code: string; // 添加code属性
  isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true, code = '', stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.status = statusCode; // 设置status与statusCode相同
    this.code = code || ErrorType.SERVER_ERROR; // 设置默认错误类型
    this.isOperational = isOperational;
    
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// HTTP状态码常量
export const HttpStatus: { [key: string]: number } & { [key: number]: string } = {
  // 状态码常量
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

// 初始化反向映射
(function initHttpStatusReverseMappings() {
  Object.entries(HttpStatus).forEach(([key, value]) => {
    if (typeof value === 'number') {
      HttpStatus[value] = key;
    }
  });
})();

// 错误类型常量
export const ErrorType = {
  VALIDATION_ERROR: 'ValidationError',
  NOT_FOUND: 'NotFoundError',
  UNAUTHORIZED: 'UnauthorizedError',
  FORBIDDEN: 'ForbiddenError',
  CONFLICT: 'ConflictError',
  SERVER_ERROR: 'ServerError',
};

// 创建特定类型的错误
export const createError = {
  validation: (message = '请求数据验证失败') => 
    new ApiError(HttpStatus.BAD_REQUEST, message),
  
  notFound: (resource = '资源', id = '') => 
    new ApiError(HttpStatus.NOT_FOUND, `${resource}${id ? ` (${id})` : ''} 未找到`),
  
  unauthorized: (message = '未授权访问') => 
    new ApiError(HttpStatus.UNAUTHORIZED, message),
  
  forbidden: (message = '禁止访问此资源') => 
    new ApiError(HttpStatus.FORBIDDEN, message),
  
  conflict: (message = '资源冲突') => 
    new ApiError(HttpStatus.CONFLICT, message),
  
  server: (message = '服务器内部错误') => 
    new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message, true),
};

// 全局错误处理中间件
export const errorHandler = (err: any, req: any, res: any, next: any): void => {
  // 默认为500内部服务器错误
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = '服务器内部错误';
  let isOperational = false;

  // 如果是我们的ApiError实例
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } 
  // 处理Sequelize/TypeORM验证错误
  else if (err.name === 'ValidationError' || err.name === 'SequelizeValidationError') {
    statusCode = HttpStatus.BAD_REQUEST;
    message = err.message;
    isOperational = true;
  }
  // 处理JWT错误
  else if (err.name === 'JsonWebTokenError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = '无效的令牌';
    isOperational = true;
  }
  // 处理JWT过期错误
  else if (err.name === 'TokenExpiredError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = '令牌已过期';
    isOperational = true;
  }

  // 记录错误日志
  if (!isOperational) {
    logger.error({
      message: `未处理的错误: ${message}`,
      error: err,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : 'anonymous',
    });
  } else {
    logger.warn({
      message: `操作错误: ${message}`,
      statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      user: req.user ? req.user.id : 'anonymous',
    });
  }

  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
};
