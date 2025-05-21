import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { PostService } from '../services/post.service';
import { 
  CreatePostDto,
  UpdatePostDto,
  PostQueryDto,
  LikePostDto,
  FavoritePostDto,
  SearchType,
  SortOrder
} from '../dtos/post.dto';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../utils/logger.util';
import { sensitiveWordFilter } from '../utils/sensitive-word.util';

/**
 * 帖子控制器，处理帖子相关的HTTP请求
 * @swagger
 * tags:
 *   name: Posts
 *   description: 帖子管理相关接口
 */
export class PostController extends BaseController {
  private readonly postService: PostService;

  constructor() {
    super();
    this.postService = new PostService();
  }

  /**
   * 创建帖子
   * @swagger
   * /posts:
   *   post:
   *     summary: 创建新帖子
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/CreatePostDto'
   *     responses:
   *       201:
   *         description: 帖子创建成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       500:
   *         description: 服务器错误
   */
  createPost = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const createDto = req.body as CreatePostDto;
    const post = await this.postService.createPost(userId, createDto);
    logger.info(`帖子创建成功: ${post.id}`);
    return this.success(res, post, HttpStatus.CREATED);
  });

  /**
   * 获取帖子详情
   * @swagger
   * /posts/{id}:
   *   get:
   *     summary: 获取帖子详情
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     responses:
   *       200:
   *         description: 成功获取帖子详情
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  getPost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const post = await this.postService.getPostDetails(id, userId);
    return this.success(res, post);
  });

  /**
   * 更新帖子
   * @swagger
   * /posts/{id}:
   *   put:
   *     summary: 更新帖子内容
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/UpdatePostDto'
   *     responses:
   *       200:
   *         description: 帖子更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       400:
   *         description: 请求参数错误
   *       401:
   *         description: 未授权
   *       403:
   *         description: 没有权限操作此帖子
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  updatePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const updateDto = req.body as UpdatePostDto;
    const updatedPost = await this.postService.updatePost(id, userId, updateDto);
    logger.info(`帖子更新成功: ${id}`);
    return this.success(res, updatedPost);
  });

  /**
   * 删除帖子
   * @swagger
   * /posts/{id}:
   *   delete:
   *     summary: 删除帖子
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     responses:
   *       200:
   *         description: 帖子删除成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                   example: true
   *       401:
   *         description: 未授权
   *       403:
   *         description: 没有权限删除此帖子
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  deletePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    await this.postService.deletePost(id, userId);
    logger.info(`帖子删除成功: ${id}`);
    return this.success(res, { success: true });
  });

  /**
   * 获取帖子列表
   * @swagger
   * /posts:
   *   get:
   *     summary: 获取帖子列表
   *     tags: [Posts]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: 搜索关键词
   *       - in: query
   *         name: searchType
   *         schema:
   *           type: string
   *           enum: [all, title, content, tag, author]
   *           default: all
   *         description: 搜索类型
   *       - in: query
   *         name: categoryId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 分类 ID
   *       - in: query
   *         name: authorId
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 作者 ID
   *       - in: query
   *         name: tagIds
   *         schema:
   *           type: array
   *           items:
   *             type: string
   *         description: 标签 ID 列表
   *         style: form
   *         explode: true
   *       - in: query
   *         name: sortBy
   *         schema:
   *           type: string
   *           enum: [newest, oldest, most_viewed, most_liked, most_commented]
   *           default: newest
   *         description: 排序方式
   *     responses:
   *       200:
   *         description: 成功获取帖子列表
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Post'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     pages:
   *                       type: integer
   *       500:
   *         description: 服务器错误
   */
  getPosts = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as PostQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const userId = req.user?.id;
    
    // 如果提供了搜索关键词，检查是否包含敏感词
    if (queryDto.search) {
      const hasSensitiveWords = sensitiveWordFilter.containsSensitiveWords(queryDto.search);
      if (hasSensitiveWords) {
        logger.warn(`搜索内容包含敏感词: ${queryDto.search}`);
        queryDto.search = sensitiveWordFilter.filter(queryDto.search, '*');
      }
    }
    
    // findPosts方法只接受三个参数，修改为在queryDto中传递userId
    if (userId) {
      queryDto.currentUserId = userId;
    }
    const result = await this.postService.findPosts(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });
  
  /**
   * 高级搜索帖子
   * @swagger
   * /posts/search:
   *   post:
   *     summary: 高级搜索帖子
   *     tags: [Posts]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/PostQueryDto'
   *     responses:
   *       200:
   *         description: 搜索成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Post'
   *                 total:
   *                   type: number
   *                 page:
   *                   type: number
   *                 limit:
   *                   type: number
   *       400:
   *         description: 请求参数错误
   *       500:
   *         description: 服务器错误
   */
  searchPosts = this.asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, ...searchParams } = req.body;
    const queryDto = searchParams as PostQueryDto;
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const userId = req.user?.id;
    
    // 检查搜索内容是否包含敏感词
    if (queryDto.search) {
      const hasSensitiveWords = sensitiveWordFilter.containsSensitiveWords(queryDto.search);
      if (hasSensitiveWords) {
        logger.warn(`搜索内容包含敏感词: ${queryDto.search}`);
        queryDto.search = sensitiveWordFilter.filter(queryDto.search, '*');
      }
    }
    
    // 检查作者名称是否包含敏感词
    if (queryDto.authorName) {
      const hasSensitiveWords = sensitiveWordFilter.containsSensitiveWords(queryDto.authorName);
      if (hasSensitiveWords) {
        logger.warn(`作者名称包含敏感词: ${queryDto.authorName}`);
        queryDto.authorName = sensitiveWordFilter.filter(queryDto.authorName, '*');
      }
    }
    
    // 检查标签名称是否包含敏感词
    if (queryDto.tagNames && queryDto.tagNames.length > 0) {
      queryDto.tagNames = queryDto.tagNames.map(tagName => {
        if (sensitiveWordFilter.containsSensitiveWords(tagName)) {
          logger.warn(`标签名称包含敏感词: ${tagName}`);
          return sensitiveWordFilter.filter(tagName, '*');
        }
        return tagName;
      });
    }
    
    // 设置当前用户ID用于检查交互状态
    if (userId) {
      queryDto.currentUserId = userId;
    }
    
    const result = await this.postService.findPosts(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取用户的帖子
   * @swagger
   * /users/{userId}/posts:
   *   get:
   *     summary: 获取指定用户的帖子列表
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 用户ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *     responses:
   *       200:
   *         description: 成功获取用户帖子列表
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Post'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     pages:
   *                       type: integer
   *       404:
   *         description: 用户不存在
   *       500:
   *         description: 服务器错误
   */
  getUserPosts = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const currentUserId = req.user?.id;
    
    const result = await this.postService.findUserPosts(userId, pageNumber, limitNumber, currentUserId);
    return this.success(res, result);
  });

  /**
   * 点赞帖子
   * @swagger
   * /posts/{id}/like:
   *   post:
   *     summary: 点赞或取消点赞帖子
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LikePostDto'
   *     responses:
   *       200:
   *         description: 点赞状态更新成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 liked:
   *                   type: boolean
   *                 likesCount:
   *                   type: integer
   *       401:
   *         description: 未授权
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  likePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const likeDto = req.body as LikePostDto;
    // likePost方法只接受两个参数
    const result = await this.postService.likePost(id, userId);
    logger.info(`帖子点赞状态更新: ${id}, 用户: ${userId}, 点赞: ${likeDto.like}`);
    return this.success(res, result);
  });

  /**
   * 收藏帖子
   * @swagger
   * /posts/{id}/favorite:
   *   post:
   *     summary: 收藏或取消收藏帖子
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/FavoritePostDto'
   *     responses:
   *       200:
   *         description: 收藏状态更新成功
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 favorited:
   *                   type: boolean
   *                 favoritesCount:
   *                   type: integer
   *       401:
   *         description: 未授权
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  favoritePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const favoriteDto = req.body as FavoritePostDto;
    const result = await this.postService.favoritePost(id, userId, favoriteDto.favorite);
    logger.info(`帖子收藏状态更新: ${id}, 用户: ${userId}, 收藏: ${favoriteDto.favorite}`);
    return this.success(res, result);
  });

  /**
   * 获取用户收藏的帖子
   * @swagger
   * /users/{userId}/favorites:
   *   get:
   *     summary: 获取用户收藏的帖子列表
   *     tags: [Posts]
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 用户ID
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           minimum: 1
   *           default: 1
   *         description: 页码
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           minimum: 1
   *           maximum: 100
   *           default: 10
   *         description: 每页数量
   *     responses:
   *       200:
   *         description: 成功获取用户收藏的帖子列表
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 items:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Post'
   *                 meta:
   *                   type: object
   *                   properties:
   *                     total:
   *                       type: integer
   *                     page:
   *                       type: integer
   *                     limit:
   *                       type: integer
   *                     pages:
   *                       type: integer
   *       404:
   *         description: 用户不存在
   *       500:
   *         description: 服务器错误
   */
  getUserFavorites = this.asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    const currentUserId = req.user?.id;
    
    const result = await this.postService.findUserFavorites(userId, pageNumber, limitNumber, currentUserId);
    return this.success(res, result);
  });

  /**
   * 管理员置顶帖子
   * @swagger
   * /admin/posts/{id}/pin:
   *   put:
   *     summary: 管理员置顶或取消置顶帖子
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - pinned
   *             properties:
   *               pinned:
   *                 type: boolean
   *                 description: 是否置顶
   *     responses:
   *       200:
   *         description: 置顶状态更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       401:
   *         description: 未授权
   *       403:
   *         description: 没有管理员权限
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  pinPost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { pinned } = req.body;
    const result = await this.postService.pinPost(id, pinned);
    logger.info(`帖子置顶状态更新: ${id}, 置顶: ${pinned}`);
    return this.success(res, result);
  });

  /**
   * 管理员设置精华帖子
   * @swagger
   * /admin/posts/{id}/featured:
   *   put:
   *     summary: 管理员设置或取消精华帖子
   *     tags: [Posts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: 帖子ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - featured
   *             properties:
   *               featured:
   *                 type: boolean
   *                 description: 是否设为精华
   *     responses:
   *       200:
   *         description: 精华状态更新成功
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Post'
   *       401:
   *         description: 未授权
   *       403:
   *         description: 没有管理员权限
   *       404:
   *         description: 帖子不存在
   *       500:
   *         description: 服务器错误
   */
  featurePost = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { featured } = req.body;
    const result = await this.postService.featurePost(id, featured);
    logger.info(`帖子精华状态更新: ${id}, 精华: ${featured}`);
    return this.success(res, result);
  });
}
