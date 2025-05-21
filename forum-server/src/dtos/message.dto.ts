import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { MessageStatus } from '../models/message.entity';

// 创建私信 DTO
export class CreateMessageDto {
  @IsString({ message: '内容必须是字符串' })
  @MinLength(1, { message: '内容不能为空' })
  @MaxLength(1000, { message: '内容长度不能超过1000个字符' })
  content: string;

  @IsUUID('4', { message: '无效的接收者ID' })
  recipientId: string;
}

// 更新私信状态 DTO
export class UpdateMessageStatusDto {
  @IsEnum(MessageStatus, { message: '无效的消息状态' })
  status: MessageStatus;
  
  @IsUUID('4', { each: true, message: '包含无效的私俪ID' })
  @IsOptional()
  ids?: string[];
}

// 私信查询参数 DTO
export class MessageQueryDto {
  @IsUUID('4', { message: '无效的发送者ID' })
  @IsOptional()
  senderId?: string;

  @IsUUID('4', { message: '无效的接收者ID' })
  @IsOptional()
  recipientId?: string;

  @IsEnum(MessageStatus, { message: '无效的消息状态' })
  @IsOptional()
  status?: MessageStatus;

  @IsBoolean({ message: '删除状态必须是布尔值' })
  @IsOptional()
  isDeleted?: boolean;

  @IsDateString({}, { message: '创建日期必须是有效的日期字符串' })
  @IsOptional()
  createdAfter?: string;

  @IsDateString({}, { message: '创建日期必须是有效的日期字符串' })
  @IsOptional()
  createdBefore?: string;
  
  @IsUUID('4', { message: '无效的联系人ID' })
  @IsOptional()
  contactId?: string;
}

// 私信ID参数 DTO
export class MessageIdParamDto {
  @IsUUID('4', { message: '无效的私信ID' })
  id: string;
}

// 对话查询 DTO
export class ConversationQueryDto {
  @IsUUID('4', { message: '无效的用户ID' })
  userId: string;
}

// 批量更新私信 DTO
export class BulkUpdateMessagesDto {
  @IsUUID('4', { each: true, message: '包含无效的私俪ID' })
  ids: string[];

  @IsEnum(MessageStatus, { message: '无效的消息状态' })
  @IsOptional()
  status?: MessageStatus;

  @IsBoolean({ message: '删除状态必须是布尔值' })
  @IsOptional()
  isDeleted?: boolean;
}

// 删除私信 DTO
export class DeleteMessageDto {
  @IsUUID('4', { each: true, message: '包含无效的私俪ID' })
  ids: string[];
}
