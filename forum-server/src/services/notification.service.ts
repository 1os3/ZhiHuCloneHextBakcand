import { Repository, In, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Notification, NotificationType } from '../models/notification.entity';
import { User } from '../models/user.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreateNotificationDto, NotificationQueryDto, UpdateNotificationDto } from '../dtos/notification.dto';
import { logger } from '../config/logger.config';

/**
 * 通知服务类，处理通知相关的业务逻辑
 */
export class NotificationService extends BaseService<Notification> {
  private readonly notificationRepository: Repository<Notification>;
  private readonly userRepository: Repository<User>;

  constructor() {
    const notificationRepository = AppDataSource.getRepository(Notification);
    super(notificationRepository);
    this.notificationRepository = notificationRepository;
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * 创建通知
   * @param createDto 创建数据
   * @returns 创建的通知
   */
  async createNotification(createDto: CreateNotificationDto): Promise<Notification> {
    // 检查接收者是否存在
    const recipient = await this.userRepository.findOne({
      where: { id: createDto.recipientId },
    });

    if (!recipient) {
      throw new ApiError(HttpStatus.NOT_FOUND, '接收者不存在');
    }

    // 如果有发送者，检查发送者是否存在
    let sender = null;
    if (createDto.senderId) {
      sender = await this.userRepository.findOne({
        where: { id: createDto.senderId },
      });

      if (!sender) {
        throw new ApiError(HttpStatus.NOT_FOUND, '发送者不存在');
      }
    }

    // 创建通知
    const newNotification = this.notificationRepository.create({
      ...createDto,
      recipient,
      sender,
    } as DeepPartial<Notification>);

    const savedNotification = await this.notificationRepository.save(newNotification);
    
    logger.info(`新通知创建成功: ${savedNotification.id} to ${recipient.username}`);
    
    return this.findById(savedNotification.id, ['recipient', 'sender']);
  }

  /**
   * 获取通知详情
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @returns 通知详情
   */
  async getNotification(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, recipientId: userId },
      relations: ['sender', 'recipient'],
    });

    if (!notification) {
      throw new ApiError(HttpStatus.NOT_FOUND, '通知不存在');
    }

    // 如果通知未读，标记为已读
    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  /**
   * 批量更新通知状态
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新结果
   */
  async batchUpdateNotifications(
    userId: string,
    updateDto: UpdateNotificationDto
  ): Promise<{ success: boolean; count: number }> {
    const { isRead, ids } = updateDto;
    
    // 构建查询条件
    const whereCondition: any = { recipientId: userId };
    
    // 如果提供了特定ID数组，则只更新这些通知
    if (ids && ids.length > 0) {
      whereCondition.id = In(ids);
    } else {
      // 如果没有提供特定ID，则更新所有未读通知
      whereCondition.isRead = false;
    }
    
    // 执行更新
    const updateResult = await this.notificationRepository.update(
      whereCondition,
      {
        isRead,
        readAt: isRead ? new Date() : undefined,
      }
    );
    
    return {
      success: true,
      count: updateResult.affected || 0,
    };
  }

  /**
   * 更新通知
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新后的通知
   */
  async updateNotification(notificationId: string, userId: string, updateDto: UpdateNotificationDto): Promise<Notification> {
    // 查找通知
    const notification = await this.findById(notificationId);
    
    // 检查权限
    if (notification.recipientId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限更新此通知');
    }
    
    // 更新通知
    const updatedNotification = await this.update(notificationId, updateDto);
    
    return this.findById(notificationId, ['recipient', 'sender']);
  }

  /**
   * 标记通知为已读
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @returns 更新后的通知
   */
  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    // 查找通知
    const notification = await this.findById(notificationId);
    
    // 检查权限
    if (notification.recipientId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限更新此通知');
    }
    
    // 标记为已读
    notification.isRead = true;
    notification.readAt = new Date();
    
    await this.notificationRepository.save(notification);
    
    return this.findById(notificationId, ['recipient', 'sender']);
  }

  /**
   * 批量标记通知为已读
   * @param userId 用户ID
   * @param notificationIds 通知ID数组，如果为空则标记所有通知
   * @returns 标记结果
   */
  async markMultipleAsRead(userId: string, notificationIds?: string[]): Promise<{ success: boolean; count: number }> {
    // 构建查询条件
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId })
      .andWhere('notification.isRead = :isRead', { isRead: false });
    
    // 如果指定了通知ID，则只标记这些通知
    if (notificationIds && notificationIds.length > 0) {
      queryBuilder.andWhere('notification.id IN (:...notificationIds)', { notificationIds });
    }
    
    // 查询要标记的通知
    const notifications = await queryBuilder.getMany();
    
    if (notifications.length === 0) {
      return { success: true, count: 0 };
    }
    
    // 批量标记为已读
    const now = new Date();
    for (const notification of notifications) {
      notification.isRead = true;
      notification.readAt = now;
    }
    
    await this.notificationRepository.save(notifications);
    
    return { success: true, count: notifications.length };
  }

  /**
   * 删除通知
   * @param notificationId 通知ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteNotification(notificationId: string, userId: string): Promise<boolean> {
    // 查找通知
    const notification = await this.findById(notificationId);
    
    // 检查权限
    if (notification.recipientId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限删除此通知');
    }
    
    // 删除通知
    await this.notificationRepository.remove(notification);
    
    return true;
  }

  /**
   * 批量删除通知
   * @param userId 用户ID
   * @param notificationIds 通知ID数组，如果为空则删除所有已读通知
   * @returns 删除结果
   */
  async deleteMultipleNotifications(userId: string, notificationIds?: string[]): Promise<{ success: boolean; count: number }> {
    // 构建查询条件
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.recipientId = :userId', { userId });
    
    // 如果指定了通知ID，则只删除这些通知
    if (notificationIds && notificationIds.length > 0) {
      queryBuilder.andWhere('notification.id IN (:...notificationIds)', { notificationIds });
    } else {
      // 默认只删除已读通知
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead: true });
    }
    
    // 查询要删除的通知
    const notifications = await queryBuilder.getMany();
    
    if (notifications.length === 0) {
      return { success: true, count: 0 };
    }
    
    // 批量删除通知
    await this.notificationRepository.remove(notifications);
    
    return { success: true, count: notifications.length };
  }

  /**
   * 查询通知列表
   * @param userId 用户ID
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页通知列表
   */
  async findNotifications(
    userId: string,
    queryDto: NotificationQueryDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Notification[]; total: number; page: number; limit: number; unreadCount: number }> {
    const { isRead, type } = queryDto;
    const startDate = queryDto.createdAfter;
    const endDate = queryDto.createdBefore;
    
    // 构建查询条件
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .leftJoinAndSelect('notification.sender', 'sender')
      .where('notification.recipientId = :userId', { userId });
    
    // 已读状态过滤
    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }
    
    // 通知类型过滤
    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }
    
    // 日期范围过滤
    if (startDate) {
      queryBuilder.andWhere('notification.createdAt >= :startDate', { startDate });
    }
    
    if (endDate) {
      queryBuilder.andWhere('notification.createdAt <= :endDate', { endDate });
    }
    
    // 排序（按创建时间降序）
    queryBuilder.orderBy('notification.createdAt', 'DESC');
    
    // 计算未读通知数量
    const unreadCount = await this.notificationRepository.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
    
    // 分页
    const total = await queryBuilder.getCount();
    const notifications = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: notifications,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  /**
   * 获取未读通知数量
   * @param userId 用户ID
   * @returns 未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.notificationRepository.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
    
    return count;
  }

  /**
   * 创建系统通知
   * @param message 通知消息
   * @param recipientIds 接收者ID数组
   * @param link 可选链接
   * @returns 创建结果
   */
  async createSystemNotification(
    message: string,
    recipientIds: string[],
    link?: string
  ): Promise<{ success: boolean; count: number }> {
    // 检查接收者是否存在
    const recipients = await this.userRepository.find({
      where: {
        id: In(recipientIds),
      },
    });

    if (recipients.length === 0) {
      throw new ApiError(HttpStatus.NOT_FOUND, '接收者不存在');
    }
    
    // 批量创建通知
    const notifications: Notification[] = [];
    
    for (const recipient of recipients) {
      const notification = this.notificationRepository.create({
        type: NotificationType.SYSTEM,
        message,
        recipient,
        recipientId: recipient.id,
        link,
      });
      
      notifications.push(notification);
    }
    
    await this.notificationRepository.save(notifications);
    
    logger.info(`系统通知创建成功: ${message} to ${recipients.length} users`);
    
    return { success: true, count: notifications.length };
  }
}


