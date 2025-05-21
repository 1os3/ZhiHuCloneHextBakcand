import { Repository, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Message, MessageStatus } from '../models/message.entity';
import { User } from '../models/user.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreateMessageDto, UpdateMessageStatusDto, MessageQueryDto, DeleteMessageDto } from '../dtos/message.dto';
import { logger } from '../config/logger.config';

/**
 * 私信服务类，处理私信相关的业务逻辑
 */
export class MessageService extends BaseService<Message> {
  private readonly messageRepository: Repository<Message>;
  private readonly userRepository: Repository<User>;

  constructor() {
    const messageRepository = AppDataSource.getRepository(Message);
    super(messageRepository);
    this.messageRepository = messageRepository;
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * 发送私信
   * @param senderId 发送者ID
   * @param createDto 创建数据
   * @returns 创建的私信
   */
  async sendMessage(senderId: string, createDto: CreateMessageDto): Promise<Message> {
    // 查找发送者
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });

    if (!sender) {
      throw new ApiError(HttpStatus.NOT_FOUND, '发送者不存在');
    }

    // 查找接收者
    const recipient = await this.userRepository.findOne({
      where: { id: createDto.recipientId },
    });

    if (!recipient) {
      throw new ApiError(HttpStatus.NOT_FOUND, '接收者不存在');
    }

    // 不能给自己发私信
    if (senderId === createDto.recipientId) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '不能给自己发私信');
    }

    // 创建私信
    const newMessage = this.messageRepository.create({
      ...createDto,
      sender,
      senderId,
      recipient,
      recipientId: createDto.recipientId,
      status: MessageStatus.SENT,
    } as DeepPartial<Message>);

    const savedMessage = await this.messageRepository.save(newMessage);
    
    logger.info(`新私信发送成功: ${savedMessage.id} from ${sender.username} to ${recipient.username}`);
    
    return this.findById(savedMessage.id, ['sender', 'recipient']);
  }

  /**
   * 获取私信详情
   * @param messageId 私信ID
   * @param userId 用户ID
   * @returns 私信详情
   */
  async getMessage(messageId: string, userId: string): Promise<Message> {
    // 查找私信
    const message = await this.findById(messageId, ['sender', 'recipient']);
    
    // 检查权限
    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限查看此私信');
    }
    
    // 如果是接收者查看，且私信未读，则标记为已读
    if (message.recipientId === userId && message.status === MessageStatus.SENT) {
      message.status = MessageStatus.READ;
      message.readAt = new Date();
      await this.messageRepository.save(message);
    }
    
    return message;
  }

  /**
   * 更新私信状态
   * @param messageId 私信ID
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新后的私信
   */
  async updateMessageStatus(messageId: string, userId: string, updateDto: UpdateMessageStatusDto): Promise<Message> {
    // 查找私信
    const message = await this.findById(messageId);
    
    // 检查权限
    if (message.recipientId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限更新此私信状态');
    }
    
    // 更新状态
    message.status = updateDto.status;
    
    // 如果标记为已读，设置读取时间
    if (updateDto.status === MessageStatus.READ) {
      message.readAt = new Date();
    }
    
    await this.messageRepository.save(message);
    
    return this.findById(messageId, ['sender', 'recipient']);
  }

  /**
   * 批量更新私信状态
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新结果
   */
  async batchUpdateMessageStatus(userId: string, updateDto: UpdateMessageStatusDto): Promise<{ success: boolean; count: number }> {
    const { ids, status } = updateDto;
    
    // 如果没有指定ID，则更新所有未读私信
    let queryBuilder = this.messageRepository.createQueryBuilder('message')
      .where('message.recipientId = :userId', { userId });
    
    if (ids && ids.length > 0) {
      queryBuilder = queryBuilder.andWhere('message.id IN (:...ids)', { ids });
    } else {
      queryBuilder = queryBuilder.andWhere('message.status = :currentStatus', { currentStatus: MessageStatus.SENT });
    }
    
    const messages = await queryBuilder.getMany();
    
    if (messages.length === 0) {
      return { success: true, count: 0 };
    }
    
    // 批量更新状态
    const now = new Date();
    for (const message of messages) {
      message.status = status;
      
      // 如果标记为已读，设置读取时间
      if (status === MessageStatus.READ) {
        message.readAt = now;
      }
    }
    
    await this.messageRepository.save(messages);
    
    return { success: true, count: messages.length };
  }

  /**
   * 删除私信
   * @param messageId 私信ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // 查找私信
    const message = await this.findById(messageId);
    
    // 检查权限
    if (message.senderId !== userId && message.recipientId !== userId) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限删除此私信');
    }
    
    // 软删除（标记为已删除）
    message.isDeleted = true;
    await this.messageRepository.save(message);
    
    return true;
  }

  /**
   * 批量删除私信
   * @param userId 用户ID
   * @param deleteDto 删除数据
   * @returns 删除结果
   */
  async batchDeleteMessages(userId: string, deleteDto: DeleteMessageDto): Promise<{ success: boolean; count: number }> {
    const { ids } = deleteDto;
    
    // 查询要删除的私信
    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .where('(message.senderId = :userId OR message.recipientId = :userId)', { userId })
      .andWhere('message.id IN (:...ids)', { ids });
    
    const messages = await queryBuilder.getMany();
    
    if (messages.length === 0) {
      return { success: true, count: 0 };
    }
    
    // 批量标记为已删除
    for (const message of messages) {
      message.isDeleted = true;
    }
    
    await this.messageRepository.save(messages);
    
    return { success: true, count: messages.length };
  }

  /**
   * 查询私信列表
   * @param userId 用户ID
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页私信列表
   */
  async findMessages(
    userId: string,
    queryDto: MessageQueryDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Message[]; total: number; page: number; limit: number; unreadCount: number }> {
    const { status, contactId } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.messageRepository.createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .where('(message.senderId = :userId OR message.recipientId = :userId)', { userId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false });
    
    // 状态过滤
    if (status) {
      queryBuilder.andWhere('message.status = :status', { status });
    }
    
    // 联系人过滤
    if (contactId) {
      queryBuilder.andWhere('(message.senderId = :contactId OR message.recipientId = :contactId)', { contactId });
    }
    
    // 排序（按创建时间降序）
    queryBuilder.orderBy('message.createdAt', 'DESC');
    
    // 计算未读私信数量
    const unreadCount = await this.messageRepository.count({
      where: {
        recipientId: userId,
        status: MessageStatus.SENT,
        isDeleted: false,
      },
    });
    
    // 分页
    const total = await queryBuilder.getCount();
    const messages = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: messages,
      total,
      page,
      limit,
      unreadCount,
    };
  }

  /**
   * 获取会话列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页会话列表
   */
  async getConversations(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
    // 获取与用户相关的所有联系人
    const contactsQuery = `
      SELECT DISTINCT
        CASE
          WHEN m.sender_id = :userId THEN m.recipient_id
          ELSE m.sender_id
        END AS contact_id
      FROM messages m
      WHERE (m.sender_id = :userId OR m.recipient_id = :userId)
        AND m.is_deleted = false
    `;
    
    const contactsCountQuery = `
      SELECT COUNT(DISTINCT
        CASE
          WHEN m.sender_id = :userId THEN m.recipient_id
          ELSE m.sender_id
        END) as count
      FROM messages m
      WHERE (m.sender_id = :userId OR m.recipient_id = :userId)
        AND m.is_deleted = false
    `;
    
    const contactsResult = await this.messageRepository.query(contactsQuery, [userId]);
    const countResult = await this.messageRepository.query(contactsCountQuery, [userId]);
    
    const total = parseInt(countResult[0].count, 10);
    
    if (contactsResult.length === 0) {
      return {
        items: [],
        total: 0,
        page,
        limit,
      };
    }
    
    // 分页处理联系人
    const paginatedContacts = contactsResult.slice((page - 1) * limit, page * limit);
    
    // 获取每个联系人的最新消息和未读消息数量
    const conversations = [];
    
    for (const contact of paginatedContacts) {
      const contactId = contact.contact_id;
      
      // 获取联系人信息
      const contactUser = await this.userRepository.findOne({
        where: { id: contactId },
      });
      
      if (!contactUser) continue;
      
      // 获取最新消息
      const latestMessage = await this.messageRepository.findOne({
        where: [
          { senderId: userId, recipientId: contactId, isDeleted: false },
          { senderId: contactId, recipientId: userId, isDeleted: false },
        ],
        order: { createdAt: 'DESC' },
      });
      
      // 获取未读消息数量
      const unreadCount = await this.messageRepository.count({
        where: {
          senderId: contactId,
          recipientId: userId,
          status: MessageStatus.SENT,
          isDeleted: false,
        },
      });
      
      conversations.push({
        contact: {
          id: contactUser.id,
          username: contactUser.username,
          nickname: contactUser.nickname,
          avatar: contactUser.avatar,
        },
        latestMessage: latestMessage ? {
          id: latestMessage.id,
          content: latestMessage.content,
          createdAt: latestMessage.createdAt,
          senderId: latestMessage.senderId,
        } : null,
        unreadCount,
      } as any);
    }
    
    // 按最新消息时间排序
    conversations.sort((a, b) => {
      if (!a.latestMessage) return 1;
      if (!b.latestMessage) return -1;
      return new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime();
    });
    
    return {
      items: conversations,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取未读私信数量
   * @param userId 用户ID
   * @returns 未读私信数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    const count = await this.messageRepository.count({
      where: {
        recipientId: userId,
        status: MessageStatus.SENT,
        isDeleted: false,
      },
    });
    
    return count;
  }
}
