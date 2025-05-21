import { IsEnum, IsString, IsOptional, IsBoolean, IsDateString, IsIP, ValidateIf, Matches } from 'class-validator';
import { IPFilterType } from '../models/ip-filter.entity';

/**
 * 创建IP过滤规则DTO
 */
export class CreateIPFilterDto {
  @IsString()
  @ValidateIf((o) => !o.ipAddress.includes('/'))
  @IsIP(undefined, { message: '请提供有效的IP地址' })
  @ValidateIf((o) => o.ipAddress.includes('/'))
  @Matches(/^(?:\d{1,3}\.){3}\d{1,3}\/\d{1,2}$|^[0-9a-fA-F:]+\/\d{1,3}$/, { 
    message: '请提供有效的IP地址或CIDR格式' 
  })
  ipAddress: string;

  @IsEnum(IPFilterType, { message: '过滤类型必须是 whitelist 或 blacklist' })
  type: IPFilterType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/**
 * 更新IP过滤规则DTO
 */
export class UpdateIPFilterDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

/**
 * IP过滤查询DTO
 */
export class IPFilterQueryDto {
  @IsOptional()
  @IsEnum(IPFilterType, { message: '过滤类型必须是 whitelist 或 blacklist' })
  type?: IPFilterType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
