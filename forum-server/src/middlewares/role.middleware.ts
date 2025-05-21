import { Request, Response, NextFunction } from 'express';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config'; // 修复导入路径
 import { UserRole } from '../models/user.entity';

// 将所有中间件函数放在命名空间中避免重复声明问题
namespace RoleMiddleware {
  /**
   * 角色检查中间件
   * 检查用户是否具有指定的角色权限
   * @param roles 允许访问的角色数组
   */
  export const checkRole = (roles: UserRole[]) => {
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

  /**
   * 资源所有者检查中间件
   * 检查当前用户是否为资源的所有者
   * @param getResourceOwnerId 获取资源所有者ID的函数
   */
  export const checkResourceOwner = (getResourceOwnerId: (req: Request) => Promise<string> | string) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new ApiError(HttpStatus.UNAUTHORIZED, '未授权访问');
        }
        
        const userId = req.user.id;
        
        // 如果用户是管理员或版主，则允许访问
        if ([UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
          return next();
        }
        
        // 获取资源所有者ID
        const resourceOwnerId = await getResourceOwnerId(req);
        
        // 检查当前用户是否为资源所有者
        if (resourceOwnerId !== userId) {
          throw new ApiError(HttpStatus.FORBIDDEN, '您无权操作此资源');
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  };

  /**
   * 组合角色和资源所有者检查中间件
   * 如果用户具有指定角色或是资源所有者，则允许访问
   * @param roles 允许访问的角色数组
   * @param getResourceOwnerId 获取资源所有者ID的函数
   */
  export const checkRoleOrResourceOwner = (
    roles: UserRole[],
    getResourceOwnerId: (req: Request) => Promise<string> | string
  ) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new ApiError(HttpStatus.UNAUTHORIZED, '未授权访问');
        }
        
        // 如果用户具有指定角色，则允许访问
        if (roles.length && roles.includes(req.user.role)) {
          return next();
        }
        
        // 获取资源所有者ID
        const resourceOwnerId = await getResourceOwnerId(req);
        
        // 检查当前用户是否为资源所有者
        if (resourceOwnerId === req.user.id) {
          return next();
        }
        
        // 既不是指定角色也不是资源所有者，拒绝访问
        throw new ApiError(HttpStatus.FORBIDDEN, '权限不足，无法访问此资源');
      } catch (error) {
        next(error);
      }
    };
  };
}

// 从命名空间中导出函数
export const { checkRole, checkResourceOwner, checkRoleOrResourceOwner } = RoleMiddleware;
