import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { CommentService } from '../services/comment.service';
import { 
  CreateCommentDto,
  UpdateCommentDto,
  CommentQueryDto,
  LikeCommentDto
} from '../dtos/comment.dto';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../utils/logger.util';

/**
 * 评论控制器，处理评论相关的HTTP请求
 */
export class CommentController extends BaseController {
  private readonly commentService: CommentService;

  constructor() {
    super();
    this.commentService = new CommentService();
  }

  /**
   * 创建评论
   * @route POST /api/posts/:postId/comments
   */
  createComment = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { postId } = req.params;
    const createDto = req.body as CreateCommentDto;
    createDto.postId = postId;
    
    const comment = await this.commentService.createComment(userId, createDto);
    logger.info(`评论创建成功: ${comment.id}, 帖子: ${postId}`);
    return this.success(res, comment, HttpStatus.CREATED);
  });

  /**
   * 创建回复评论
   * @route POST /api/comments/:parentId/replies
   */
  createReply = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { parentId } = req.params;
    const createDto = req.body as CreateCommentDto;
    createDto.parentId = parentId;
    
    const comment = await this.commentService.createComment(userId, createDto);
    logger.info(`回复评论创建成功: ${comment.id}, 父评论: ${parentId}`);
    return this.success(res, comment, HttpStatus.CREATED);
  });

  /**
   * 获取评论详情
   * @route GET /api/comments/:id
   */
  getComment = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const comment = await this.commentService.getCommentDetails(id);
    return this.success(res, comment);
  });

  /**
   * 更新评论
   * @route PUT /api/comments/:id
   */
  updateComment = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateDto = req.body as UpdateCommentDto;
    const updatedComment = await this.commentService.updateComment(id, userId, updateDto);
    logger.info(`评论更新成功: ${id}`);
    return this.success(res, updatedComment);
  });

  /**
   * 删除评论
   * @route DELETE /api/comments/:id
   */
  deleteComment = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    await this.commentService.deleteComment(id, userId);
    logger.info(`评论删除成功: ${id}`);
    return this.success(res, { success: true });
  });

  /**
   * 获取帖子的评论列表
   * @route GET /api/posts/:postId/comments
   */
  getPostComments = this.asyncHandler(async (req: Request, res: Response) => {
    const { postId } = req.params;
    const { page, limit, ...queryParams } = req.query;
    const queryDto = { ...queryParams, postId } as unknown as CommentQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.commentService.findComments(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取评论的回复列表
   * @route GET /api/comments/:parentId/replies
   */
  getCommentReplies = this.asyncHandler(async (req: Request, res: Response) => {
    const { parentId } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.commentService.findReplies(parentId, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取用户的评论
   * @route GET /api/users/:userId/comments
   */
  getUserComments = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.commentService.findUserComments(userId, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 点赞评论
   * @route POST /api/comments/:id/like
   */
  likeComment = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const likeDto = req.body as LikeCommentDto;
    const result = await this.commentService.likeComment(id, userId);
    logger.info(`评论点赞状态更新: ${id}, 用户: ${userId}, 点赞: ${likeDto.like}`);
    return this.success(res, result);
  });
}
