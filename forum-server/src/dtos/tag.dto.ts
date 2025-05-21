import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsBoolean } from 'class-validator';

// 创建标签 DTO
export class CreateTagDto {
  @IsString({ message: '名称必须是字符串' })
  @MinLength(2, { message: '名称长度不能少于2个字符' })
  @MaxLength(30, { message: '名称长度不能超过30个字符' })
  name: string;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  @MaxLength(200, { message: '描述长度不能超过200个字符' })
  description?: string;

  @IsBoolean({ message: '激活状态必须是布尔值' })
  @IsOptional()
  isActive?: boolean;
}

// 更新标签 DTO
export class UpdateTagDto {
  @IsString({ message: '名称必须是字符串' })
  @MinLength(2, { message: '名称长度不能少于2个字符' })
  @MaxLength(30, { message: '名称长度不能超过30个字符' })
  @IsOptional()
  name?: string;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  @MaxLength(200, { message: '描述长度不能超过200个字符' })
  description?: string;

  @IsBoolean({ message: '激活状态必须是布尔值' })
  @IsOptional()
  isActive?: boolean;
}

// 标签查询参数 DTO
export class TagQueryDto {
  @IsString({ message: '搜索关键词必须是字符串' })
  @IsOptional()
  search?: string;

  @IsBoolean({ message: '激活状态必须是布尔值' })
  @IsOptional()
  isActive?: boolean;
}

// 标签ID参数 DTO
export class TagIdParamDto {
  @IsUUID('4', { message: '无效的标签ID' })
  id: string;
}
