import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * 登录尝试实体
 * 用于记录用户登录尝试，防止暴力破解攻击
 */
@Entity('login_attempts')
export class LoginAttempt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  @Index()
  identifier: string; // 用户标识符（用户名、邮箱或IP地址）

  @Column({ default: false })
  success: boolean; // 登录是否成功

  @Column({ nullable: true, length: 255 })
  ipAddress: string; // IP地址

  @Column({ nullable: true, length: 255 })
  userAgent: string; // 用户代理

  @Column({ nullable: true, length: 255 })
  reason: string; // 失败原因

  @CreateDateColumn()
  @Index()
  createdAt: Date; // 尝试时间
}
