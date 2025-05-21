import express, { Application, Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import cookieParser from 'cookie-parser';
import 'reflect-metadata';

// 导入配置
import { env, morganStream, helmetConfig, corsConfig, rateLimitConfig } from './config';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
// 导入CSRF中间件
import { csrfMiddleware, generateCsrfToken } from './middlewares/csrf.middleware';
import { ipFilter } from './middlewares/ip-filter.middleware';
import { accessLogger } from './middlewares/access-log.middleware';

// 创建 Express 应用
const app: Application = express();

// 解析 JSON 请求体
app.use(express.json({ limit: '10mb' }));

// 解析 URL 编码的请求体
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 解析 Cookie
app.use(cookieParser(env.cookieSecret));

// 请求日志记录
app.use(morgan('combined', { stream: morganStream }));

// 访问日志中间件
app.use(accessLogger);

// 安全中间件
app.use(helmet());
app.use(corsConfig);

// 限流中间件
app.use(rateLimitConfig);

// IP 过滤中间件
app.use(ipFilter);

// 静态文件服务
app.use('/static', express.static(path.join(__dirname, '../public')));

// 启用CSRF保护
app.use('/api', generateCsrfToken);
app.use('/api', csrfMiddleware);

// 健康检查路由
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.nodeEnv,
  });
});

// API 文档已移除，根据需求跳过 Swagger

// API 路由
import apiRoutes from './routes';
app.use(apiRoutes);

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(errorHandler);

export default app;
