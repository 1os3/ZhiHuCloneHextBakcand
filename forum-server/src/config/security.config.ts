import helmet from 'helmet';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { env } from './env.config';

// Helmet 配置（防 XSS/Clickjacking 等）
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', `https://${env.aws.s3Bucket}.s3.amazonaws.com`],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'same-origin' },
});

// CORS 配置
export const corsConfig = cors({
  origin: env.nodeEnv === 'production' ? [/\.yourdomain\.com$/] : env.clientUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  credentials: true,
  maxAge: 86400, // 24小时
});

// 限流配置（Rate Limiting）
export const rateLimitConfig = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' },
  skip: (req) => {
    // 可以在这里添加白名单逻辑
    return false;
  },
});

// IP 黑名单检查中间件
export const ipBlacklistConfig = (blacklist: string[]) => {
  return (req: any, res: any, next: any) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    if (blacklist.includes(clientIp)) {
      return res.status(403).json({ error: '访问被拒绝' });
    }
    next();
  };
};
