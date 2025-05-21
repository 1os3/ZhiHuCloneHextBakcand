import { IsEnum, IsOptional, IsString, IsUUID, IsDate, IsInt } from 'class-validator';
import { FileType, FileStatus } from '../models/file.entity';

export class FileUploadDto {
  @IsOptional()
  @IsString({ message: '文件描述必须是字符串' })
  description?: string;

  @IsOptional()
  @IsEnum(FileType, { message: '无效的文件类型' })
  type?: FileType;

  @IsOptional()
  @IsUUID('4', { message: '无效的关联ID' })
  relatedId?: string;
}

export class FileQueryDto {
  @IsOptional()
  @IsEnum(FileType, { message: '无效的文件类型' })
  type?: FileType;

  @IsOptional()
  @IsUUID('4', { message: '无效的用户ID' })
  userId?: string;

  @IsOptional()
  @IsString({ message: '文件名必须是字符串' })
  filename?: string;
}

export class FileUpdateDto {
  @IsOptional()
  @IsString({ message: '文件名必须是字符串' })
  filename?: string;

  @IsOptional()
  @IsString({ message: '文件描述必须是字符串' })
  description?: string;
  
  @IsOptional()
  @IsEnum(FileStatus, { message: '无效的文件状态' })
  status?: FileStatus;
  
  @IsOptional()
  expiresAt?: Date;
  
  @IsOptional()
  @IsInt({ message: '过期天数必须是整数' })
  expirationDays?: number;
}
