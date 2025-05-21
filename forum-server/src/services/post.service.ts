import { Repository, In, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Post, PostStatus } from '../models/post.entity';
import { User, UserRole } from '../models/user.entity';
import { Category } from '../models/category.entity';
import { Tag } from '../models/tag.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreatePostDto, UpdatePostDto, PostQueryDto, PostAdminActionDto, SearchType, SortOrder } from '../dtos/post.dto';
import { logger } from '../config/logger.config';
import { TagService } from './tag.service';

/**
 * 帖子服务类，处理帖子相关的业务逻辑
 */
export class PostService extends BaseService<Post> {
  private readonly postRepository: Repository<Post>;
  private readonly userRepository: Repository<User>;
  private readonly categoryRepository: Repository<Category>;
  private readonly tagRepository: Repository<Tag>;
  private readonly tagService: TagService;

  constructor() {
    const postRepository = AppDataSource.getRepository(Post);
    super(postRepository);
    this.postRepository = postRepository;
    this.userRepository = AppDataSource.getRepository(User);
    this.categoryRepository = AppDataSource.getRepository(Category);
    this.tagRepository = AppDataSource.getRepository(Tag);
    this.tagService = new TagService();
  }

  /**
   * 创建帖子
   * @param userId 用户ID
   * @param createDto 创建数据
   * @returns 创建的帖子
   */
  async createPost(userId: string, createDto: CreatePostDto): Promise<Post> {
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 检查分类是否存在
    const category = await this.categoryRepository.findOne({
      where: { id: createDto.categoryId },
    });

    if (!category) {
      throw new ApiError(HttpStatus.NOT_FOUND, '分类不存在');
    }

    // 如果分类不活跃，则不能发帖
    if (!category.isActive) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '该分类已被禁用');
    }

    // 处理标签
    let tags: Tag[] = [];
    if (createDto.tagIds && createDto.tagIds.length > 0) {
      tags = await this.tagRepository.find({
        where: { id: In(createDto.tagIds) },
      });

      // 检查是否所有标签都存在
      if (tags.length !== createDto.tagIds.length) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '部分标签不存在');
      }
    }

    // 创建帖子
    const newPost = this.postRepository.create({
      ...createDto,
      author: user,
      authorId: userId,
      category,
      categoryId: category.id,
      tags,
      status: createDto.status || PostStatus.PUBLISHED,
      publishedAt: createDto.status === PostStatus.PUBLISHED ? new Date() : null,
    } as DeepPartial<Post>);

    const savedPost = await this.postRepository.save(newPost);
    
    // 更新标签使用计数
    if (tags.length > 0) {
      await this.tagService.batchUpdateUsageCount(tags.map(tag => tag.id), 1);
    }
    
    logger.info(`新帖子创建成功: ${savedPost.title} (${savedPost.id}) by ${user.username}`);
    
    return this.findById(savedPost.id, ['author', 'category', 'tags']);
  }

  /**
   * 更新帖子
   * @param postId 帖子ID
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新后的帖子
   */
  async updatePost(postId: string, userId: string, updateDto: UpdatePostDto): Promise<Post> {
    // 查找帖子
    const post = await this.findById(postId, ['author', 'tags']);
    
    // 检查权限
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 只有作者或管理员/版主可以编辑帖子
    const isAuthor = post.authorId === userId;
    const isModerator = user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;
    
    if (!isAuthor && !isModerator) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限编辑此帖子');
    }
    
    // 如果更新分类，检查分类是否存在
    let category: Category | null = null;
    if (updateDto.categoryId) {
      category = await this.categoryRepository.findOne({
        where: { id: updateDto.categoryId },
      });

      if (!category) {
        throw new ApiError(HttpStatus.NOT_FOUND, '分类不存在');
      }

      // 如果分类不活跃，则不能使用
      if (!category.isActive) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '该分类已被禁用');
      }
    }
    
    // 处理标签
    let newTags: Tag[] = [];
    let oldTagIds: string[] = post.tags.map(tag => tag.id);
    
    if (updateDto.tagIds) {
      newTags = await this.tagRepository.find({
        where: { id: In(updateDto.tagIds) },
      });

      // 检查是否所有标签都存在
      if (newTags.length !== updateDto.tagIds.length) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '部分标签不存在');
      }
      
      // 更新标签使用计数
      const newTagIds = newTags.map(tag => tag.id);
      const addedTagIds = newTagIds.filter(id => !oldTagIds.includes(id));
      const removedTagIds = oldTagIds.filter(id => !newTagIds.includes(id));
      
      if (addedTagIds.length > 0) {
        await this.tagService.batchUpdateUsageCount(addedTagIds, 1);
      }
      
      if (removedTagIds.length > 0) {
        await this.tagService.batchUpdateUsageCount(removedTagIds, -1);
      }
    }
    
    // 准备更新数据
    const updateData: any = { ...updateDto };
    
    // 如果更新分类
    if (category) {
      updateData.category = category;
      updateData.categoryId = category.id;
    }
    
    // 如果更新标签
    if (newTags.length > 0) {
      updateData.tags = newTags;
    }
    
    // 如果更新状态为已发布，且之前未发布，则设置发布时间
    if (updateDto.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
    
    // 更新帖子
    await this.postRepository.save({
      ...post,
      ...updateData,
    });
    
    // 返回更新后的帖子
    return this.findById(postId, ['author', 'category', 'tags']);
  }

  /**
   * 查询帖子列表
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页帖子列表
   */
  async findPosts(
    queryDto: PostQueryDto,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: Post[]; total: number; page: number; limit: number }> {
    const { 
      search, searchType, categoryId, authorId, authorName, tagIds, tagNames,
      status, isPinned, isFeatured, publishedAfter, publishedBefore,
      sortBy, hasAttachments, hasCoverImage, currentUserId 
    } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags');
    
    // 默认只查询已发布的帖子
    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    } else {
      queryBuilder.andWhere('post.status = :status', { status: PostStatus.PUBLISHED });
    }
    
    // 搜索条件
    if (search) {
      switch (searchType) {
        case SearchType.TITLE:
          queryBuilder.andWhere('post.title LIKE :search', { search: `%${search}%` });
          break;
        case SearchType.CONTENT:
          queryBuilder.andWhere('post.content LIKE :search', { search: `%${search}%` });
          break;
        case SearchType.TAG:
          queryBuilder.andWhere('tags.name LIKE :search', { search: `%${search}%` });
          break;
        case SearchType.AUTHOR:
          queryBuilder.andWhere('author.username LIKE :search OR author.nickname LIKE :search', 
            { search: `%${search}%` });
          break;
        case SearchType.ALL:
        default:
          queryBuilder.andWhere(
            '(post.title LIKE :search OR post.content LIKE :search OR post.summary LIKE :search OR tags.name LIKE :search OR author.username LIKE :search OR author.nickname LIKE :search)',
            { search: `%${search}%` }
          );
          break;
      }
    }
    
    // 分类过滤
    if (categoryId) {
      queryBuilder.andWhere('post.categoryId = :categoryId', { categoryId });
    }
    
    // 作者过滤 - 精确ID
    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }
    
    // 作者过滤 - 模糊名称
    if (authorName) {
      queryBuilder.andWhere('(author.username LIKE :authorName OR author.nickname LIKE :authorName)', 
        { authorName: `%${authorName}%` });
    }
    
    // 标签过滤 - 精确ID
    if (tagIds && tagIds.length > 0) {
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds });
    }
    
    // 标签过滤 - 模糊名称
    if (tagNames && tagNames.length > 0) {
      const tagConditions = tagNames.map((_, index) => `tags.name LIKE :tagName${index}`);
      const tagParams: Record<string, string> = {};
      tagNames.forEach((name, index) => {
        tagParams[`tagName${index}`] = `%${name}%`;
      });
      queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`, tagParams);
    }
    
    // 置顶状态过滤
    if (isPinned !== undefined) {
      queryBuilder.andWhere('post.isPinned = :isPinned', { isPinned });
    }
    
    // 精选状态过滤
    if (isFeatured !== undefined) {
      queryBuilder.andWhere('post.isFeatured = :isFeatured', { isFeatured });
    }
    
    // 发布日期范围过滤
    if (publishedAfter) {
      queryBuilder.andWhere('post.publishedAt >= :publishedAfter', { publishedAfter });
    }
    
    if (publishedBefore) {
      queryBuilder.andWhere('post.publishedAt <= :publishedBefore', { publishedBefore });
    }
    
    // 附件过滤
    if (hasAttachments !== undefined) {
      if (hasAttachments) {
        queryBuilder.andWhere("post.attachments IS NOT NULL AND post.attachments != '[]'");
      } else {
        queryBuilder.andWhere("post.attachments IS NULL OR post.attachments = '[]'");
      }
    }
    
    // 封面图片过滤
    if (hasCoverImage !== undefined) {
      if (hasCoverImage) {
        queryBuilder.andWhere("post.coverImage IS NOT NULL AND post.coverImage != ''");
      } else {
        queryBuilder.andWhere("post.coverImage IS NULL OR post.coverImage = ''");
      }
    }
    
    // 排序
    queryBuilder.orderBy('post.isPinned', 'DESC'); // 置顶的帖子始终排在前面
    
    // 根据排序选项添加排序
    switch (sortBy) {
      case SortOrder.OLDEST:
        queryBuilder.addOrderBy('post.publishedAt', 'ASC');
        break;
      case SortOrder.MOST_VIEWED:
        queryBuilder.addOrderBy('post.viewCount', 'DESC');
        break;
      case SortOrder.MOST_LIKED:
        queryBuilder.addOrderBy('post.likeCount', 'DESC');
        break;
      case SortOrder.MOST_COMMENTED:
        queryBuilder.addOrderBy('post.commentCount', 'DESC');
        break;
      case SortOrder.NEWEST:
      default:
        queryBuilder.addOrderBy('post.publishedAt', 'DESC');
        break;
    }
    
    // 分页
    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    // 如果提供了当前用户ID，检查用户与帖子的交互状态
    if (currentUserId && posts.length > 0) {
      for (const post of posts) {
        await this.checkUserInteractions(post, currentUserId);
      }
    }
    
    return {
      items: posts,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取帖子详情
   * @param postId 帖子ID
   * @param incrementView 是否增加浏览量
   * @returns 帖子详情
   */
  async getPostDetails(postId: string, incrementView: boolean = true): Promise<Post> {
    const post = await this.findById(postId, ['author', 'category', 'tags', 'comments', 'comments.author']);
    
    // 增加浏览量
    if (incrementView) {
      post.viewCount += 1;
      await this.postRepository.save(post);
    }
    
    return post;
  }

  /**
   * 删除帖子
   * @param postId 帖子ID
   * @param userId 用户ID
   * @returns 删除结果
   */
  async deletePost(postId: string, userId: string): Promise<boolean> {
    // 查找帖子
    const post = await this.findById(postId, ['author', 'tags']);
    
    // 检查权限
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 只有作者或管理员/版主可以删除帖子
    const isAuthor = post.authorId === userId;
    const isModerator = user.role === UserRole.MODERATOR || user.role === UserRole.ADMIN;
    
    if (!isAuthor && !isModerator) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限删除此帖子');
    }
    
    // 更新标签使用计数
    if (post.tags.length > 0) {
      await this.tagService.batchUpdateUsageCount(post.tags.map(tag => tag.id), -1);
    }
    
    // 删除帖子
    await this.postRepository.remove(post);
    
    return true;
  }

  /**
   * 点赞帖子
   * @param postId 帖子ID
   * @param userId 用户ID
   * @returns 点赞结果
   */
  async likePost(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    // 查找帖子
    const post = await this.findById(postId, ['likedBy']);
    
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }
    
    // 检查用户是否已点赞
    const isLiked = post.likedBy.some(u => u.id === userId);
    
    if (isLiked) {
      // 取消点赞
      post.likedBy = post.likedBy.filter(u => u.id !== userId);
      post.likeCount = Math.max(0, post.likeCount - 1);
    } else {
      // 添加点赞
      post.likedBy.push(user);
      post.likeCount += 1;
    }
    
    // 保存更新
    await this.postRepository.save(post);
    
    return {
      liked: !isLiked,
      likeCount: post.likeCount,
    };
  }

  /**
   * 收藏帖子
   * @param postId 帖子ID
   * @param userId 用户ID
   * @returns 收藏结果
   */
  async bookmarkPost(postId: string, userId: string): Promise<{ bookmarked: boolean }> {
    // 查找帖子
    const post = await this.findById(postId, ['bookmarkedBy']);
    
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }
    
    // 检查用户是否已收藏
    const isBookmarked = post.bookmarkedBy.some(u => u.id === userId);
    
    if (isBookmarked) {
      // 取消收藏
      post.bookmarkedBy = post.bookmarkedBy.filter(u => u.id !== userId);
    } else {
      // 添加收藏
      post.bookmarkedBy.push(user);
    }
    
    // 保存更新
    await this.postRepository.save(post);
    
    return {
      bookmarked: !isBookmarked,
    };
  }

  /**
   * 管理员操作帖子
   * @param postId 帖子ID
   * @param adminId 管理员ID
   * @param actionDto 操作数据
   * @returns 操作结果
   */
  async adminActionPost(postId: string, adminId: string, actionDto: PostAdminActionDto): Promise<Post> {
    // 查找帖子
    const post = await this.findById(postId);
    
    // 检查权限
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }

    // 只有管理员/版主可以执行此操作
    const isModerator = admin.role === UserRole.MODERATOR || admin.role === UserRole.ADMIN;
    
    if (!isModerator) {
      throw new ApiError(HttpStatus.FORBIDDEN, '您没有权限执行此操作');
    }
    
    // 更新帖子
    const updateData: any = { ...actionDto };
    
    // 如果更新状态为已发布，且之前未发布，则设置发布时间
    if (actionDto.status === PostStatus.PUBLISHED && post.status !== PostStatus.PUBLISHED) {
      updateData.publishedAt = new Date();
    }
    
    // 更新帖子
    const updatedPost = await this.update(postId, updateData);
    
    return updatedPost;
  }

  /**
   * 获取用户发布的帖子
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @param currentUserId 当前用户ID，用于检查是否点赞和收藏
   * @returns 分页帖子列表
   */
  async findUserPosts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    currentUserId?: string
  ): Promise<{ items: Post[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .where('post.authorId = :userId', { userId })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.createdAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    // 如果提供了当前用户ID，检查是否点赞和收藏
    if (currentUserId) {
      for (const post of posts) {
        await this.checkUserInteractions(post, currentUserId);
      }
    }
    
    return {
      items: posts,
      total,
      page,
      limit,
    };
  }

  /**
   * 点赞或取消点赞帖子
   * @param postId 帖子ID
   * @param userId 用户ID
   * @param like 是否点赞
   * @returns 点赞结果
   */
  async favoritePost(postId: string, userId: string, favorite: boolean): Promise<{ success: boolean }> {
    // 查找帖子
    const post = await this.findById(postId, ['bookmarkedBy']);
    
    // 查找用户
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(HttpStatus.NOT_FOUND, '用户不存在');
    }
    
    // 检查用户是否已收藏
    const isBookmarked = post.bookmarkedBy.some(u => u.id === userId);
    
    if (favorite && !isBookmarked) {
      // 添加收藏
      post.bookmarkedBy.push(user);
      await this.postRepository.save(post);
      return { success: true };
    } else if (!favorite && isBookmarked) {
      // 取消收藏
      post.bookmarkedBy = post.bookmarkedBy.filter(u => u.id !== userId);
      await this.postRepository.save(post);
      return { success: true };
    }
    
    return { success: false };
  }

  /**
   * 获取用户收藏的帖子
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @param currentUserId 当前用户ID，用于检查是否点赞和收藏
   * @returns 分页帖子列表
   */
  async findUserFavorites(
    userId: string,
    page: number = 1,
    limit: number = 10,
    currentUserId?: string
  ): Promise<{ items: Post[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoin('post.bookmarkedBy', 'bookmarkedBy')
      .where('bookmarkedBy.id = :userId', { userId })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED })
      .orderBy('post.createdAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    // 如果提供了当前用户ID，检查是否点赞和收藏
    if (currentUserId) {
      for (const post of posts) {
        await this.checkUserInteractions(post, currentUserId);
      }
    }
    
    return {
      items: posts,
      total,
      page,
      limit,
    };
  }

  /**
   * 置顶帖子
   * @param postId 帖子ID
   * @param pinned 是否置顶
   * @returns 操作结果
   */
  async pinPost(postId: string, pinned: boolean): Promise<{ success: boolean }> {
    // 查找帖子
    const post = await this.findById(postId);
    
    // 更新置顶状态
    post.isPinned = pinned;
    
    // 如果置顶，记录置顶时间
    if (pinned) {
      post.pinnedAt = new Date();
    } else {
      post.pinnedAt = null as any;
    }
    
    await this.postRepository.save(post);
    
    return { success: true };
  }

  /**
   * 设置精华帖子
   * @param postId 帖子ID
   * @param featured 是否精华
   * @returns 操作结果
   */
  async featurePost(postId: string, featured: boolean): Promise<{ success: boolean }> {
    // 查找帖子
    const post = await this.findById(postId);
    
    // 更新精华状态
    post.isFeatured = featured;
    
    // 如果设置为精华，记录精华时间
    if (featured) {
      post.featuredAt = new Date();
    } else {
      post.featuredAt = null as any;
    }
    
    await this.postRepository.save(post);
    
    return { success: true };
  }

  /**
   * 获取用户收藏的帖子
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页帖子列表
   */
  /**
   * 检查用户与帖子的交互状态（是否点赞、收藏）
   * @param post 帖子对象
   * @param userId 用户ID
   */
  private async checkUserInteractions(post: Post, userId: string): Promise<void> {
    // 查询用户是否点赞该帖子
    const likeQuery = this.postRepository.createQueryBuilder('post')
      .innerJoin('post.likedBy', 'user')
      .where('post.id = :postId', { postId: post.id })
      .andWhere('user.id = :userId', { userId })
      .getCount();
    
    // 查询用户是否收藏该帖子
    const bookmarkQuery = this.postRepository.createQueryBuilder('post')
      .innerJoin('post.bookmarkedBy', 'user')
      .where('post.id = :postId', { postId: post.id })
      .andWhere('user.id = :userId', { userId })
      .getCount();
    
    const [likeCount, bookmarkCount] = await Promise.all([likeQuery, bookmarkQuery]);
    
    // 添加到帖子对象上，但不保存到数据库
    (post as any).isLiked = likeCount > 0;
    (post as any).isBookmarked = bookmarkCount > 0;
  }

  async getUserBookmarks(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: Post[]; total: number; page: number; limit: number }> {
    // 构建查询条件
    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.category', 'category')
      .leftJoinAndSelect('post.tags', 'tags')
      .leftJoinAndSelect('post.bookmarkedBy', 'bookmarkedBy')
      .where('bookmarkedBy.id = :userId', { userId })
      .andWhere('post.status = :status', { status: PostStatus.PUBLISHED });
    
    // 排序
    queryBuilder.orderBy('post.publishedAt', 'DESC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const posts = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: posts,
      total,
      page,
      limit,
    };
  }
}
