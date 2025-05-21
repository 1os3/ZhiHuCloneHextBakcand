import { Repository, LessThan, IsNull, Not, getManager, MoreThanOrEqual, Between } from 'typeorm';
import { File, FileType, FileStatus } from '../models/file.entity';
import { BaseService } from './base.service';
import { FileQueryDto, FileUpdateDto } from '../dtos/file.dto';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';
import { AppDataSource } from '../config/database.config';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';

const unlinkAsync = util.promisify(fs.unlink);
const mkdirAsync = util.promisify(fs.mkdir);

export class FileService extends BaseService<File> {
  private readonly uploadDir: string;
  private readonly fileRepository: Repository<File>;
  // 默认文件过期时间：30天
  private readonly DEFAULT_EXPIRATION_DAYS = 30;
  // 最大文件大小：10MB
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  constructor() {
    const fileRepository = AppDataSource.getRepository(File);
    super(fileRepository);
    
    this.fileRepository = fileRepository;
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadDir)) {
        await mkdirAsync(this.uploadDir, { recursive: true });
        logger.info(`创建上传目录: ${this.uploadDir}`);
      }
    } catch (error: any) {
      logger.error(`创建上传目录失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '无法创建上传目录');
    }
  }

  /**
   * 保存上传的文件信息到数据库
   * @param fileData 文件数据
   * @param userId 用户ID
   * @param type 文件类型
   * @param isPublic 是否公开访问
   * @param expirationDays 过期天数，默认30天
   */
  async saveFileInfo(
    fileData: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
      path: string;
    },
    userId: string,
    type: FileType = FileType.OTHER,
    isPublic: boolean = false,
    expirationDays: number = this.DEFAULT_EXPIRATION_DAYS
  ): Promise<File> {
    try {
      // 计算过期时间
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expirationDays);
      
      const file = this.fileRepository.create({
        filename: fileData.filename,
        originalname: fileData.originalname,
        mimetype: fileData.mimetype,
        size: fileData.size,
        path: fileData.path,
        type,
        userId,
        url: `/uploads/${fileData.filename}`,
        isPublic,
        status: FileStatus.ACTIVE,
        expiresAt,
        accessCount: 0,
        lastAccessedAt: new Date()
      });

      return await this.fileRepository.save(file);
    } catch (error: any) {
      logger.error(`保存文件信息失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '保存文件信息失败');
    }
  }

  /**
   * 根据ID获取文件
   * @param id 文件ID
   * @param updateAccess 是否更新访问记录
   */
  async getFileById(id: string, updateAccess: boolean = true): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new ApiError(HttpStatus.NOT_FOUND, '文件不存在');
    }
    
    // 检查文件是否过期
    if (file.status === FileStatus.EXPIRED || file.status === FileStatus.DELETED) {
      throw new ApiError(HttpStatus.NOT_FOUND, '文件已过期或已删除');
    }
    
    if (file.expiresAt && file.expiresAt < new Date()) {
      // 标记文件为过期
      file.status = FileStatus.EXPIRED;
      await this.fileRepository.save(file);
      throw new ApiError(HttpStatus.NOT_FOUND, '文件已过期');
    }
    
    // 更新访问记录
    if (updateAccess) {
      file.accessCount += 1;
      file.lastAccessedAt = new Date();
      await this.fileRepository.save(file);
    }
    
    return file;
  }

  /**
   * 查询文件列表
   * @param queryDto 查询条件
   * @param page 页码
   * @param limit 每页数量
   */
  async findFiles(queryDto: FileQueryDto, page: number = 1, limit: number = 20) {
    const query = this.repository.createQueryBuilder('file');

    if (queryDto.type) {
      query.andWhere('file.type = :type', { type: queryDto.type });
    }

    if (queryDto.userId) {
      query.andWhere('file.userId = :userId', { userId: queryDto.userId });
    }

    if (queryDto.filename) {
      query.andWhere('file.filename LIKE :filename', { filename: `%${queryDto.filename}%` });
    }

    query.orderBy('file.createdAt', 'DESC');

    const total = await query.getCount();
    const pages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    query.skip(skip).take(limit);

    const files = await query.getMany();

    return {
      items: files,
      meta: {
        total,
        page,
        limit,
        pages
      }
    };
  }

  /**
   * 获取用户上传的文件列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   */
  async findUserFiles(userId: string, page: number = 1, limit: number = 20) {
    return this.findFiles({ userId }, page, limit);
  }

  /**
   * 更新文件信息
   * @param id 文件ID
   * @param userId 用户ID
   * @param updateDto 更新数据
   */
  async updateFile(id: string, userId: string, updateDto: FileUpdateDto): Promise<File> {
    const file = await this.getFileById(id);

    if (file.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您无权修改此文件');
    }

    Object.assign(file, updateDto);
    return await this.repository.save(file);
  }

  /**
   * 删除文件
   * @param id 文件ID
   * @param userId 用户ID
   * @param forceDelete 是否强制删除物理文件
   */
  async deleteFile(id: string, userId: string, forceDelete: boolean = false): Promise<void> {
    const file = await this.getFileById(id, false);

    if (file.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您无权删除此文件');
    }

    try {
      if (forceDelete) {
        // 删除物理文件
        const filePath = path.join(this.uploadDir, file.filename);
        if (fs.existsSync(filePath)) {
          await unlinkAsync(filePath);
          logger.info(`物理文件删除成功: ${filePath}`);
        }

        // 删除数据库记录
        await this.fileRepository.remove(file);
        logger.info(`文件记录完全删除: ${id}`);
      } else {
        // 标记为已删除状态，保留数据库记录
        file.status = FileStatus.DELETED;
        await this.fileRepository.save(file);
        logger.info(`文件标记为已删除: ${id}`);
      }
    } catch (error: any) {
      logger.error(`删除文件失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '删除文件失败');
    }
  }

  /**
   * 根据文件类型生成唯一文件名
   * @param originalname 原始文件名
   */
  generateUniqueFilename(originalname: string): string {
    const ext = path.extname(originalname);
    return `${uuidv4()}${ext}`;
  }

  /**
   * 检查文件类型是否允许
   * @param mimetype 文件MIME类型
   * @param allowedTypes 允许的MIME类型数组
   */
  isFileTypeAllowed(mimetype: string, allowedTypes: string[]): boolean {
    return allowedTypes.includes(mimetype);
  }

  /**
   * 检查文件大小是否超过限制
   * @param size 文件大小（字节）
   * @param maxSize 最大允许大小（字节）
   */
  isFileSizeAllowed(size: number, maxSize: number): boolean {
    return size <= maxSize;
  }

  /**
   * 根据MIME类型判断文件类型
   * @param mimetype 文件MIME类型
   */
  determineFileType(mimetype: string): FileType {
    if (mimetype.startsWith('image/')) {
      return FileType.IMAGE;
    } else if (
      mimetype === 'application/pdf' ||
      mimetype === 'application/msword' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimetype === 'application/vnd.ms-excel' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      mimetype === 'application/vnd.ms-powerpoint' ||
      mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      mimetype === 'text/plain'
    ) {
      return FileType.DOCUMENT;
    } else if (mimetype.startsWith('audio/')) {
      return FileType.AUDIO;
    } else if (mimetype.startsWith('video/')) {
      return FileType.VIDEO;
    } else if (
      mimetype === 'application/zip' ||
      mimetype === 'application/x-rar-compressed' ||
      mimetype === 'application/x-7z-compressed' ||
      mimetype === 'application/x-tar' ||
      mimetype === 'application/gzip'
    ) {
      return FileType.ARCHIVE;
    } else {
      return FileType.OTHER;
    }
  }

  /**
   * 清理过期文件
   * @param dryRun 如果为true，只返回要清理的文件列表而不实际删除
   * @returns 清理的文件数量
   */
  async cleanupExpiredFiles(dryRun: boolean = false): Promise<{ count: number; files: File[] }> {
    try {
      // 查找已过期的文件
      const now = new Date();
      const expiredFiles = await this.fileRepository.find({
        where: [
          { expiresAt: LessThan(now), status: FileStatus.ACTIVE },
          { status: FileStatus.DELETED }
        ]
      });
      
      if (dryRun) {
        return { count: expiredFiles.length, files: expiredFiles };
      }
      
      let deletedCount = 0;
      
      for (const file of expiredFiles) {
        try {
          // 删除物理文件
          const filePath = path.join(this.uploadDir, file.filename);
          if (fs.existsSync(filePath)) {
            await unlinkAsync(filePath);
            logger.info(`过期文件删除成功: ${filePath}`);
          }
          
          // 如果是已删除状态，删除数据库记录
          if (file.status === FileStatus.DELETED) {
            await this.fileRepository.remove(file);
            logger.info(`已删除文件记录清理成功: ${file.id}`);
          } else {
            // 如果是过期状态，更新状态
            file.status = FileStatus.EXPIRED;
            await this.fileRepository.save(file);
            logger.info(`文件标记为过期: ${file.id}`);
          }
          
          deletedCount++;
        } catch (error: any) {
          logger.error(`清理文件失败 ${file.id}: ${error.message}`);
        }
      }
      
      return { count: deletedCount, files: expiredFiles };
    } catch (error: any) {
      logger.error(`清理过期文件失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '清理过期文件失败');
    }
  }
  
  /**
   * 清理长时间未访问的文件
   * @param days 未访问天数
   * @param dryRun 如果为true，只返回要清理的文件列表而不实际删除
   * @returns 清理的文件数量
   */
  async cleanupUnusedFiles(days: number = 90, dryRun: boolean = false): Promise<{ count: number; files: File[] }> {
    try {
      // 计算日期阈值
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      
      // 查找长时间未访问的文件
      const unusedFiles = await this.fileRepository.find({
        where: [
          { lastAccessedAt: LessThan(threshold), status: FileStatus.ACTIVE },
          { lastAccessedAt: IsNull(), createdAt: LessThan(threshold), status: FileStatus.ACTIVE }
        ]
      });
      
      if (dryRun) {
        return { count: unusedFiles.length, files: unusedFiles };
      }
      
      let updatedCount = 0;
      
      for (const file of unusedFiles) {
        try {
          // 更新文件过期时间为当前时间
          file.expiresAt = new Date();
          file.status = FileStatus.EXPIRED;
          await this.fileRepository.save(file);
          logger.info(`未使用文件标记为过期: ${file.id}`);
          
          updatedCount++;
        } catch (error: any) {
          logger.error(`标记未使用文件失败 ${file.id}: ${error.message}`);
        }
      }
      
      return { count: updatedCount, files: unusedFiles };
    } catch (error: any) {
      logger.error(`清理未使用文件失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '清理未使用文件失败');
    }
  }
  
  /**
   * 更新文件过期时间
   * @param id 文件ID
   * @param userId 用户ID
   * @param expirationDays 过期天数
   */
  async updateFileExpiration(id: string, userId: string, expirationDays: number): Promise<File> {
    const file = await this.getFileById(id, false);
    
    if (file.userId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您无权更新此文件');
    }
    
    // 计算新的过期时间
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);
    
    file.expiresAt = expiresAt;
    file.status = FileStatus.ACTIVE; // 重新激活文件
    
    return await this.fileRepository.save(file);
  }
  
  /**
   * 获取文件统计信息
   * @returns 文件统计信息
   */
  async getFileStats(): Promise<any> {
    try {
      // 总文件数量
      const totalCount = await this.fileRepository.count();
      
      // 按状态统计
      const statusStats = await this.fileRepository
        .createQueryBuilder('file')
        .select('file.status', 'status')
        .addSelect('COUNT(file.id)', 'count')
        .groupBy('file.status')
        .getRawMany();
      
      // 按类型统计
      const typeStats = await this.fileRepository
        .createQueryBuilder('file')
        .select('file.type', 'type')
        .addSelect('COUNT(file.id)', 'count')
        .groupBy('file.type')
        .getRawMany();
      
      // 总存储大小
      const sizeResult = await this.fileRepository
        .createQueryBuilder('file')
        .select('SUM(file.size)', 'totalSize')
        .getRawOne();
      
      const totalSize = parseInt(sizeResult?.totalSize || '0');
      
      // 最近一周添加的文件数量
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      const recentCount = await this.fileRepository.count({
        where: { createdAt: MoreThanOrEqual(oneWeekAgo) }
      });
      
      // 即将过期的文件数量
      const now = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const expiringCount = await this.fileRepository.count({
        where: {
          expiresAt: Between(now, nextWeek),
          status: FileStatus.ACTIVE
        }
      });
      
      return {
        totalCount,
        totalSize,
        formattedSize: this.formatFileSize(totalSize),
        statusStats,
        typeStats,
        recentCount,
        expiringCount
      };
    } catch (error: any) {
      logger.error(`获取文件统计信息失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '获取文件统计信息失败');
    }
  }
  
  /**
   * 格式化文件大小
   * @param bytes 字节数
   * @returns 格式化后的文件大小字符串
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
