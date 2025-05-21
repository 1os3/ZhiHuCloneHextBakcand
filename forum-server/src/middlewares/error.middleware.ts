import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.config';
import { ApiError, HttpStatus } from '../utils/error.util';
import { env } from '../config/env.config';

// 全局错误处理中间件
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  let message = '服务器内部错误';
  let isOperational = false;
  let stack: string | undefined;

  // 如果是我们的ApiError实例
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
    stack = err.stack;
  } 
  // 处理TypeORM验证错误
  else if (err.name === 'EntityNotFoundError') {
    statusCode = HttpStatus.NOT_FOUND;
    message = '请求的资源不存在';
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
  // 处理其他类型的错误
  else {
    stack = err.stack;
  }

  // 记录错误日志
  if (!isOperational) {
    logger.error({
      message: `未处理的错误: ${message}`,
      error: err,
      stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
    });
  } else {
    logger.warn({
      message: `操作错误: ${message}`,
      statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
    });
  }

  // 发送错误响应
  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(env.nodeEnv === 'development' && { stack }),
    },
  });
};

// 404 错误处理中间件
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new ApiError(HttpStatus.NOT_FOUND, `找不到路径: ${req.originalUrl}`);
  next(err);
};

// 异步错误处理包装器
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
