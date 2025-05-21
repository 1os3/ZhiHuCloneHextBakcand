import { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/log.service';
import { ActivityType } from '../models/activity-log.entity';
import { logger } from '../config/logger.config';

/**
 * 操作日志记录函数
 * 用于记录用户的重要操作
 * @param req 请求对象
 * @param type 操作类型
 * @param description 操作描述
 * @param details 操作详情
 * @param resourceType 资源类型
 * @param resourceId 资源ID
 * @param success 是否成功
 * @param failureReason 失败原因
 */
export const logActivity = async (
  req: Request,
  type: ActivityType,
  description: string,
  details?: string,
  resourceType?: string,
  resourceId?: string,
  success: boolean = true,
  failureReason?: string
): Promise<void> => {
  try {
    const logService = new LogService();
    
    // 获取用户信息
    const userId = req.user?.id;
    const username = req.user?.username;
    
    // 获取IP地址和用户代理
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] as string || 
                     req.socket.remoteAddress || 
                     'unknown';
    const userAgent = req.headers['user-agent'] as string || 'unknown';
    
    // 记录操作日志
    await logService.logActivity(
      type,
      description,
      userId,
      username,
      ipAddress,
      userAgent,
      details,
      resourceType,
      resourceId,
      success,
      failureReason
    );
  } catch (error: any) {
    logger.error(`记录操作日志失败: ${error.message}`);
  }
};

/**
 * 操作日志中间件工厂函数
 * 用于创建记录特定操作的中间件
 * @param type 操作类型
 * @param getDescription 获取操作描述的函数
 * @param getResourceInfo 获取资源信息的函数
 */
export const activityLogger = (
  type: ActivityType,
  getDescription: (req: Request) => string,
  getResourceInfo?: (req: Request) => { type?: string; id?: string; details?: string }
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // 保存原始的json方法
    const originalJson = res.json;
    
    // 重写json方法，在响应发送后记录操作日志
    res.json = function(body?: any): Response {
      // 恢复原始的json方法
      res.json = originalJson;
      
      // 调用原始的json方法
      res.json(body);
      
      // 异步记录操作日志
      setTimeout(async () => {
        try {
          // 获取操作描述
          const description = getDescription(req);
          
          // 获取资源信息
          const resourceInfo = getResourceInfo ? getResourceInfo(req) : {};
          
          // 判断操作是否成功
          const success = res.statusCode >= 200 && res.statusCode < 300;
          
          // 获取失败原因
          const failureReason = !success && body?.message ? body.message : undefined;
          
          // 记录操作日志
          await logActivity(
            req,
            type,
            description,
            resourceInfo.details,
            resourceInfo.type,
            resourceInfo.id,
            success,
            failureReason
          );
        } catch (error: any) {
          logger.error(`记录操作日志失败: ${error.message}`);
        }
      }, 0);
      
      return res;
    };
    
    // 继续处理请求
    next();
  };
};
