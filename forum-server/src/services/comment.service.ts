import { Repository, IsNull, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Comment } from '../models/comment.entity';
import { Post } from '../models/post.entity';
import { User, UserRole } from '../models/user.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from '../dtos/comment.dto';
import { logger } from '../config/logger.config';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.entity';

/**
 * 评论服务类，处理评论相关的业务逻辑
 */
export class CommentService extends BaseService<Comment> {
  private readonly commentRepository: Repository<Comment>;
  private readonly userRepository: Repository<User>;
  private readonly postRepository: Repository<Post>;
  private readonly notificationService: NotificationService;

  constructor() {
    const commentRepository = AppDataSource.getRepository(Comment);
    super(commentRepository);
    this.commentRepository = commentRepository;
    this.userRepository = AppDataSource.getRepository(User);
    this.postRepository = AppDataSource.getRepository(Post);
    this.notificationService = new NotificationService();
  }

  /**
   * 创建评论
   * @param userId 用户ID
   * @param createDto 创建数据
   * @returns 创建的评论
   */
  async createComment(userId: string, createDto: CreateCommentDto): Promise<Comment> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 查找帖子
    const post = await this.postRepository.findOne({
      where: { id: createDto.postId },
      relations: ['author'],
    });

    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, '帖子不存在');
    }

    // 检查帖子状态
    if (post.status !== 'published') {
      throw new ApiError(HttpStatus.BAD_REQUEST, '该帖子不可评论');
    }

    // 如果有父评论，检查父评论是否存在
    let parentComment: Comment | null = null;
    if (createDto.parentId) {
      parentComment = await this.commentRepository.findOne({
        where: { id: createDto.parentId },
        relations: ['author'],
      });

      if (!parentComment) {
        throw new ApiError(HttpStatus.NOT_FOUND, '父评论不存在');
      }

      // 检查父评论是否属于同一帖子
      if (parentComment.postId !== createDto.postId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '父评论不属于该帖子');
      }
    }

    // 如果有引用评论，检查引用评论是否存在
    let quotedComment: Comment | null = null;
    if (createDto.quotedCommentId) {
      quotedComment = await this.commentRepository.findOne({
        where: { id: createDto.quotedCommentId },
        relations: ['author'],
      });

      if (!quotedComment) {
        throw new ApiError(HttpStatus.NOT_FOUND, '引用评论不存在');
      }

      // 检查引用评论是否属于同一帖子
      if (quotedComment.postId !== createDto.postId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '引用评论不属于该帖子');
      }
    }

    // 创建评论
    const newComment = this.commentRepository.create({
      ...createDto,
      author: user,
      authorId: userId,
      post,
      postId: post.id,
      parent: parentComment,
      quotedComment,
    } as DeepPartial<Comment>);

    const savedComment = await this.commentRepository.save(newComment);
    
    // 更新帖子评论计数
    post.commentCount += 1;
    await this.postRepository.save(post);
    
    logger.info(`新评论创建成功: ${savedComment.id} by ${user.username} on post ${post.id}`);
    
    // 创建通知
    try {
      // 如果是回复评论，通知评论作者
      if (parentComment && parentComment.authorId !== userId) {
        await this.notificationService.createNotification({
          type: NotificationType.REPLY,
          message: `${user.username} 回复了你的评论`,
          recipientId: parentComment.authorId,
          senderId: userId,
          postId: post.id,
          commentId: savedComment.id,
          link: `/posts/${post.id}#comment-${savedComment.id}`,
        });
      }
      // 如果是引用评论，通知被引用评论作者
      else if (quotedComment && quotedComment.authorId !== userId) {
        await this.notificationService.createNotification({
          type: NotificationType.REPLY,
          message: `${user.username} 引用了你的评论`,
          recipientId: quotedComment.authorId,
          senderId: userId,
          postId: post.id,
          commentId: savedComment.id,
          link: `/posts/${post.id}#comment-${savedComment.id}`,
        });
      }
      // 如果是直接评论帖子，通知帖子作者
      else if (post.authorId !== userId) {
        await this.notificationService.createNotification({
          type: NotificationType.COMMENT,
          message: `${user.username} 评论了你的帖子 "${post.title}"`,
          recipientId: post.authorId,
          senderId: userId,
          postId: post.id,
          commentId: savedComment.id,
          link: `/posts/${post.id}#comment-${savedComment.id}`,
        });
      }
    } catch (error) {
      // 通知创建失败不影响评论创建
      logger.error('创建评论通知失败', { error });
    }
    
    return this.findById(savedComment.id, ['author', 'parent', 'quotedComment']);
  }

  /**
   * 更新评论
   * @param commentId 评论ID
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新后的评论
   */
  async updateComment(commentId: string, userId: string, updateDto: UpdateCommentDto): Promise<Comment> {
    // 查找评论
    const comment = await this.findById(commentId, ['author']);
    
    // 检查权限
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 只有作者或管理员/版主可以编辑评论
    const isAuthor = comment.authorId === userId;
    const isModerator = user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;
    
    if (!isAuthor && !isModerator) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限编辑此评论');
    }
    
    // 更新评论
    const updatedComment = await this.update(commentId, updateDto);
    
    return this.findById(commentId, ['author', 'parent', 'quotedComment']);
  }

  /**
   * 删除评论（软删除）
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    // 查找评论
    const comment = await this.findById(commentId, ['author', 'post']);
    
    // 检查权限
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 只有作者或管理员/版主可以删除评论
    const isAuthor = comment.authorId === userId;
    const isModerator = user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;
    
    if (!isAuthor && !isModerator) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限删除此评论');
    }
    
    // 软删除评论（将内容替换为"该评论已被删除"，并标记为已删除）
    comment.content = '该评论已被删除';
    comment.isDeleted = true;
    await this.commentRepository.save(comment);
    
    return true;
  }

  /**
   * 查询评论列表
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页评论列表
   */
  async findComments(
    queryDto: CommentQueryDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Comment[]; total: number; page: number; limit: number }> {
    const { postId, authorId, parentId, isDeleted } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .leftJoinAndSelect('comment.parent', 'parent')
      .leftJoinAndSelect('comment.quotedComment', 'quotedComment')
      .leftJoinAndSelect('quotedComment.author', 'quotedAuthor');
    
    // 帖子过滤
    if (postId) {
      queryBuilder.andWhere('comment.postId = :postId', { postId });
    }
    
    // 作者过滤
    if (authorId) {
      queryBuilder.andWhere('comment.authorId = :authorId', { authorId });
    }
    
    // 父评论过滤
    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('comment.parentId IS NULL');
      } else {
        queryBuilder.andWhere('comment.parentId = :parentId', { parentId });
      }
    }
    
    // 删除状态过滤
    if (isDeleted !== undefined) {
      queryBuilder.andWhere('comment.isDeleted = :isDeleted', { isDeleted });
    }
    
    // 排序（按创建时间升序）
    queryBuilder.orderBy('comment.createdAt', 'ASC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const comments = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: comments,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取帖子评论树
   * @param postId 帖子ID
   * @returns 评论树
   */
  async getPostCommentTree(postId: string): Promise<Comment[]> {
    // 查找帖子
    const post = await this.postRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new ApiError(HttpStatus.NOT_FOUND, '帖子不存在');
    }
    
    // 查询顶级评论
    const topLevelComments = await this.commentRepository.find({
      where: {
        postId,
        parentId: IsNull(),
      },
      relations: ['author', 'replies', 'replies.author', 'quotedComment', 'quotedComment.author'],
      order: {
        createdAt: 'ASC',
        replies: {
          createdAt: 'ASC',
        },
      },
    });
    
    return topLevelComments;
  }

  /**
   * 点赞评论
   * @param commentId 评论ID
   * @param userId 用户ID
   * @returns 点赞结果
   */
  async likeComment(commentId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    // 查找评论
    const comment = await this.findById(commentId, ['likedBy', 'author']);
    
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }
    
    // 检查用户是否已点赞
    const isLiked = comment.likedBy.some(u => u.id === userId);
    
    if (isLiked) {
      // 取消点赞
      comment.likedBy = comment.likedBy.filter(u => u.id !== userId);
      comment.likeCount = Math.max(0, comment.likeCount - 1);
    } else {
      // 添加点赞
      comment.likedBy.push(user);
      comment.likeCount += 1;
      
      // 创建点赞通知
      if (comment.authorId !== userId) {
        try {
          await this.notificationService.createNotification({
            type: NotificationType.LIKE,
            message: `${user.username} 赞了你的评论`,
            recipientId: comment.authorId,
            senderId: userId,
            postId: comment.postId,
            commentId: comment.id,
            link: `/posts/${comment.postId}#comment-${comment.id}`,
          });
        } catch (error) {
          // 通知创建失败不影响点赞操作
          logger.error('创建点赞通知失败', { error });
        }
      }
    }
    
    // 保存更新
    await this.commentRepository.save(comment);
    
    return {
      liked: !isLiked,
      likeCount: comment.likeCount,
    };
  }

  /**
   * 获取评论详情
   * @param commentId 评论ID
   * @returns 评论详情
   */
  async getCommentDetails(commentId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
      relations: ['author', 'post', 'parent', 'quotedComment'],
    });

    if (!comment) {
      throw new ApiError(HttpStatus.NOT_FOUND, '评论不存在');
    }

    return comment;
  }

  /**
   * 获取评论的回复列表
   * @param parentId 父评论ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页回复列表
   */
  async findReplies(
    parentId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Comment[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await this.commentRepository.findAndCount({
      where: { parentId, isDeleted: false },
      relations: ['author'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取用户评论列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页评论列表
   */
  async findUserComments(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: Comment[]; total: number; page: number; limit: number }> {
    // 构建查询条件
    const queryBuilder = this.commentRepository.createQueryBuilder('comment')
      .leftJoinAndSelect('comment.post', 'post')
      .leftJoinAndSelect('post.author', 'postAuthor')
      .leftJoinAndSelect('comment.parent', 'parent')
      .leftJoinAndSelect('parent.author', 'parentAuthor')
      .where('comment.authorId = :userId', { userId })
      .andWhere('comment.isDeleted = :isDeleted', { isDeleted: false });
    
    // 排序（按创建时间降序）
    queryBuilder.orderBy('comment.createdAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const comments = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: comments,
      total,
      page,
      limit,
    };
  }
}
