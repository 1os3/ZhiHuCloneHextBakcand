import { Repository, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Report, ReportStatus, ReportType } from '../models/report.entity';
import { User, UserRole } from '../models/user.entity';
import { Post } from '../models/post.entity';
import { Comment } from '../models/comment.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreateReportDto, ReportQueryDto, ResolveReportDto } from '../dtos/report.dto';
import { logger } from '../config/logger.config';
import { NotificationService } from './notification.service';
import { NotificationType } from '../models/notification.entity';

/**
 * 举报服务类，处理举报相关的业务逻辑
 */
export class ReportService extends BaseService<Report> {
  private readonly reportRepository: Repository<Report>;
  private readonly userRepository: Repository<User>;
  private readonly postRepository: Repository<Post>;
  private readonly commentRepository: Repository<Comment>;
  private readonly notificationService: NotificationService;

  constructor() {
    const reportRepository = AppDataSource.getRepository(Report);
    super(reportRepository);
    this.reportRepository = reportRepository;
    this.userRepository = AppDataSource.getRepository(User);
    this.postRepository = AppDataSource.getRepository(Post);
    this.commentRepository = AppDataSource.getRepository(Comment);
    this.notificationService = new NotificationService();
  }

  /**
   * 创建举报
   * @param userId 用户ID
   * @param createDto 创建数据
   * @returns 创建的举报
   */
  async createReport(userId: string, createDto: CreateReportDto): Promise<Report> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 根据举报类型检查被举报内容是否存在
    let targetUser: User | null = null;
    let targetPost: Post | null = null;
    let targetComment: Comment | null = null;

    switch (createDto.type) {
      case ReportType.USER:
        if (!createDto.reportedUserId) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '被举报用户ID不能为空');
        }
        
        targetUser = await this.userRepository.findOne({
          where: { id: createDto.reportedUserId },
        });

        if (!targetUser) {
          throw new ApiError(HttpStatus.NOT_FOUND, '被举报用户不存在');
        }
        
        // 不能举报自己
        if (targetUser.id === userId) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '不能举报自己');
        }
        
        // 不能举报管理员
        if (targetUser.role === UserRole.ADMIN) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '不能举报管理员');
        }
        break;

      case ReportType.POST:
        if (!createDto.postId) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '被举报帖子ID不能为空');
        }
        
        targetPost = await this.postRepository.findOne({
          where: { id: createDto.postId },
          relations: ['author'],
        });

        if (!targetPost) {
          throw new ApiError(HttpStatus.NOT_FOUND, '被举报帖子不存在');
        }
        
        // 不能举报自己的帖子
        if (targetPost.authorId === userId) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '不能举报自己的帖子');
        }
        break;

      case ReportType.COMMENT:
        if (!createDto.commentId) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '被举报评论ID不能为空');
        }
        
        targetComment = await this.commentRepository.findOne({
          where: { id: createDto.commentId },
          relations: ['author', 'post'],
        });

        if (!targetComment) {
          throw new ApiError(HttpStatus.NOT_FOUND, '被举报评论不存在');
        }
        
        // 不能举报自己的评论
        if (targetComment.authorId === userId) {
          throw new ApiError(HttpStatus.BAD_REQUEST, '不能举报自己的评论');
        }
        
        // 设置关联的帖子
        targetPost = targetComment.post;
        break;

      default:
        throw new ApiError(HttpStatus.BAD_REQUEST, '无效的举报类型');
    }

    // 检查是否已经举报过同一内容
    const existingReport = await this.reportRepository.findOne({
      where: {
        reporterId: userId,
        type: createDto.type,
        ...(createDto.type === ReportType.USER && { reportedUserId: createDto.reportedUserId }),
        ...(createDto.type === ReportType.POST && { postId: createDto.postId }),
        ...(createDto.type === ReportType.COMMENT && { commentId: createDto.commentId }),
        status: ReportStatus.PENDING, // 只检查未处理的举报
      },
    });

    if (existingReport) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '您已经举报过该内容，请等待处理');
    }

    // 创建举报
    const newReport = this.reportRepository.create({
      ...createDto,
      reporter: user,
      reporterId: userId,
      reportedUser: targetUser,
      reportedUserId: targetUser?.id,
      post: targetPost,
      postId: targetPost?.id,
      comment: targetComment,
      commentId: targetComment?.id,
      status: ReportStatus.PENDING,
    } as DeepPartial<Report>);

    const savedReport = await this.reportRepository.save(newReport);
    
    logger.info(`新举报创建成功: ${savedReport.id} by ${user.username}`);
    
    // 通知管理员和版主
    try {
      // 查找所有管理员和版主
      const moderators = await this.userRepository.find({
        where: [
          { role: UserRole.ADMIN },
          { role: UserRole.MODERATOR },
        ],
      });
      
      // 创建通知
      const moderatorIds = moderators.map(mod => mod.id);
      
      if (moderatorIds.length > 0) {
        let message = '';
        let link = '';
        
        switch (createDto.type) {
          case ReportType.USER:
            message = `用户 ${user.username} 举报了用户 ${targetUser!.username}`;
            link = `/admin/reports/${savedReport.id}`;
            break;
          case ReportType.POST:
            message = `用户 ${user.username} 举报了帖子 "${targetPost!.title}"`;
            link = `/admin/reports/${savedReport.id}`;
            break;
          case ReportType.COMMENT:
            message = `用户 ${user.username} 举报了一条评论`;
            link = `/admin/reports/${savedReport.id}`;
            break;
        }
        
        await this.notificationService.createSystemNotification(
          message,
          moderatorIds,
          link
        );
      }
    } catch (error) {
      // 通知创建失败不影响举报创建
      logger.error('创建举报通知失败', { error });
    }
    
    return this.findById(savedReport.id, ['reporter', 'targetUser', 'targetPost', 'targetComment']);
  }

  /**
   * 处理举报
   * @param reportId 举报ID
   * @param adminId 管理员ID
   * @param resolveDto 处理数据
   * @returns 处理后的举报
   */
  async resolveReport(reportId: string, adminId: string, resolveDto: ResolveReportDto): Promise<Report> {
    // 查找举报
    const report = await this.findById(reportId, ['reporter', 'targetUser', 'targetPost', 'targetComment']);
    
    // 检查权限
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 只有管理员/版主可以处理举报
    const isModerator = admin.role === UserRole.MODERATOR || admin.role === UserRole.ADMIN;
    
    if (!isModerator) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限处理举报');
    }
    
    // 检查举报状态
    if (report.status !== ReportStatus.PENDING) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '该举报已经被处理');
    }
    
    // 更新举报
    report.status = resolveDto.status;
    report.resolution = resolveDto.resolution;
    report.resolvedAt = new Date();
    report.resolvedBy = admin;
    report.resolvedById = admin.id;
    
    await this.reportRepository.save(report);
    
    // 通知举报者
    try {
      let message = '';
      let link = '';
      
      switch (report.type) {
        case ReportType.USER:
          message = `您对用户 ${report.reportedUser!.username} 的举报已被${resolveDto.status === ReportStatus.RESOLVED ? '接受' : '驳回'}`;
          link = `/users/${report.reportedUserId}`;
          break;
        case ReportType.POST:
          message = `您对帖子 "${report.post!.title}" 的举报已被${resolveDto.status === ReportStatus.RESOLVED ? '接受' : '驳回'}`;
          link = `/posts/${report.postId}`;
          break;
        case ReportType.COMMENT:
          message = `您对评论的举报已被${resolveDto.status === ReportStatus.RESOLVED ? '接受' : '驳回'}`;
          link = `/posts/${report.post!.id}#comment-${report.commentId}`;
          break;
      }
      
      await this.notificationService.createNotification({
        type: NotificationType.SYSTEM,
        message,
        recipientId: report.reporterId,
        link,
      });
    } catch (error) {
      // 通知创建失败不影响举报处理
      logger.error('创建举报处理通知失败', { error });
    }
    
    // 如果举报被接受，可能需要采取进一步行动（如禁用用户、删除帖子等）
    if (resolveDto.status === ReportStatus.RESOLVED) {
      // 这里可以根据举报类型执行相应的操作
      // 例如：禁用用户、删除帖子、删除评论等
      // 这些操作应该在相应的服务中实现
    }
    
    return this.findById(reportId, ['reporter', 'targetUser', 'targetPost', 'targetComment', 'resolvedBy']);
  }

  /**
   * 查询举报列表
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页举报列表
   */
  async findReports(
    queryDto: ReportQueryDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Report[]; total: number; page: number; limit: number }> {
    const { type, status, reporterId } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.targetUser', 'targetUser')
      .leftJoinAndSelect('report.targetPost', 'targetPost')
      .leftJoinAndSelect('report.targetComment', 'targetComment')
      .leftJoinAndSelect('report.resolvedBy', 'resolvedBy');
    
    // 举报类型过滤
    if (type) {
      queryBuilder.andWhere('report.type = :type', { type });
    }
    
    // 举报状态过滤
    if (status) {
      queryBuilder.andWhere('report.status = :status', { status });
    }
    
    // 举报者过滤
    if (reporterId) {
      queryBuilder.andWhere('report.reporterId = :reporterId', { reporterId });
    }
    
    // 日期范围过滤
    if (queryDto.createdAfter) {
      queryBuilder.andWhere('report.createdAt >= :createdAfter', { createdAfter: queryDto.createdAfter });
    }
    
    if (queryDto.createdBefore) {
      queryBuilder.andWhere('report.createdAt <= :createdBefore', { createdBefore: queryDto.createdBefore });
    }
    
    // 排序（按创建时间降序）
    queryBuilder.orderBy('report.createdAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const reports = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: reports,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取举报详情
   * @param reportId 举报ID
   * @returns 举报详情
   */
  async getReportDetails(reportId: string): Promise<Report> {
    return this.findById(reportId, [
      'reporter',
      'targetUser',
      'targetPost',
      'targetPost.author',
      'targetComment',
      'targetComment.author',
      'resolvedBy',
    ]);
  }

  /**
   * 获取未处理举报数量
   * @returns 未处理举报数量
   */
  async getPendingCount(): Promise<number> {
    const count = await this.reportRepository.count({
      where: {
        status: ReportStatus.PENDING,
      },
    });
    
    return count;
  }

  /**
   * 获取用户提交的举报列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页举报列表
   */
  async getUserReports(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: Report[]; total: number; page: number; limit: number }> {
    // 构建查询条件
    const queryBuilder = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.targetUser', 'targetUser')
      .leftJoinAndSelect('report.targetPost', 'targetPost')
      .leftJoinAndSelect('report.targetComment', 'targetComment')
      .leftJoinAndSelect('report.resolvedBy', 'resolvedBy')
      .where('report.reporterId = :userId', { userId })
      .orderBy('report.createdAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const reports = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: reports,
      total,
      page,
      limit,
    };
  }
  
  /**
   * 获取用户被举报的列表
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页举报列表
   */
  async findUserReports(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: Report[]; total: number; page: number; limit: number }> {
    // 构建查询条件
    const queryBuilder = this.reportRepository.createQueryBuilder('report')
      .leftJoinAndSelect('report.reporter', 'reporter')
      .leftJoinAndSelect('report.targetUser', 'targetUser')
      .leftJoinAndSelect('report.targetPost', 'targetPost')
      .leftJoinAndSelect('report.targetComment', 'targetComment')
      .leftJoinAndSelect('report.resolvedBy', 'resolvedBy')
      .where('report.reportedUserId = :userId', { userId })
      .orderBy('report.createdAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const reports = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: reports,
      total,
      page,
      limit,
    };
  }
}
