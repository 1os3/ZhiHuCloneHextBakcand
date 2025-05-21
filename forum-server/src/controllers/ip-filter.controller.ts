import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { IPFilterService } from '../services/ip-filter.service';
import { CreateIPFilterDto, UpdateIPFilterDto, IPFilterQueryDto } from '../dtos/ip-filter.dto';
import { IPFilterType } from '../models/ip-filter.entity';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';

/**
 * IP过滤控制器
 * 处理IP黑白名单相关的HTTP请求
 */
export class IPFilterController extends BaseController {
  private readonly ipFilterService: IPFilterService;

  constructor() {
    super();
    this.ipFilterService = new IPFilterService();
  }

  /**
   * 创建IP过滤规则
   * @route POST /api/admin/ip-filters
   */
  createIPFilter = this.asyncHandler(async (req: Request, res: Response) => {
    const createDto = req.body as CreateIPFilterDto;
    
    const ipFilter = await this.ipFilterService.addIPFilter(
      createDto.ipAddress,
      createDto.type,
      createDto.description,
      createDto.expiresAt ? new Date(createDto.expiresAt) : undefined
    );
    
    logger.info(`IP过滤规则创建成功: ${ipFilter.ipAddress} (${ipFilter.type})`);
    return this.success(res, ipFilter, HttpStatus.CREATED);
  });

  /**
   * 更新IP过滤规则
   * @route PUT /api/admin/ip-filters/:id
   */
  updateIPFilter = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateDto = req.body as UpdateIPFilterDto;
    
    const ipFilter = await this.ipFilterService.updateIPFilter(
      id,
      updateDto.isActive,
      updateDto.description,
      updateDto.expiresAt !== undefined ? 
        (updateDto.expiresAt ? new Date(updateDto.expiresAt) : null) : 
        undefined
    );
    
    logger.info(`IP过滤规则更新成功: ${ipFilter.id}`);
    return this.success(res, ipFilter);
  });

  /**
   * 删除IP过滤规则
   * @route DELETE /api/admin/ip-filters/:id
   */
  deleteIPFilter = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await this.ipFilterService.deleteIPFilter(id);
    
    logger.info(`IP过滤规则删除成功: ${id}`);
    return this.success(res, result);
  });

  /**
   * 获取IP过滤规则列表
   * @route GET /api/admin/ip-filters
   */
  getIPFilters = this.asyncHandler(async (req: Request, res: Response) => {
    const queryDto = req.query as unknown as IPFilterQueryDto;
    
    const page = queryDto.page ? parseInt(queryDto.page, 10) : 1;
    const limit = queryDto.limit ? parseInt(queryDto.limit, 10) : 10;
    
    const result = await this.ipFilterService.getIPFilters(
      queryDto.type,
      queryDto.isActive,
      page,
      limit
    );
    
    return this.success(res, result);
  });

  /**
   * 手动清理过期的IP过滤规则
   * @route POST /api/admin/ip-filters/cleanup
   */
  cleanupExpiredFilters = this.asyncHandler(async (req: Request, res: Response) => {
    const result = await this.ipFilterService.cleanupExpiredFilters();
    
    logger.info(`过期IP过滤规则清理完成，共清理 ${result.count} 条规则`);
    return this.success(res, result);
  });

  /**
   * 检查当前IP是否被允许访问
   * @route GET /api/ip-filters/check
   */
  checkIPAccess = this.asyncHandler(async (req: Request, res: Response) => {
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] as string || 
                     req.socket.remoteAddress || 
                     'unknown';
    
    const isAllowed = await this.ipFilterService.isIPAllowed(ipAddress);
    
    return this.success(res, { 
      ipAddress, 
      isAllowed 
    });
  });
}
