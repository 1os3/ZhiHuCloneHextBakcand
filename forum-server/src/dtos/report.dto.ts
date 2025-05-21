import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ReportType, ReportStatus } from '../models/report.entity';

// 创建举报 DTO
export class CreateReportDto {
  @IsEnum(ReportType, { message: '无效的举报类型' })
  type: ReportType;

  @IsString({ message: '原因必须是字符串' })
  @MinLength(5, { message: '原因长度不能少于5个字符' })
  @MaxLength(500, { message: '原因长度不能超过500个字符' })
  reason: string;

  @IsUUID('4', { message: '无效的帖子ID' })
  @IsOptional()
  postId?: string;

  @IsUUID('4', { message: '无效的评论ID' })
  @IsOptional()
  commentId?: string;

  @IsUUID('4', { message: '无效的用户ID' })
  @IsOptional()
  reportedUserId?: string;

  @IsDateString({}, { message: '开始日期格式无效' })
  @IsOptional()
  startDate?: Date;

  @IsDateString({}, { message: '结束日期格式无效' })
  @IsOptional()
  endDate?: Date;

  // 实际上就是 postId、commentId 或 reportedUserId 中的一个
  // 用于在控制器中显示
  get targetId(): string {
    return this.postId || this.commentId || this.reportedUserId || '';
  }
}

// 处理举报 DTO
export class ResolveReportDto {
  @IsEnum(ReportStatus, { message: '无效的举报状态' })
  status: ReportStatus;

  @IsString({ message: '处理结果必须是字符串' })
  @MinLength(5, { message: '处理结果长度不能少于5个字符' })
  @MaxLength(500, { message: '处理结果长度不能超过500个字符' })
  resolution: string;
}

// 举报查询参数 DTO

export class ReportQueryDto {
  @IsEnum(ReportType, { message: '无效的举报类型' })
  @IsOptional()
  type?: ReportType;

  @IsEnum(ReportStatus, { message: '无效的举报状态' })
  @IsOptional()
  status?: ReportStatus;

  @IsUUID('4', { message: '无效的举报者ID' })
  @IsOptional()
  reporterId?: string;

  @IsUUID('4', { message: '无效的被举报用户ID' })
  @IsOptional()
  reportedUserId?: string;

  @IsUUID('4', { message: '无效的帖子ID' })
  @IsOptional()
  postId?: string;

  @IsUUID('4', { message: '无效的评论ID' })
  @IsOptional()
  commentId?: string;
  
  @IsDateString({}, { message: '开始日期格式无效' })
  @IsOptional()
  createdAfter?: Date;

  @IsDateString({}, { message: '结束日期格式无效' })
  @IsOptional()
  createdBefore?: Date;
  
  // 兼容属性，用于控制器中的日期过滤
  @IsDateString({}, { message: '开始日期格式无效' })
  @IsOptional()
  startDate?: Date;
  
  @IsDateString({}, { message: '结束日期格式无效' })
  @IsOptional()
  endDate?: Date;
}

// 举报ID参数 DTO
export class ReportIdParamDto {
  @IsUUID('4', { message: '无效的举报ID' })
  id: string;
}
