import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { LogService } from '../services/log.service';
import { ActivityLogQueryDto, AccessLogQueryDto, AccessStatsQueryDto, LogCleanupDto } from '../dtos/log.dto';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';

/**
 * 日志控制器
 * 处理日志相关的HTTP请求
 */
export class LogController extends BaseController {
  private readonly logService: LogService;

  constructor() {
    super();
    this.logService = new LogService();
  }

  /**
   * 获取操作日志列表
   * @route GET /api/admin/logs/activity
   */
  getActivityLogs = this.asyncHandler(async (req: Request, res: Response) => {
    const queryDto = req.query as unknown as ActivityLogQueryDto;
    
    const result = await this.logService.getActivityLogs(
      queryDto.userId,
      queryDto.type,
      queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      queryDto.endDate ? new Date(queryDto.endDate) : undefined,
      queryDto.page,
      queryDto.limit
    );
    
    return this.success(res, result);
  });

  /**
   * 获取访问日志列表
   * @route GET /api/admin/logs/access
   */
  getAccessLogs = this.asyncHandler(async (req: Request, res: Response) => {
    const queryDto = req.query as unknown as AccessLogQueryDto;
    
    const result = await this.logService.getAccessLogs(
      queryDto.path,
      queryDto.method,
      queryDto.statusCode,
      queryDto.userId,
      queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      queryDto.endDate ? new Date(queryDto.endDate) : undefined,
      queryDto.page,
      queryDto.limit
    );
    
    return this.success(res, result);
  });

  /**
   * 获取访问统计数据
   * @route GET /api/admin/logs/stats
   */
  getAccessStats = this.asyncHandler(async (req: Request, res: Response) => {
    const queryDto = req.query as unknown as AccessStatsQueryDto;
    
    const result = await this.logService.getAccessStats(
      queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      queryDto.endDate ? new Date(queryDto.endDate) : undefined
    );
    
    return this.success(res, result);
  });

  /**
   * 清理过期日志
   * @route POST /api/admin/logs/cleanup
   */
  cleanupLogs = this.asyncHandler(async (req: Request, res: Response) => {
    const cleanupDto = req.body as LogCleanupDto;
    
    const result = await this.logService.cleanupOldLogs(cleanupDto.days);
    
    logger.info(`日志清理完成，共清理 ${result.activityLogs} 条操作日志和 ${result.accessLogs} 条访问日志`);
    return this.success(res, result);
  });
}
