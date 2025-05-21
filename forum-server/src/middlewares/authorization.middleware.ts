import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/user.entity';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';

/**
 * 授权中间件
 * 用于检查用户是否具有指定角色的权限
 * @param roles 允许访问的角色列表
 */
export const authorize = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // 确保用户已经通过身份验证
      if (!req.user) {
        throw new ApiError(HttpStatus.UNAUTHORIZED, '未授权访问');
      }

      // 检查用户角色是否在允许的角色列表中
      if (!roles.includes(req.user.role)) {
        logger.warn(`用户 ${req.user.id} 尝试访问未授权资源，角色: ${req.user.role}，需要角色: ${roles.join(', ')}`);
        throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限执行此操作');
      }

      // 授权通过，继续下一个中间件
      next();
    } catch (error) {
      next(error);
    }
  };
};
