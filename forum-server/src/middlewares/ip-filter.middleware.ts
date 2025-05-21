import { Request, Response, NextFunction } from 'express';
import { IPFilterService } from '../services/ip-filter.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';

/**
 * IP过滤中间件
 * 用于检查请求IP是否在黑名单中或不在白名单中
 */
export const ipFilter = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 获取IP地址
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] as string || 
                     req.socket.remoteAddress || 
                     'unknown';
    
    // 跳过健康检查路由
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }
    
    // 检查IP是否被允许访问
    const ipFilterService = new IPFilterService();
    const isAllowed = await ipFilterService.isIPAllowed(ipAddress);
    
    if (!isAllowed) {
      logger.warn(`IP访问被拒绝: ${ipAddress}, 路径: ${req.path}`);
      throw new ApiError(HttpStatus.FORBIDDEN, '您的IP地址被限制访问');
    }
    
    // IP允许访问，继续下一个中间件
    next();
  } catch (error) {
    next(error);
  }
};
