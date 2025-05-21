import { Request, Response, NextFunction } from 'express';
import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.config';
import { logger } from '../config/logger.config';

// 创建基本限流中间件
export const createRateLimiter = (
  windowMs: number = env.rateLimit.windowMs,
  max: number = env.rateLimit.max,
  message: string = '请求过于频繁，请稍后再试'
) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true, // 返回 RateLimit-* 标准头
    legacyHeaders: false, // 禁用 X-RateLimit-* 头
    message: { success: false, error: { message } },
    skip: (req: Request) => {
      // 可以在这里添加白名单逻辑
      return false;
    },
    keyGenerator: (req: Request) => {
      // 使用 IP 地址作为限流键
      return req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown';
    },
    handler: (req: Request, res: Response, next: NextFunction, options: any) => {
      // 记录限流事件
      logger.warn({
        message: '请求被限流',
        ip: req.ip,
        path: req.path,
        method: req.method,
        userId: req.user?.id || 'anonymous',
      });
      
      // 发送限流响应
      res.status(429).json(options.message);
    },
  });
};

// 登录限流中间件（更严格的限制）
export const loginRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15分钟窗口
  5, // 最多5次尝试
  '登录尝试次数过多，请15分钟后再试'
);

// API 通用限流中间件
export const apiRateLimiter = createRateLimiter();

// 特定路由的限流中间件（例如注册）
export const registrationRateLimiter = createRateLimiter(
  60 * 60 * 1000, // 1小时窗口
  3, // 最多3次尝试
  '注册尝试次数过多，请1小时后再试'
);
