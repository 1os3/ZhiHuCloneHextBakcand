import { IsEmail, IsString, MinLength, MaxLength, IsOptional, Matches, IsEnum, IsBoolean, IsUUID, IsDate } from 'class-validator';
import { UserRole, UserStatus } from '../models/user.entity';

// 用户注册 DTO
export class RegisterUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '用户名只能包含字母、数字、下划线和连字符' })
  username: string;

  @IsEmail({}, { message: '请提供有效的电子邮件地址' })
  email: string;

  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于8个字符' })
  @MaxLength(100, { message: '密码长度不能超过100个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/, {
    message: '密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  password: string;

  @IsString({ message: '昵称必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '昵称长度不能超过50个字符' })
  nickname?: string;
}

// 用户登录 DTO
export class LoginUserDto {
  @IsString({ message: '用户名或邮箱必须是字符串' })
  usernameOrEmail: string;

  @IsString({ message: '密码必须是字符串' })
  password: string;
}

// 更新用户资料 DTO
export class UpdateUserProfileDto {
  @IsString({ message: '昵称必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '昵称长度不能超过50个字符' })
  nickname?: string;

  @IsString({ message: '头像必须是字符串' })
  @IsOptional()
  avatar?: string;

  @IsString({ message: '个人简介必须是字符串' })
  @IsOptional()
  @MaxLength(500, { message: '个人简介长度不能超过500个字符' })
  bio?: string;

  @IsString({ message: '手机号必须是字符串' })
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '请提供有效的手机号码' })
  phone?: string;
}

// 更改密码 DTO
export class ChangePasswordDto {
  @IsString({ message: '当前密码必须是字符串' })
  currentPassword: string;

  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度不能少于8个字符' })
  @MaxLength(100, { message: '新密码长度不能超过100个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/, {
    message: '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  newPassword: string;

  @IsString({ message: '确认密码必须是字符串' })
  confirmPassword: string;
}

// 重置密码 DTO
export class ResetPasswordDto {
  @IsString({ message: '令牌必须是字符串' })
  token: string;

  @IsString({ message: '新密码必须是字符串' })
  @MinLength(8, { message: '新密码长度不能少于8个字符' })
  @MaxLength(100, { message: '新密码长度不能超过100个字符' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]+$/, {
    message: '新密码必须包含至少一个大写字母、一个小写字母和一个数字',
  })
  newPassword: string;

  @IsString({ message: '确认密码必须是字符串' })
  confirmPassword: string;
}

// 忘记密码 DTO
export class ForgotPasswordDto {
  @IsEmail({}, { message: '请提供有效的电子邮件地址' })
  email: string;
}

// 管理员更新用户 DTO
export class AdminUpdateUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @IsOptional()
  @MinLength(3, { message: '用户名长度不能少于3个字符' })
  @MaxLength(20, { message: '用户名长度不能超过20个字符' })
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: '用户名只能包含字母、数字、下划线和连字符' })
  username?: string;

  @IsEmail({}, { message: '请提供有效的电子邮件地址' })
  @IsOptional()
  email?: string;

  @IsString({ message: '昵称必须是字符串' })
  @IsOptional()
  @MaxLength(50, { message: '昵称长度不能超过50个字符' })
  nickname?: string;

  @IsEnum(UserRole, { message: '无效的用户角色' })
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus, { message: '无效的用户状态' })
  @IsOptional()
  status?: UserStatus;

  @IsBoolean({ message: '邮箱验证状态必须是布尔值' })
  @IsOptional()
  emailVerified?: boolean;

  @IsBoolean({ message: '手机验证状态必须是布尔值' })
  @IsOptional()
  phoneVerified?: boolean;
}

// 用户查询参数 DTO
export class UserQueryDto {
  @IsString({ message: '搜索关键词必须是字符串' })
  @IsOptional()
  search?: string;

  @IsEnum(UserRole, { message: '无效的用户角色' })
  @IsOptional()
  role?: UserRole;

  @IsEnum(UserStatus, { message: '无效的用户状态' })
  @IsOptional()
  status?: UserStatus;

  @IsBoolean({ message: '邮箱验证状态必须是布尔值' })
  @IsOptional()
  emailVerified?: boolean;

  @IsDate({ message: '创建日期必须是有效的日期' })
  @IsOptional()
  createdAfter?: Date;

  @IsDate({ message: '创建日期必须是有效的日期' })
  @IsOptional()
  createdBefore?: Date;
}

// 用户ID参数 DTO
export class UserIdParamDto {
  @IsUUID('4', { message: '无效的用户ID' })
  id: string;
}
