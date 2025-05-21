import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { ReportService } from '../services/report.service';
import { 
  CreateReportDto,
  ResolveReportDto,
  ReportQueryDto
} from '../dtos/report.dto';
import { logger } from '../utils/logger.util';
import { HttpStatus } from '../utils/error.util';

/**
 * 举报控制器，处理举报相关的HTTP请求
 */
export class ReportController extends BaseController {
  private readonly reportService: ReportService;

  constructor() {
    super();
    this.reportService = new ReportService();
  }

  /**
   * 创建举报
   * @route POST /api/reports
   */
  createReport = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const createDto = req.body as CreateReportDto;
    const report = await this.reportService.createReport(userId, createDto);
    logger.info(`举报创建成功: ${report.id}, 类型: ${createDto.type}, 目标ID: ${createDto.targetId}`);
    return this.success(res, report, HttpStatus.CREATED);
  });

  /**
   * 获取举报详情
   * @route GET /api/reports/:id
   */
  getReport = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const report = await this.reportService.getReportDetails(id);
    return this.success(res, report);
  });

  /**
   * 处理举报
   * @route PUT /api/reports/:id/resolve
   */
  resolveReport = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const adminId = req.user?.id;
    const resolveDto = req.body as ResolveReportDto;
    const resolvedReport = await this.reportService.resolveReport(id, adminId, resolveDto);
    logger.info(`举报处理成功: ${id}, 处理结果: ${resolveDto.resolution}`);
    return this.success(res, resolvedReport);
  });

  /**
   * 获取举报列表
   * @route GET /api/reports
   */
  getReports = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as ReportQueryDto;
    
    // 处理日期参数
    if (queryDto.startDate && typeof queryDto.startDate === 'string') {
      queryDto.startDate = new Date(queryDto.startDate);
    }
    
    if (queryDto.endDate && typeof queryDto.endDate === 'string') {
      queryDto.endDate = new Date(queryDto.endDate);
    }
    
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.reportService.findReports(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取用户的举报
   * @route GET /api/users/:userId/reports
   */
  getUserReports = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.reportService.findUserReports(userId, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取未处理的举报数量
   * @route GET /api/reports/pending-count
   */
  getPendingCount = this.asyncHandler(async (req: Request, res: Response) => {
    const count = await this.reportService.getPendingCount();
    return this.success(res, { count });
  });
}
