import { Repository, LessThan, MoreThanOrEqual } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { LoginAttempt } from '../models/login-attempt.entity';
import { logger } from '../config/logger.config';
import { ApiError, HttpStatus } from '../utils/error.util';

/**
 * 登录尝试服务类
 * 用于记录登录尝试和管理账户锁定
 */
export class LoginAttemptService {
  private readonly loginAttemptRepository: Repository<LoginAttempt>;
  private readonly MAX_FAILED_ATTEMPTS = 5; // 最大失败尝试次数
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 锁定时间（15分钟）
  private readonly ATTEMPT_WINDOW = 30 * 60 * 1000; // 尝试窗口时间（30分钟）

  constructor() {
    this.loginAttemptRepository = AppDataSource.getRepository(LoginAttempt);
  }

  /**
   * 记录登录尝试
   * @param identifier 用户标识符（用户名、邮箱或IP地址）
   * @param success 是否成功
   * @param ipAddress IP地址
   * @param userAgent 用户代理
   * @param reason 失败原因
   */
  async recordAttempt(
    identifier: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    reason?: string
  ): Promise<LoginAttempt> {
    try {
      const attempt = this.loginAttemptRepository.create({
        identifier,
        success,
        ipAddress,
        userAgent,
        reason
      });

      return await this.loginAttemptRepository.save(attempt);
    } catch (error: any) {
      logger.error(`记录登录尝试失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '记录登录尝试失败');
    }
  }

  /**
   * 检查账户是否被锁定
   * @param identifier 用户标识符（用户名、邮箱或IP地址）
   * @returns 是否被锁定以及剩余锁定时间（秒）
   */
  async isAccountLocked(identifier: string): Promise<{ locked: boolean; remainingTime: number }> {
    try {
      // 获取最近的成功登录时间
      const lastSuccessfulLogin = await this.loginAttemptRepository.findOne({
        where: {
          identifier,
          success: true
        },
        order: {
          createdAt: 'DESC'
        }
      });

      // 计算查询窗口的开始时间
      const windowStart = new Date();
      windowStart.setTime(windowStart.getTime() - this.ATTEMPT_WINDOW);

      // 如果有成功登录，并且成功登录时间在窗口内，从成功登录时间开始计算
      const startTime = lastSuccessfulLogin && lastSuccessfulLogin.createdAt > windowStart
        ? lastSuccessfulLogin.createdAt
        : windowStart;

      // 获取窗口内的失败尝试次数
      const failedAttempts = await this.loginAttemptRepository.count({
        where: {
          identifier,
          success: false,
          createdAt: MoreThanOrEqual(startTime)
        }
      });

      // 如果失败次数超过最大尝试次数
      if (failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        // 获取最近一次失败尝试的时间
        const lastFailedAttempt = await this.loginAttemptRepository.findOne({
          where: {
            identifier,
            success: false
          },
          order: {
            createdAt: 'DESC'
          }
        });

        if (lastFailedAttempt) {
          // 计算锁定结束时间
          const lockEndTime = new Date(lastFailedAttempt.createdAt.getTime() + this.LOCKOUT_DURATION);
          const now = new Date();

          // 如果当前时间小于锁定结束时间，账户仍然被锁定
          if (now < lockEndTime) {
            const remainingTime = Math.ceil((lockEndTime.getTime() - now.getTime()) / 1000);
            return { locked: true, remainingTime };
          }
        }
      }

      return { locked: false, remainingTime: 0 };
    } catch (error: any) {
      logger.error(`检查账户锁定状态失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '检查账户锁定状态失败');
    }
  }

  /**
   * 重置账户锁定状态
   * @param identifier 用户标识符（用户名、邮箱或IP地址）
   */
  async resetLockout(identifier: string): Promise<void> {
    try {
      // 记录一次成功的登录尝试，这将重置锁定状态
      await this.recordAttempt(identifier, true);
    } catch (error: any) {
      logger.error(`重置账户锁定状态失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '重置账户锁定状态失败');
    }
  }

  /**
   * 清理过期的登录尝试记录
   * @param days 保留天数，默认30天
   */
  async cleanupOldAttempts(days: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await this.loginAttemptRepository.delete({
        createdAt: LessThan(cutoffDate)
      });

      logger.info(`清理了 ${result.affected || 0} 条过期的登录尝试记录`);
      return result.affected || 0;
    } catch (error: any) {
      logger.error(`清理过期登录尝试记录失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '清理过期登录尝试记录失败');
    }
  }

  /**
   * 获取用户的登录尝试历史
   * @param identifier 用户标识符（用户名、邮箱或IP地址）
   * @param limit 限制数量
   */
  async getLoginHistory(identifier: string, limit: number = 10): Promise<LoginAttempt[]> {
    try {
      return await this.loginAttemptRepository.find({
        where: { identifier },
        order: { createdAt: 'DESC' },
        take: limit
      });
    } catch (error: any) {
      logger.error(`获取登录历史失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '获取登录历史失败');
    }
  }
}
