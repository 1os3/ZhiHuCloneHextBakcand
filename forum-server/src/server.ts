import app from './app';
import { env } from './config/env.config';
import { logger } from './config/logger.config';
import { initializeDatabase } from './config/database.config';
import { scheduler } from './utils/scheduler.util';
import { initRedisConnection, closeRedisConnection } from './utils/redis.util';

// 启动函数
const startServer = async (): Promise<void> => {
  try {
    // 初始化数据库连接
    await initializeDatabase();
    
    // 初始化 Redis 连接
    initRedisConnection();
    
    // 启动 HTTP 服务器
    const server = app.listen(env.port, () => {
      logger.info(`服务器在 ${env.nodeEnv} 环境下运行，端口: ${env.port}`);
      logger.info(`健康检查: http://localhost:${env.port}/health`);
      
      // 初始化任务调度器
      scheduler.initialize();
      logger.info('任务调度器已启动');
    });
    
    // 处理未捕获的异常
    process.on('uncaughtException', (error: Error) => {
      logger.error('未捕获的异常', { error: error.message, stack: error.stack });
      process.exit(1);
    });
    
    // 处理未处理的 Promise 拒绝
    process.on('unhandledRejection', (reason: any) => {
      logger.error('未处理的 Promise 拒绝', { 
        reason: reason instanceof Error ? reason.message : reason,
        stack: reason instanceof Error ? reason.stack : undefined
      });
    });
    
    // 处理进程终止信号
    process.on('SIGTERM', async () => {
      logger.info('收到 SIGTERM 信号，优雅关闭中...');
      
      // 停止任务调度器
      scheduler.stopAllTasks();
      logger.info('任务调度器已停止');
      
      // 关闭 Redis 连接
      await closeRedisConnection();
      logger.info('Redis 连接已关闭');
      
      server.close(() => {
        logger.info('HTTP 服务器已关闭');
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('服务器启动失败', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
};

// 启动服务器
startServer();
