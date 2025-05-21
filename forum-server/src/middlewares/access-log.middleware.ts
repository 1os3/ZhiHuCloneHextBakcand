import { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/log.service';
import { logger } from '../config/logger.config';

/**
 * 访问日志中间件
 * 用于记录所有API请求的访问日志
 */
export const accessLogger = (req: Request, res: Response, next: NextFunction): void => {
  // 记录请求开始时间
  const startTime = process.hrtime();
  
  // 捕获响应完成事件
  res.on('finish', () => {
    // 异步记录访问日志
    setTimeout(async () => {
      try {
        const logService = new LogService();
        await logService.logAccess(req, res, startTime);
      } catch (error: any) {
        logger.error(`记录访问日志失败: ${error.message}`);
      }
    }, 0);
  });
  
  // 继续处理请求
  next();
};
