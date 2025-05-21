import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 操作类型枚举
 */
export enum ActivityType {
  LOGIN = 'login',                 // 登录
  LOGOUT = 'logout',               // 登出
  REGISTER = 'register',           // 注册
  CREATE = 'create',               // 创建
  UPDATE = 'update',               // 更新
  DELETE = 'delete',               // 删除
  UPLOAD = 'upload',               // 上传
  DOWNLOAD = 'download',           // 下载
  ADMIN_ACTION = 'admin_action',   // 管理员操作
  SYSTEM = 'system',               // 系统操作
  OTHER = 'other'                  // 其他
}

/**
 * 操作日志实体
 * 用于记录用户和系统的操作日志
 */
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActivityType,
    default: ActivityType.OTHER,
    comment: '操作类型'
  })
  @Index()
  type: ActivityType;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '操作描述'
  })
  description: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '操作详情'
  })
  details: string;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '用户ID'
  })
  @Index()
  userId: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: '用户名'
  })
  username: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
    comment: 'IP地址'
  })
  @Index()
  ipAddress: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '用户代理'
  })
  userAgent: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '资源类型'
  })
  resourceType: string;

  @Column({
    type: 'varchar',
    length: 36,
    nullable: true,
    comment: '资源ID'
  })
  resourceId: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '操作是否成功'
  })
  success: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '失败原因'
  })
  failureReason: string;

  @CreateDateColumn({
    comment: '创建时间'
  })
  @Index()
  createdAt: Date;
}
