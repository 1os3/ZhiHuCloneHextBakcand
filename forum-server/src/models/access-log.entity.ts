import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * HTTP方法枚举
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD'
}

/**
 * 访问日志实体
 * 用于记录系统的访问日志
 */
@Entity('access_logs')
export class AccessLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 255,
    comment: '请求路径'
  })
  @Index()
  path: string;

  @Column({
    type: 'enum',
    enum: HttpMethod,
    comment: 'HTTP方法'
  })
  method: HttpMethod;

  @Column({
    type: 'int',
    comment: 'HTTP状态码'
  })
  @Index()
  statusCode: number;

  @Column({
    type: 'int',
    comment: '响应时间(毫秒)'
  })
  responseTime: number;

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
    comment: '引用页'
  })
  referer: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '请求参数'
  })
  requestParams: object;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: '请求体摘要'
  })
  requestBody: object;

  @Column({
    type: 'text',
    nullable: true,
    comment: '错误信息'
  })
  errorMessage: string;

  @CreateDateColumn({
    comment: '创建时间'
  })
  @Index()
  createdAt: Date;
}
