import { IsEnum, IsString, IsOptional, IsDateString, IsInt, Min, IsUUID } from 'class-validator';
import { ActivityType } from '../models/activity-log.entity';
import { HttpMethod } from '../models/access-log.entity';
import { Transform } from 'class-transformer';

/**
 * 操作日志查询DTO
 */
export class ActivityLogQueryDto {
  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsEnum(ActivityType, { message: '无效的操作类型' })
  type?: ActivityType;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

/**
 * 访问日志查询DTO
 */
export class AccessLogQueryDto {
  @IsOptional()
  @IsString()
  path?: string;

  @IsOptional()
  @IsEnum(HttpMethod, { message: '无效的HTTP方法' })
  method?: HttpMethod;

  @IsOptional()
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10))
  statusCode?: number;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 10;
}

/**
 * 访问统计查询DTO
 */
export class AccessStatsQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

/**
 * 日志清理DTO
 */
export class LogCleanupDto {
  @IsInt()
  @Min(1)
  days: number = 90;
}
