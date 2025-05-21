import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { NotificationService } from '../services/notification.service';
import { 
  NotificationQueryDto,
  UpdateNotificationDto
} from '../dtos/notification.dto';
import { logger } from '../utils/logger.util';

/**
 * 通知控制器，处理通知相关的HTTP请求
 */
export class NotificationController extends BaseController {
  private readonly notificationService: NotificationService;

  constructor() {
    super();
    this.notificationService = new NotificationService();
  }

  /**
   * 获取用户的通知列表
   * @route GET /api/notifications
   */
  getNotifications = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as NotificationQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.notificationService.findNotifications(userId, queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取通知详情
   * @route GET /api/notifications/:id
   */
  getNotification = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const notification = await this.notificationService.getNotification(id, userId);
    return this.success(res, notification);
  });

  /**
   * 标记通知为已读
   * @route PUT /api/notifications/:id
   */
  markAsRead = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateDto = req.body as UpdateNotificationDto;
    const updatedNotification = await this.notificationService.updateNotification(id, userId, updateDto);
    logger.info(`通知标记为已读: ${id}`);
    return this.success(res, updatedNotification);
  });

  /**
   * 批量标记通知为已读
   * @route PUT /api/notifications/batch-update
   */
  batchMarkAsRead = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const updateDto = req.body as UpdateNotificationDto;
    const result = await this.notificationService.batchUpdateNotifications(userId, updateDto);
    logger.info(`批量标记通知为已读: ${result.count}条`);
    return this.success(res, result);
  });

  /**
   * 删除通知
   * @route DELETE /api/notifications/:id
   */
  deleteNotification = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    await this.notificationService.deleteNotification(id, userId);
    logger.info(`通知删除成功: ${id}`);
    return this.success(res, { success: true });
  });

  /**
   * 获取未读通知数量
   * @route GET /api/notifications/unread-count
   */
  getUnreadCount = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const count = await this.notificationService.getUnreadCount(userId);
    return this.success(res, { count });
  });
}
