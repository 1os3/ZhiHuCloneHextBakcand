import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { FileService } from '../services/file.service';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';
import { FileStatus } from '../models/file.entity';

/**
 * 文件管理控制器，处理管理员对文件的管理操作
 */
export class FileAdminController extends BaseController {
  private readonly fileService: FileService;

  constructor() {
    super();
    this.fileService = new FileService();
  }

  /**
   * 获取所有文件列表（管理员）
   */
  getAllFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, status, type, userId, startDate, endDate } = req.query;
    
    const queryDto: any = {};
    
    if (status) {
      queryDto.status = status;
    }
    
    if (type) {
      queryDto.type = type;
    }
    
    if (userId) {
      queryDto.userId = userId;
    }
    
    if (startDate) {
      queryDto.startDate = new Date(startDate as string);
    }
    
    if (endDate) {
      queryDto.endDate = new Date(endDate as string);
    }
    
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.fileService.findFiles(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取文件详情（管理员）
   */
  getFileDetails = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const file = await this.fileService.getFileById(id, false);
    return this.success(res, file);
  });

  /**
   * 更新文件状态（管理员）
   */
  updateFileStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status, expiresAt } = req.body;
    
    if (!status || !Object.values(FileStatus).includes(status)) {
      return this.error(res, HttpStatus.BAD_REQUEST, '无效的文件状态');
    }
    
    const file = await this.fileService.getFileById(id, false);
    
    file.status = status;
    
    if (expiresAt) {
      file.expiresAt = new Date(expiresAt);
    }
    
    await this.fileService.updateFile(id, req.user!.id, { status, expiresAt });
    
    logger.info(`管理员更新文件状态: ${id}, 状态: ${status}`);
    return this.success(res, { success: true });
  });

  /**
   * 删除文件（管理员）
   */
  deleteFile = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { forceDelete } = req.body;
    
    await this.fileService.deleteFile(id, req.user!.id, forceDelete === true);
    
    logger.info(`管理员删除文件: ${id}, 强制删除: ${forceDelete === true}`);
    return this.success(res, { success: true });
  });

  /**
   * 批量删除文件（管理员）
   */
  batchDeleteFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { ids, forceDelete } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return this.error(res, HttpStatus.BAD_REQUEST, '文件ID列表不能为空');
    }
    
    const results = await Promise.allSettled(
      ids.map(id => this.fileService.deleteFile(id, req.user!.id, forceDelete === true))
    );
    
    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`管理员批量删除文件，成功: ${succeeded}, 失败: ${failed}`);
    return this.success(res, { succeeded, failed });
  });

  /**
   * 清理过期文件（管理员）
   */
  cleanupExpiredFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { dryRun } = req.query;
    
    const result = await this.fileService.cleanupExpiredFiles(dryRun === 'true');
    
    logger.info(`管理员清理过期文件，${dryRun === 'true' ? '模拟运行' : '实际运行'}，共 ${result.count} 个文件`);
    return this.success(res, result);
  });

  /**
   * 清理未使用文件（管理员）
   */
  cleanupUnusedFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { days, dryRun } = req.query;
    
    const daysNumber = parseInt(days as string) || 90;
    
    const result = await this.fileService.cleanupUnusedFiles(daysNumber, dryRun === 'true');
    
    logger.info(`管理员清理未使用文件，${dryRun === 'true' ? '模拟运行' : '实际运行'}，共 ${result.count} 个文件`);
    return this.success(res, result);
  });

  /**
   * 获取文件统计信息（管理员）
   */
  getFileStats = this.asyncHandler(async (req: Request, res: Response) => {
    const stats = await this.fileService.getFileStats();
    return this.success(res, stats);
  });
}
