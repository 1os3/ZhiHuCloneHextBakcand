import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { MessageService } from '../services/message.service';
import { 
  CreateMessageDto,
  UpdateMessageStatusDto,
  MessageQueryDto,
  DeleteMessageDto
} from '../dtos/message.dto';
import { logger } from '../utils/logger.util';
import { HttpStatus } from '../utils/error.util';

/**
 * 私信控制器，处理私信相关的HTTP请求
 */
export class MessageController extends BaseController {
  private readonly messageService: MessageService;

  constructor() {
    super();
    this.messageService = new MessageService();
  }

  /**
   * 发送私信
   * @route POST /api/messages
   */
  sendMessage = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const createDto = req.body as CreateMessageDto;
    const message = await this.messageService.sendMessage(userId, createDto);
    logger.info(`私信发送成功: ${message.id}, 接收者: ${createDto.recipientId}`);
    return this.success(res, message, HttpStatus.CREATED);
  });

  /**
   * 获取私信详情
   * @route GET /api/messages/:id
   */
  getMessage = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const message = await this.messageService.getMessage(id, userId);
    return this.success(res, message);
  });

  /**
   * 更新私信状态
   * @route PUT /api/messages/:id
   */
  updateMessageStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateDto = req.body as UpdateMessageStatusDto;
    const updatedMessage = await this.messageService.updateMessageStatus(id, userId, updateDto);
    logger.info(`私信状态更新成功: ${id}`);
    return this.success(res, updatedMessage);
  });

  /**
   * 批量更新私信状态
   * @route PUT /api/messages/batch-update
   */
  batchUpdateMessageStatus = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const updateDto = req.body as UpdateMessageStatusDto;
    const result = await this.messageService.batchUpdateMessageStatus(userId, updateDto);
    logger.info(`批量更新私信状态成功: ${result.count}条`);
    return this.success(res, result);
  });

  /**
   * 删除私信
   * @route DELETE /api/messages/:id
   */
  deleteMessage = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    await this.messageService.deleteMessage(id, userId);
    logger.info(`私信删除成功: ${id}`);
    return this.success(res, { success: true });
  });

  /**
   * 批量删除私信
   * @route DELETE /api/messages
   */
  batchDeleteMessages = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const deleteDto = req.body as DeleteMessageDto;
    const result = await this.messageService.batchDeleteMessages(userId, deleteDto);
    logger.info(`批量删除私信成功: ${result.count}条`);
    return this.success(res, result);
  });

  /**
   * 获取私信列表
   * @route GET /api/messages
   */
  getMessages = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as MessageQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.messageService.findMessages(userId, queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取会话列表
   * @route GET /api/messages/conversations
   */
  getConversations = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.messageService.getConversations(userId, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取未读私信数量
   * @route GET /api/messages/unread-count
   */
  getUnreadCount = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const count = await this.messageService.getUnreadCount(userId);
    return this.success(res, { count });
  });
}
