import { Request, Response } from 'express';
import { getConnection } from 'typeorm';
import { redisClient } from '../utils/redis.util';

/**
 * 健康检查控制器
 * 用于检查应用程序的健康状态，包括数据库连接和 Redis 连接
 */
class HealthController {
  /**
   * 获取应用程序的健康状态
   * @param req 请求对象
   * @param res 响应对象
   */
  public async getHealth(req: Request, res: Response): Promise<void> {
    try {
      // 检查数据库连接
      const dbStatus = await this.checkDatabase();
      
      // 检查 Redis 连接
      const redisStatus = await this.checkRedis();
      
      // 应用程序状态
      const appStatus = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        database: dbStatus,
        redis: redisStatus
      };
      
      res.status(200).json(appStatus);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: errorMessage
      });
    }
  }

  /**
   * 检查数据库连接状态
   * @returns 数据库连接状态
   */
  private async checkDatabase(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      const startTime = Date.now();
      const connection = getConnection();
      const isConnected = connection.isConnected;
      
      if (!isConnected) {
        return { status: 'error', error: 'Database connection is not established' };
      }
      
      // 执行简单查询以确保连接正常工作
      await connection.query('SELECT 1');
      const latency = Date.now() - startTime;
      
      return { status: 'ok', latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { status: 'error', error: errorMessage };
    }
  }

  /**
   * 检查 Redis 连接状态
   * @returns Redis 连接状态
   */
  private async checkRedis(): Promise<{ status: string; latency?: number; error?: string }> {
    try {
      if (!redisClient) {
        return { status: 'error', error: 'Redis client is not initialized' };
      }
      
      const startTime = Date.now();
      await redisClient.ping();
      const latency = Date.now() - startTime;
      
      return { status: 'ok', latency };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { status: 'error', error: errorMessage };
    }
  }
}

export default new HealthController();
