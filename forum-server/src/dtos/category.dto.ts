import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsBoolean, IsInt, Min, Max } from 'class-validator';

// 创建分类 DTO
export class CreateCategoryDto {
  @IsString({ message: '名称必须是字符串' })
  @MinLength(2, { message: '名称长度不能少于2个字符' })
  @MaxLength(50, { message: '名称长度不能超过50个字符' })
  name: string;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  @MaxLength(200, { message: '描述长度不能超过200个字符' })
  description?: string;

  @IsString({ message: '图标必须是字符串' })
  @IsOptional()
  icon?: string;

  @IsInt({ message: '排序必须是整数' })
  @Min(0, { message: '排序不能小于0' })
  @Max(1000, { message: '排序不能大于1000' })
  @IsOptional()
  order?: number;

  @IsBoolean({ message: '激活状态必须是布尔值' })
  @IsOptional()
  isActive?: boolean;

  @IsUUID('4', { message: '无效的父分类ID' })
  @IsOptional()
  parentId?: string;
}

// 更新分类 DTO
export class UpdateCategoryDto {
  @IsString({ message: '名称必须是字符串' })
  @MinLength(2, { message: '名称长度不能少于2个字符' })
  @MaxLength(50, { message: '名称长度不能超过50个字符' })
  @IsOptional()
  name?: string;

  @IsString({ message: '描述必须是字符串' })
  @IsOptional()
  @MaxLength(200, { message: '描述长度不能超过200个字符' })
  description?: string;

  @IsString({ message: '图标必须是字符串' })
  @IsOptional()
  icon?: string;

  @IsInt({ message: '排序必须是整数' })
  @Min(0, { message: '排序不能小于0' })
  @Max(1000, { message: '排序不能大于1000' })
  @IsOptional()
  order?: number;

  @IsBoolean({ message: '激活状态必须是布尔值' })
  @IsOptional()
  isActive?: boolean;

  @IsUUID('4', { message: '无效的父分类ID' })
  @IsOptional()
  parentId?: string;
}

// 分类查询参数 DTO
export class CategoryQueryDto {
  @IsString({ message: '搜索关键词必须是字符串' })
  @IsOptional()
  search?: string;

  @IsUUID('4', { message: '无效的父分类ID' })
  @IsOptional()
  parentId?: string;

  @IsBoolean({ message: '激活状态必须是布尔值' })
  @IsOptional()
  isActive?: boolean;
}

// 分类ID参数 DTO
export class CategoryIdParamDto {
  @IsUUID('4', { message: '无效的分类ID' })
  id: string;
}
