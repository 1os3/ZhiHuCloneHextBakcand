import { Request, Response, NextFunction } from 'express';
import csurf from 'csurf';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';
import { env } from '../config/env.config';

// Log environment and SameSite choice for csrf secret cookie
const determinedCsrfCookieSameSite = env.nodeEnv === 'production' ? 'strict' : 'lax';
logger.info(`[CSRF Middleware] Initializing CSRF secret cookie (the one named '_csrf'). Node Env: '${env.nodeEnv}', Calculated SameSite for '_csrf' cookie: '${determinedCsrfCookieSameSite}'`);

// CSRF 保护配置
const csrfProtection = csurf({
  cookie: {
    key: '_csrf', // 改为标准命名 _csrf
    path: '/',
    httpOnly: true,
    secure: env.nodeEnv === 'production', // In dev, this is false
    sameSite: determinedCsrfCookieSameSite, // In dev, this should be 'lax'
    maxAge: 24 * 60 * 60 * 1000, // 1天
  },
});

/**
 * CSRF 保护中间件
 * 为需要保护的路由添加 CSRF 保护
 */
export const csrfMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // 跳过不需要 CSRF 保护的请求方法
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // 跳过不需要 CSRF 保护的路由
  const excludedPaths = [
    '/api/health',
    '/api/users/login',
    '/api/users/register',
    '/api/users/refresh-token',
    '/api/csrf/token', // 添加CSRF令牌刷新路径为排除项
  ];

  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }

  // 从请求头中获取CSRF令牌
  const csrfToken = req.headers['x-xsrf-token'] || 
                    req.headers['x-csrf-token'] || 
                    (req.body && req.body._csrf);
                    
  // 如果没有提供CSRF令牌，则直接报错
  if (!csrfToken) {
    logger.warn(`CSRF 验证失败: 未提供CSRF令牌`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    return next(new ApiError(HttpStatus.FORBIDDEN, 'CSRF 验证失败，未提供有效令牌'));
  }

  // 应用 CSRF 保护
  csrfProtection(req, res, (err: any) => {
    if (err) {
      logger.warn(`CSRF 验证失败: ${err.message}`, {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      
      return next(new ApiError(HttpStatus.FORBIDDEN, 'CSRF 验证失败，请刷新页面重试'));
    }
    next();
  });
};

/**
 * 生成 CSRF Token 中间件
 * 为客户端提供 CSRF Token
 */
export const generateCsrfToken = (req: Request, res: Response, next: NextFunction): void => {
  // 所有请求都应获取CSRF令牌，包括GET请求
  try {
    // 应用CSRF中间件
    csrfProtection(req, res, (err: any) => {
      if (err) {
        // 如果出错，可能是Cookie未设置，这里我们不返回错误
        // 而是尝试生成新的CSRF令牌
        try {
          // 将 CSRF Token 添加到响应头和Cookie
          const token = req.csrfToken(); // 这会生成一个新的令牌
          res.cookie('XSRF-TOKEN', token, {
            path: '/',
            httpOnly: false, // 客户端 JavaScript 需要访问
            secure: env.nodeEnv === 'production',
            sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
            maxAge: 24 * 60 * 60 * 1000, // 1天
          });

          // 设置CSRF令牌到响应头
          res.set('X-CSRF-Token', token);
          next();
        } catch (tokenErr: any) {
          logger.error(`生成 CSRF Token 失败: ${tokenErr.message}`);
          next(); // 继续执行，不阻塞请求
        }
        return;
      }
      
      // 成功获取到CSRF令牌
      try {
        // 将 CSRF Token 添加到响应头和Cookie
        const token = req.csrfToken();
        res.cookie('XSRF-TOKEN', token, {
          path: '/',
          httpOnly: false, // 客户端 JavaScript 需要访问
          secure: env.nodeEnv === 'production',
          sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 1天
        });

        // 设置CSRF令牌到响应头
        res.set('X-CSRF-Token', token);
        next();
      } catch (err: any) {
        logger.error(`设置 CSRF Token 失败: ${err.message}`);
        next(); // 继续执行，不阻塞请求
      }
    });
  } catch (error: any) {
    logger.error(`CSRF中间件执行失败: ${error.message}`);
    next(); // 继续执行，不阻塞请求
  }
};

/**
 * 刷新 CSRF Token 中间件
 * 用于显式刷新 CSRF Token
 */
export const refreshCsrfToken = (req: Request, res: Response): void => {
  try {
    // 在这个路由中，无论如何都尝试生成新的CSRF令牌
    csrfProtection(req, res, (err: any) => {
      try {
        // 即使发生错误，也尝试生成新的令牌
        // 生成新的 CSRF Token
        const token = req.csrfToken();
        
        // 将新的 CSRF Token 添加到Cookie
        res.cookie('XSRF-TOKEN', token, {
          path: '/',
          httpOnly: false,
          secure: env.nodeEnv === 'production',
          sameSite: env.nodeEnv === 'production' ? 'strict' : 'lax',
          maxAge: 24 * 60 * 60 * 1000, // 1天
        });
        
        // 同时在响应头中设置令牌
        res.set('X-CSRF-Token', token);
        
        // 返回成功响应和令牌
        res.status(HttpStatus.OK).json({
          success: true,
          csrfToken: token,
        });
      } catch (tokenError: any) {
        logger.error(`刷新 CSRF Token 失败: ${tokenError.message}`);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '刷新 CSRF Token 失败',
        });
      }
    });
  } catch (error: any) {
    logger.error(`CSRF中间件执行失败: ${error.message}`);
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '刷新 CSRF Token 失败',
    });
  }
};
