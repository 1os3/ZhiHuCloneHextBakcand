import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsBoolean } from 'class-validator';

// 创建评论 DTO
export class CreateCommentDto {
  @IsString({ message: '内容必须是字符串' })
  @MinLength(1, { message: '内容不能为空' })
  @MaxLength(1000, { message: '内容长度不能超过1000个字符' })
  content: string;

  @IsUUID('4', { message: '无效的帖子ID' })
  postId: string;

  @IsUUID('4', { message: '无效的父评论ID' })
  @IsOptional()
  parentId?: string;

  @IsUUID('4', { message: '无效的引用评论ID' })
  @IsOptional()
  quotedCommentId?: string;
}

// 更新评论 DTO
export class UpdateCommentDto {
  @IsString({ message: '内容必须是字符串' })
  @MinLength(1, { message: '内容不能为空' })
  @MaxLength(1000, { message: '内容长度不能超过1000个字符' })
  content: string;
}

// 评论查询参数 DTO
export class CommentQueryDto {
  @IsUUID('4', { message: '无效的帖子ID' })
  @IsOptional()
  postId?: string;

  @IsUUID('4', { message: '无效的作者ID' })
  @IsOptional()
  authorId?: string;

  @IsUUID('4', { message: '无效的父评论ID' })
  @IsOptional()
  parentId?: string;

  @IsBoolean({ message: '删除状态必须是布尔值' })
  @IsOptional()
  isDeleted?: boolean;
}

// 评论ID参数 DTO
export class CommentIdParamDto {
  @IsUUID('4', { message: '无效的评论ID' })
  id: string;
}

// 评论操作 DTO（点赞等）
export class CommentActionDto {
  @IsUUID('4', { message: '无效的评论ID' })
  commentId: string;
}

// 点赞评论 DTO
export class LikeCommentDto {
  @IsBoolean({ message: '点赞状态必须是布尔值' })
  like: boolean;
}
