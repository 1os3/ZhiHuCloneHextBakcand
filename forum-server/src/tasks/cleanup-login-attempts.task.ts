import { CronJob } from 'cron';
import { LoginAttemptService } from '../services/login-attempt.service';
import { logger } from '../config/logger.config';

/**
 * 清理过期登录尝试记录的定时任务
 * 每天凌晨3点运行
 */
export class CleanupLoginAttemptsTask {
  private readonly loginAttemptService: LoginAttemptService;
  private readonly cronJob: CronJob;

  constructor() {
    this.loginAttemptService = new LoginAttemptService();
    
    // 创建定时任务，每天凌晨3点运行
    this.cronJob = new CronJob('0 0 3 * * *', this.execute.bind(this), null, false, 'Asia/Shanghai');
  }

  /**
   * 启动定时任务
   */
  start(): void {
    this.cronJob.start();
    logger.info('登录尝试清理定时任务已启动');
  }

  /**
   * 停止定时任务
   */
  stop(): void {
    this.cronJob.stop();
    logger.info('登录尝试清理定时任务已停止');
  }

  /**
   * 执行清理任务
   */
  async execute(): Promise<void> {
    try {
      logger.info('开始清理过期登录尝试记录...');
      
      // 清理30天前的登录尝试记录
      const deletedCount = await this.loginAttemptService.cleanupOldAttempts(30);
      
      logger.info(`成功清理 ${deletedCount} 条过期登录尝试记录`);
    } catch (error: any) {
      logger.error(`清理过期登录尝试记录失败: ${error.message}`);
    }
  }

  /**
   * 手动执行清理任务
   */
  async manualExecute(): Promise<number> {
    try {
      return await this.loginAttemptService.cleanupOldAttempts(30);
    } catch (error: any) {
      logger.error(`手动清理过期登录尝试记录失败: ${error.message}`);
      throw error;
    }
  }
}
