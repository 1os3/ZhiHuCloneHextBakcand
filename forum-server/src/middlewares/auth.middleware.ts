import { Request, Response, NextFunction } from 'express';
import { JwtUtil } from '../utils/jwt.util';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';

// 扩展 Express 的 Request 接口，添加 user 属性
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// 身份验证中间件
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // 从请求头中获取 Authorization 字段
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, '未提供授权令牌');
    }
    
    // 提取并验证令牌
    const token = JwtUtil.extractTokenFromHeader(authHeader);
    const decoded = JwtUtil.verifyToken(token);
    
    // 将解码后的用户信息添加到请求对象中
    req.user = decoded;
    
    next();
  } catch (error) {
    next(error);
  }
};

// 角色授权中间件
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, '未授权访问');
      }
      
      if (roles.length && !roles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.id} (${req.user.role}) 尝试访问需要 ${roles.join(', ')} 角色的资源`);
        throw new ApiError(HttpStatus.FORBIDDEN, '权限不足，无法访问此资源');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 检查是否为资源所有者
export const isResourceOwner = (resourceIdParam: string, userIdField: string = 'id') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, '未授权访问');
      }
      
      const resourceId = req.params[resourceIdParam];
      const userId = req.user[userIdField];
      
      // 如果用户是管理员或版主，则允许访问
      if (['admin', 'moderator'].includes(req.user.role)) {
        return next();
      }
      
      // 检查资源所有者
      // 注意：这里只是一个基本检查，实际实现中应该从数据库查询资源并检查所有者
      if (req.body.userId && req.body.userId !== userId) {
        throw new ApiError(HttpStatus.FORBIDDEN, '您无权修改此资源');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
