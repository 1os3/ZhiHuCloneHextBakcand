import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * IP过滤类型枚举
 */
export enum IPFilterType {
  WHITELIST = 'whitelist', // 白名单
  BLACKLIST = 'blacklist'  // 黑名单
}

/**
 * IP过滤实体
 * 用于管理IP黑白名单
 */
@Entity('ip_filters')
export class IPFilter {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 45,
    comment: 'IP地址或CIDR格式的IP范围'
  })
  @Index()
  ipAddress: string;

  @Column({
    type: 'enum',
    enum: IPFilterType,
    default: IPFilterType.BLACKLIST,
    comment: 'IP过滤类型：白名单或黑名单'
  })
  type: IPFilterType;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: '备注说明'
  })
  description: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: '是否启用'
  })
  isActive: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: '过期时间，为空表示永不过期'
  })
  expiresAt: Date | null;

  @CreateDateColumn({
    comment: '创建时间'
  })
  createdAt: Date;

  @UpdateDateColumn({
    comment: '更新时间'
  })
  updatedAt: Date;
}
