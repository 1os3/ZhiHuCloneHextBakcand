import { logger } from '../config/logger.config';
import { FileService } from '../services/file.service';
import { SensitiveWordService } from '../services/sensitive-word.service';
import { LoginAttemptService } from '../services/login-attempt.service';
import { IPFilterService } from '../services/ip-filter.service';
import { LogService } from '../services/log.service';

/**
 * 任务调度器，用于定期执行系统维护任务
 */
export class Scheduler {
  private static instance: Scheduler;
  private fileService: FileService;
  private sensitiveWordService: SensitiveWordService;
  private loginAttemptService: LoginAttemptService;
  private ipFilterService: IPFilterService;
  private logService: LogService;
  private fileCleanupInterval: NodeJS.Timeout | null = null;
  private unusedFileCleanupInterval: NodeJS.Timeout | null = null;
  private loginAttemptCleanupInterval: NodeJS.Timeout | null = null;
  private ipFilterCleanupInterval: NodeJS.Timeout | null = null;
  private logCleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.fileService = new FileService();
    this.sensitiveWordService = new SensitiveWordService();
    this.loginAttemptService = new LoginAttemptService();
    this.ipFilterService = new IPFilterService();
    this.logService = new LogService();
  }

  /**
   * 获取调度器实例（单例模式）
   */
  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }

  /**
   * 初始化调度器，启动所有定时任务
   */
  public initialize(): void {
    logger.info('正在初始化任务调度器...');
    
    // 初始化敏感词过滤器
    this.initializeSensitiveWordFilter();
    
    // 启动文件清理任务
    this.startFileCleanupTask();
    
    // 启动未使用文件清理任务
    this.startUnusedFileCleanupTask();
    
    // 启动登录尝试清理任务
    this.startLoginAttemptCleanupTask();
    
    // 启动IP过滤规则清理任务
    this.startIPFilterCleanupTask();
    
    // 初始IP过滤缓存
    this.initializeIPFilterCache();
    
    // 启动日志清理任务
    this.startLogCleanupTask();
    
    logger.info('任务调度器初始化完成');
  }

  /**
   * 初始化敏感词过滤器
   */
  private async initializeSensitiveWordFilter(): Promise<void> {
    try {
      await this.sensitiveWordService.initializeSensitiveWordFilter();
      logger.info('敏感词过滤器初始化成功');
    } catch (error: any) {
      logger.error(`敏感词过滤器初始化失败: ${error.message}`);
    }
  }

  /**
   * 启动文件清理任务
   * 默认每天凌晨3点执行一次
   */
  private startFileCleanupTask(): void {
    // 清理之前的定时器
    if (this.fileCleanupInterval) {
      clearInterval(this.fileCleanupInterval);
    }

    // 计算首次执行时间（今天凌晨3点）
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      3, 0, 0, 0
    );
    
    // 如果当前时间已经过了今天的执行时间，则设置为明天
    if (now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    
    // 设置首次执行的定时器
    setTimeout(() => {
      this.cleanupExpiredFiles();
      
      // 设置每24小时执行一次的定时器
      this.fileCleanupInterval = setInterval(() => {
        this.cleanupExpiredFiles();
      }, 24 * 60 * 60 * 1000); // 24小时
      
    }, timeUntilNextRun);
    
    logger.info(`文件清理任务已启动，首次执行时间: ${nextRun.toLocaleString()}`);
  }

  /**
   * 启动未使用文件清理任务
   * 默认每周一凌晨4点执行一次
   */
  private startUnusedFileCleanupTask(): void {
    // 清理之前的定时器
    if (this.unusedFileCleanupInterval) {
      clearInterval(this.unusedFileCleanupInterval);
    }

    // 计算首次执行时间（下一个周一凌晨4点）
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      4, 0, 0, 0
    );
    
    // 调整到下一个周一
    const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
    nextRun.setDate(nextRun.getDate() + daysUntilMonday);
    
    // 如果当前是周一且已经过了执行时间，则设置为下周一
    if (daysUntilMonday === 0 && now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 7);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    
    // 设置首次执行的定时器
    setTimeout(() => {
      this.cleanupUnusedFiles();
      
      // 设置每7天执行一次的定时器
      this.unusedFileCleanupInterval = setInterval(() => {
        this.cleanupUnusedFiles();
      }, 7 * 24 * 60 * 60 * 1000); // 7天
      
    }, timeUntilNextRun);
    
    logger.info(`未使用文件清理任务已启动，首次执行时间: ${nextRun.toLocaleString()}`);
  }

  /**
   * 清理过期文件
   */
  private async cleanupExpiredFiles(): Promise<void> {
    try {
      logger.info('开始清理过期文件...');
      const result = await this.fileService.cleanupExpiredFiles();
      logger.info(`过期文件清理完成，共清理 ${result.count} 个文件`);
    } catch (error: any) {
      logger.error(`过期文件清理失败: ${error.message}`);
    }
  }

  /**
   * 清理未使用文件
   * 默认清理90天未访问的文件
   */
  private async cleanupUnusedFiles(days: number = 90): Promise<void> {
    try {
      logger.info(`开始清理 ${days} 天未使用的文件...`);
      const result = await this.fileService.cleanupUnusedFiles(days);
      logger.info(`未使用文件清理完成，共清理 ${result.count} 个文件`);
    } catch (error: any) {
      logger.error(`未使用文件清理失败: ${error.message}`);
    }
  }

  /**
   * 启动登录尝试清理任务
   * 默认每天凌晨3点30分执行一次
   */
  private startLoginAttemptCleanupTask(): void {
    // 清理之前的定时器
    if (this.loginAttemptCleanupInterval) {
      clearInterval(this.loginAttemptCleanupInterval);
    }

    // 计算首次执行时间（今天凌晨3点30分）
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      3, 30, 0, 0
    );
    
    // 如果当前时间已经过了今天的执行时间，则设置为明天
    if (now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    
    // 设置首次执行的定时器
    setTimeout(() => {
      this.cleanupOldLoginAttempts();
      
      // 设置每24小时执行一次的定时器
      this.loginAttemptCleanupInterval = setInterval(() => {
        this.cleanupOldLoginAttempts();
      }, 24 * 60 * 60 * 1000); // 24小时
      
    }, timeUntilNextRun);
    
    logger.info(`登录尝试清理任务已启动，首次执行时间: ${nextRun.toLocaleString()}`);
  }

  /**
   * 清理过期登录尝试记录
   * 默认清琇30天前的记录
   */
  private async cleanupOldLoginAttempts(days: number = 30): Promise<void> {
    try {
      logger.info(`开始清理 ${days} 天前的登录尝试记录...`);
      const count = await this.loginAttemptService.cleanupOldAttempts(days);
      logger.info(`登录尝试记录清理完成，共清理 ${count} 条记录`);
    } catch (error: any) {
      logger.error(`登录尝试记录清理失败: ${error.message}`);
    }
  }

  /**
   * 初始IP过滤缓存
   */
  private async initializeIPFilterCache(): Promise<void> {
    try {
      await this.ipFilterService.initializeCache();
    } catch (error: any) {
      logger.error(`IP过滤缓存初始化失败: ${error.message}`);
    }
  }

  /**
   * 启动IP过滤规则清理任务
   * 默认每天凌晨4点30分执行一次
   */
  private startIPFilterCleanupTask(): void {
    // 清理之前的定时器
    if (this.ipFilterCleanupInterval) {
      clearInterval(this.ipFilterCleanupInterval);
    }

    // 计算首次执行时间（今天凌晨4点30分）
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      4, 30, 0, 0
    );
    
    // 如果当前时间已经过了今天的执行时间，则设置为明天
    if (now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    
    // 设置首次执行的定时器
    setTimeout(() => {
      this.cleanupExpiredIPFilters();
      
      // 设置每24小时执行一次的定时器
      this.ipFilterCleanupInterval = setInterval(() => {
        this.cleanupExpiredIPFilters();
      }, 24 * 60 * 60 * 1000); // 24小时
      
    }, timeUntilNextRun);
    
    logger.info(`IP过滤规则清理任务已启动，首次执行时间: ${nextRun.toLocaleString()}`);
  }

  /**
   * 清理过期的IP过滤规则
   */
  private async cleanupExpiredIPFilters(): Promise<void> {
    try {
      logger.info('开始清理过期的IP过滤规则...');
      const result = await this.ipFilterService.cleanupExpiredFilters();
      logger.info(`IP过滤规则清理完成，共清理 ${result.count} 条规则`);
    } catch (error: any) {
      logger.error(`IP过滤规则清理失败: ${error.message}`);
    }
  }

  /**
   * 启动日志清理任务
   * 默认每周日凌晨2点30分执行一次
   */
  private startLogCleanupTask(): void {
    // 清理之前的定时器
    if (this.logCleanupInterval) {
      clearInterval(this.logCleanupInterval);
    }

    // 计算首次执行时间（下一个周日凌晨2点30分）
    const now = new Date();
    const nextRun = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      2, 30, 0, 0
    );
    
    // 调整到下一个周日
    const daysUntilSunday = (0 + 7 - now.getDay()) % 7;
    nextRun.setDate(nextRun.getDate() + daysUntilSunday);
    
    // 如果当前是周日且已经过了执行时间，则设置为下周日
    if (daysUntilSunday === 0 && now > nextRun) {
      nextRun.setDate(nextRun.getDate() + 7);
    }
    
    const timeUntilNextRun = nextRun.getTime() - now.getTime();
    
    // 设置首次执行的定时器
    setTimeout(() => {
      this.cleanupOldLogs();
      
      // 设置每7天执行一次的定时器
      this.logCleanupInterval = setInterval(() => {
        this.cleanupOldLogs();
      }, 7 * 24 * 60 * 60 * 1000); // 7天
      
    }, timeUntilNextRun);
    
    logger.info(`日志清理任务已启动，首次执行时间: ${nextRun.toLocaleString()}`);
  }

  /**
   * 清理过期日志
   * 默认清琇90天前的日志
   */
  private async cleanupOldLogs(days: number = 90): Promise<void> {
    try {
      logger.info(`开始清理 ${days} 天前的日志...`);
      const result = await this.logService.cleanupOldLogs(days);
      logger.info(`日志清理完成，共清理 ${result.activityLogs} 条操作日志和 ${result.accessLogs} 条访问日志`);
    } catch (error: any) {
      logger.error(`日志清理失败: ${error.message}`);
    }
  }

  /**
   * 停止所有定时任务
   */
  public stopAllTasks(): void {
    if (this.fileCleanupInterval) {
      clearInterval(this.fileCleanupInterval);
      this.fileCleanupInterval = null;
    }
    
    if (this.unusedFileCleanupInterval) {
      clearInterval(this.unusedFileCleanupInterval);
      this.unusedFileCleanupInterval = null;
    }
    
    if (this.loginAttemptCleanupInterval) {
      clearInterval(this.loginAttemptCleanupInterval);
      this.loginAttemptCleanupInterval = null;
    }
    
    if (this.ipFilterCleanupInterval) {
      clearInterval(this.ipFilterCleanupInterval);
      this.ipFilterCleanupInterval = null;
    }
    
    if (this.logCleanupInterval) {
      clearInterval(this.logCleanupInterval);
      this.logCleanupInterval = null;
    }
    
    logger.info('所有定时任务已停止');
  }
}

// 导出单例实例
export const scheduler = Scheduler.getInstance();
