import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { FileService } from '../services/file.service';
import { FileQueryDto, FileUpdateDto } from '../dtos/file.dto';
import { HttpStatus, ApiError } from '../utils/error.util';
import { logger } from '../config/logger.config';
import * as path from 'path';
import * as fs from 'fs';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

/**
 * 文件上传控制器，处理文件上传相关的HTTP请求
 */
export class FileController extends BaseController {
  private readonly fileService: FileService;
  private readonly upload: multer.Multer;
  private readonly maxFileSize: number = 10 * 1024 * 1024; // 10MB
  private readonly allowedImageTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  private readonly allowedDocumentTypes: string[] = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  constructor() {
    super();
    this.fileService = new FileService();
    
    // 配置文件上传
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueFilename = this.fileService.generateUniqueFilename(file.originalname);
        cb(null, uniqueFilename);
      }
    });

    // 文件过滤器
    const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
      const allowedTypes = [...this.allowedImageTypes, ...this.allowedDocumentTypes];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('不支持的文件类型'));
      }
    };

    this.upload = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize
      }
    });
  }

  /**
   * 上传文件
   */
  uploadFile = this.asyncHandler(async (req: Request, res: Response) => {
    // 使用multer中间件处理文件上传
    this.upload.single('file')(req, res, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return this.error(res, HttpStatus.BAD_REQUEST, '文件大小超过限制');
          }
        }
        return this.error(res, HttpStatus.BAD_REQUEST, err.message);
      }

      if (!req.file) {
        return this.error(res, HttpStatus.BAD_REQUEST, '未上传文件');
      }

      const userId = req.user?.id;
      if (!userId) {
        return this.error(res, HttpStatus.UNAUTHORIZED, '未授权');
      }

      try {
        const fileType = this.fileService.determineFileType(req.file.mimetype);
        const file = await this.fileService.saveFileInfo(
          {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
          },
          userId,
          fileType
        );

        logger.info(`文件上传成功: ${file.id}, 用户: ${userId}`);
        return this.success(res, file, HttpStatus.CREATED);
      } catch (error: any) {
        logger.error(`文件上传失败: ${error.message}`);
        return this.error(res, HttpStatus.INTERNAL_SERVER_ERROR, '文件上传失败');
      }
    });
  });

  /**
   * 获取文件详情
   */
  getFile = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const file = await this.fileService.getFileById(id);
    return this.success(res, file);
  });

  /**
   * 获取文件列表
   */
  getFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as FileQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.fileService.findFiles(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取用户上传的文件列表
   */
  getUserFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.fileService.findUserFiles(userId, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 更新文件信息
   */
  updateFile = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return this.error(res, HttpStatus.UNAUTHORIZED, '未授权');
    }

    const updateDto = req.body as FileUpdateDto;
    const updatedFile = await this.fileService.updateFile(id, userId, updateDto);
    logger.info(`文件信息更新成功: ${id}`);
    return this.success(res, updatedFile);
  });

  /**
   * 删除文件
   */
  deleteFile = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return this.error(res, HttpStatus.UNAUTHORIZED, '未授权');
    }

    await this.fileService.deleteFile(id, userId);
    logger.info(`文件删除成功: ${id}`);
    return this.success(res, { success: true });
  });
}
