import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { NotificationType } from '../models/notification.entity';

// 创建通知 DTO
export class CreateNotificationDto {
  @IsEnum(NotificationType, { message: '无效的通知类型' })
  type: NotificationType;

  @IsString({ message: '消息内容必须是字符串' })
  @MinLength(1, { message: '消息内容不能为空' })
  @MaxLength(500, { message: '消息内容长度不能超过500个字符' })
  message: string;

  @IsUUID('4', { message: '无效的接收者ID' })
  recipientId: string;

  @IsUUID('4', { message: '无效的发送者ID' })
  @IsOptional()
  senderId?: string;

  @IsUUID('4', { message: '无效的帖子ID' })
  @IsOptional()
  postId?: string;

  @IsUUID('4', { message: '无效的评论ID' })
  @IsOptional()
  commentId?: string;

  @IsString({ message: '链接必须是字符串' })
  @IsOptional()
  link?: string;
}

// 更新通知 DTO
export class UpdateNotificationDto {
  @IsBoolean({ message: '已读状态必须是布尔值' })
  isRead: boolean;

  @IsUUID('4', { each: true, message: '包含无效的通知ID' })
  @IsOptional()
  ids?: string[];
}

// 通知查询参数 DTO
export class NotificationQueryDto {
  @IsUUID('4', { message: '无效的接收者ID' })
  @IsOptional()
  recipientId?: string;

  @IsEnum(NotificationType, { message: '无效的通知类型' })
  @IsOptional()
  type?: NotificationType;

  @IsBoolean({ message: '已读状态必须是布尔值' })
  @IsOptional()
  isRead?: boolean;

  @IsDateString({}, { message: '创建日期必须是有效的日期字符串' })
  @IsOptional()
  createdAfter?: string;

  @IsDateString({}, { message: '创建日期必须是有效的日期字符串' })
  @IsOptional()
  createdBefore?: string;
}

// 通知ID参数 DTO
export class NotificationIdParamDto {
  @IsUUID('4', { message: '无效的通知ID' })
  id: string;
}

// 批量更新通知 DTO
export class BulkUpdateNotificationsDto {
  @IsUUID('4', { each: true, message: '包含无效的通知ID' })
  ids: string[];

  @IsBoolean({ message: '已读状态必须是布尔值' })
  isRead: boolean;
}
