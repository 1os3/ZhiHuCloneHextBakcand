import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsBoolean, IsEnum, IsArray, IsUrl, ArrayMaxSize, ValidateNested, IsDateString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '../models/post.entity';

/**
 * 搜索类型枚举
 */
export enum SearchType {
  ALL = 'all',       // 全文搜索
  TITLE = 'title',   // 仅标题
  CONTENT = 'content', // 仅内容
  TAG = 'tag',       // 标签
  AUTHOR = 'author'  // 作者
}

/**
 * 排序方式枚举
 */
export enum SortOrder {
  NEWEST = 'newest',         // 最新
  OLDEST = 'oldest',         // 最早
  MOST_VIEWED = 'most_viewed', // 最多浏览
  MOST_LIKED = 'most_liked',   // 最多点赞
  MOST_COMMENTED = 'most_commented' // 最多评论
}

/**
 * 创建帖子 DTO
 * @swagger
 * components:
 *   schemas:
 *     CreatePostDto:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - categoryId
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           description: 帖子标题
 *         content:
 *           type: string
 *           minLength: 10
 *           description: 帖子内容
 *         summary:
 *           type: string
 *           maxLength: 200
 *           description: 帖子摘要
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: 分类ID
 *         tagIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           maxItems: 10
 *           description: 标签 ID 数组
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           maxItems: 5
 *           description: 附件URL数组
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: 封面图片URL
 *         status:
 *           $ref: '#/components/schemas/PostStatus'
 */
export class CreatePostDto {
  @IsString({ message: '标题必须是字符串' })
  @MinLength(5, { message: '标题长度不能少于5个字符' })
  @MaxLength(100, { message: '标题长度不能超过100个字符' })
  title: string;

  @IsString({ message: '内容必须是字符串' })
  @MinLength(10, { message: '内容长度不能少于10个字符' })
  content: string;

  @IsString({ message: '摘要必须是字符串' })
  @IsOptional()
  @MaxLength(200, { message: '摘要长度不能超过200个字符' })
  summary?: string;

  @IsUUID('4', { message: '无效的分类ID' })
  categoryId: string;

  @IsArray({ message: '标签必须是数组' })
  @IsOptional()
  @ArrayMaxSize(10, { message: '标签数量不能超过10个' })
  tagIds?: string[];

  @IsArray({ message: '附件必须是数组' })
  @IsOptional()
  @ArrayMaxSize(5, { message: '附件数量不能超过5个' })
  @IsUrl({}, { each: true, message: '附件必须是有效的URL' })
  attachments?: string[];

  @IsUrl({}, { message: '封面图片必须是有效的URL' })
  @IsOptional()
  coverImage?: string;

  @IsEnum(PostStatus, { message: '无效的帖子状态' })
  @IsOptional()
  status?: PostStatus;
}

/**
 * 更新帖子 DTO
 * @swagger
 * components:
 *   schemas:
 *     UpdatePostDto:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           description: 帖子标题
 *         content:
 *           type: string
 *           minLength: 10
 *           description: 帖子内容
 *         summary:
 *           type: string
 *           maxLength: 200
 *           description: 帖子摘要
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: 分类ID
 *         tagIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           maxItems: 10
 *           description: 标签 ID 数组
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *             format: uri
 *           maxItems: 5
 *           description: 附件URL数组
 *         coverImage:
 *           type: string
 *           format: uri
 *           description: 封面图片URL
 *         status:
 *           $ref: '#/components/schemas/PostStatus'
 */
export class UpdatePostDto {
  @IsString({ message: '标题必须是字符串' })
  @MinLength(5, { message: '标题长度不能少于5个字符' })
  @MaxLength(100, { message: '标题长度不能超过100个字符' })
  @IsOptional()
  title?: string;

  @IsString({ message: '内容必须是字符串' })
  @MinLength(10, { message: '内容长度不能少于10个字符' })
  @IsOptional()
  content?: string;

  @IsString({ message: '摘要必须是字符串' })
  @IsOptional()
  @MaxLength(200, { message: '摘要长度不能超过200个字符' })
  summary?: string;

  @IsUUID('4', { message: '无效的分类ID' })
  @IsOptional()
  categoryId?: string;

  @IsArray({ message: '标签必须是数组' })
  @IsOptional()
  @ArrayMaxSize(10, { message: '标签数量不能超过10个' })
  tagIds?: string[];

  @IsArray({ message: '附件必须是数组' })
  @IsOptional()
  @ArrayMaxSize(5, { message: '附件数量不能超过5个' })
  @IsUrl({}, { each: true, message: '附件必须是有效的URL' })
  attachments?: string[];

  @IsUrl({}, { message: '封面图片必须是有效的URL' })
  @IsOptional()
  coverImage?: string;

  @IsEnum(PostStatus, { message: '无效的帖子状态' })
  @IsOptional()
  status?: PostStatus;
}

/**
 * 帖子查询参数 DTO
 * @swagger
 * components:
 *   schemas:
 *     PostQueryDto:
 *       type: object
 *       properties:
 *         search:
 *           type: string
 *           description: 搜索关键词
 *         searchType:
 *           type: string
 *           enum: [all, title, content, tag, author]
 *           description: 搜索类型
 *         categoryId:
 *           type: string
 *           format: uuid
 *           description: 分类ID
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: 作者ID
 *         authorName:
 *           type: string
 *           description: 作者名称（模糊匹配）
 *         tagIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: 标签 ID 数组
 *         tagNames:
 *           type: array
 *           items:
 *             type: string
 *           description: 标签名称数组（模糊匹配）
 *         status:
 *           $ref: '#/components/schemas/PostStatus'
 *         isPinned:
 *           type: boolean
 *           description: 是否置顶
 *         isFeatured:
 *           type: boolean
 *           description: 是否精选
 *         publishedAfter:
 *           type: string
 *           format: date-time
 *           description: 发布时间范围开始
 *         publishedBefore:
 *           type: string
 *           format: date-time
 *           description: 发布时间范围结束
 *         sortBy:
 *           type: string
 *           enum: [newest, oldest, most_viewed, most_liked, most_commented]
 *           description: 排序方式
 *         hasAttachments:
 *           type: boolean
 *           description: 是否有附件
 *         hasCoverImage:
 *           type: boolean
 *           description: 是否有封面图片
 *         currentUserId:
 *           type: string
 *           format: uuid
 *           description: 当前用户ID，用于检查是否点赞和收藏
 */
export class PostQueryDto {
  @IsString({ message: '搜索关键词必须是字符串' })
  @IsOptional()
  search?: string;

  @IsEnum(SearchType, { message: '无效的搜索类型' })
  @IsOptional()
  searchType?: SearchType = SearchType.ALL;

  @IsUUID('4', { message: '无效的分类ID' })
  @IsOptional()
  categoryId?: string;

  @IsUUID('4', { message: '无效的作者ID' })
  @IsOptional()
  authorId?: string;

  @IsString({ message: '作者名称必须是字符串' })
  @IsOptional()
  authorName?: string;

  @IsArray({ message: '标签必须是数组' })
  @IsOptional()
  @IsUUID('4', { each: true, message: '无效的标签ID' })
  tagIds?: string[];

  @IsArray({ message: '标签名称必须是数组' })
  @IsOptional()
  @IsString({ each: true, message: '标签名称必须是字符串' })
  tagNames?: string[];

  @IsEnum(PostStatus, { message: '无效的帖子状态' })
  @IsOptional()
  status?: PostStatus;

  @IsBoolean({ message: '置顶状态必须是布尔值' })
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean({ message: '精选状态必须是布尔值' })
  @IsOptional()
  isFeatured?: boolean;

  @IsDateString({}, { message: '发布日期必须是有效的日期字符串' })
  @IsOptional()
  publishedAfter?: string;

  @IsDateString({}, { message: '发布日期必须是有效的日期字符串' })
  @IsOptional()
  publishedBefore?: string;

  @IsEnum(SortOrder, { message: '无效的排序方式' })
  @IsOptional()
  sortBy?: SortOrder = SortOrder.NEWEST;

  @IsBoolean({ message: '附件状态必须是布尔值' })
  @IsOptional()
  hasAttachments?: boolean;

  @IsBoolean({ message: '封面图片状态必须是布尔值' })
  @IsOptional()
  hasCoverImage?: boolean;

  @IsUUID('4', { message: '无效的用户ID' })
  @IsOptional()
  currentUserId?: string;
}

// 帖子ID参数 DTO
export class PostIdParamDto {
  @IsUUID('4', { message: '无效的帖子ID' })
  id: string;
}

// 帖子操作 DTO（点赞、收藏等）
export class PostActionDto {
  @IsUUID('4', { message: '无效的帖子ID' })
  postId: string;
}

// 帖子管理操作 DTO（置顶、加精等）
export class PostAdminActionDto {
  @IsUUID('4', { message: '无效的帖子ID' })
  postId: string;

  @IsBoolean({ message: '置顶状态必须是布尔值' })
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean({ message: '精选状态必须是布尔值' })
  @IsOptional()
  isFeatured?: boolean;

  @IsEnum(PostStatus, { message: '无效的帖子状态' })
  @IsOptional()
  status?: PostStatus;

  @IsString({ message: '拒绝原因必须是字符串' })
  @IsOptional()
  @MaxLength(500, { message: '拒绝原因长度不能超过500个字符' })
  rejectionReason?: string;
}

/**
 * 点赞帖子 DTO
 * @swagger
 * components:
 *   schemas:
 *     LikePostDto:
 *       type: object
 *       required:
 *         - like
 *       properties:
 *         like:
 *           type: boolean
 *           description: 是否点赞
 */
export class LikePostDto {
  @IsBoolean({ message: '点赞状态必须是布尔值' })
  like: boolean;
}

/**
 * 收藏帖子 DTO
 * @swagger
 * components:
 *   schemas:
 *     FavoritePostDto:
 *       type: object
 *       required:
 *         - favorite
 *       properties:
 *         favorite:
 *           type: boolean
 *           description: 是否收藏
 */
export class FavoritePostDto {
  @IsBoolean({ message: '收藏状态必须是布尔值' })
  favorite: boolean;
}
