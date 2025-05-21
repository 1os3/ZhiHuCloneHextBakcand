import Redis from 'ioredis';
import { env } from '../config';
import { logger } from './logger.util';

/**
 * Redis 客户端实例
 */
export let redisClient: Redis | null = null;

/**
 * 初始化 Redis 连接
 */
export const initRedisConnection = (): void => {
  try {
    // 创建 Redis 客户端实例
    redisClient = new Redis({
      host: env.redis.host,
      port: env.redis.port,
      password: env.redis.password,
      retryStrategy: (times: number): number => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    // 监听连接事件
    redisClient.on('connect', () => {
      logger.info('Redis 连接成功');
    });

    // 监听错误事件
    redisClient.on('error', (err: Error) => {
      logger.error(`Redis 连接错误: ${err.message}`);
    });

    // 监听重连事件
    redisClient.on('reconnecting', () => {
      logger.warn('Redis 正在重新连接...');
    });

    // 监听结束事件
    redisClient.on('end', () => {
      logger.warn('Redis 连接已关闭');
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Redis 初始化失败: ${errorMessage}`);
    redisClient = null;
  }
};

/**
 * 关闭 Redis 连接
 */
export const closeRedisConnection = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis 连接已关闭');
  }
};

/**
 * 获取缓存数据
 * @param key 缓存键
 * @returns 缓存数据
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redisClient) {
    return null;
  }

  try {
    const data = await redisClient.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`获取缓存失败: ${errorMessage}`);
    return null;
  }
};

/**
 * 设置缓存数据
 * @param key 缓存键
 * @param value 缓存值
 * @param ttl 过期时间（秒）
 * @returns 是否设置成功
 */
export const setCache = async <T>(key: string, value: T, ttl?: number): Promise<boolean> => {
  if (!redisClient) {
    return false;
  }

  try {
    const stringValue = JSON.stringify(value);
    if (ttl) {
      await redisClient.set(key, stringValue, 'EX', ttl);
    } else {
      await redisClient.set(key, stringValue);
    }
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`设置缓存失败: ${errorMessage}`);
    return false;
  }
};

/**
 * 删除缓存数据
 * @param key 缓存键
 * @returns 是否删除成功
 */
export const deleteCache = async (key: string): Promise<boolean> => {
  if (!redisClient) {
    return false;
  }

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`删除缓存失败: ${errorMessage}`);
    return false;
  }
};

/**
 * 清空所有缓存
 * @returns 是否清空成功
 */
export const clearCache = async (): Promise<boolean> => {
  if (!redisClient) {
    return false;
  }

  try {
    await redisClient.flushdb();
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`清空缓存失败: ${errorMessage}`);
    return false;
  }
};
