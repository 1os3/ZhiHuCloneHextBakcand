import { Request, Response, NextFunction } from 'express';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../utils/logger.util';

/**
 * 基础控制器类，提供通用的控制器功能
 */
export abstract class BaseController {
  /**
   * 处理成功响应
   * @param res Express响应对象
   * @param data 响应数据
   * @param status HTTP状态码
   */
  protected success<T>(res: Response, data: T, status: number = HttpStatus.OK): Response {
    return res.status(status).json({
      success: true,
      data,
    });
  }

  /**
   * 处理错误响应
   * @param res Express响应对象
   * @param statusOrError HTTP状态码或错误对象
   * @param message 错误消息（当第二个参数为状态码时使用）
   */
  protected error(res: Response, statusOrError: number | any, message?: string): Response {
    // 如果第二个参数是状态码，则创建ApiError
    if (typeof statusOrError === 'number') {
      const status = statusOrError;
      const errorMessage = message || '服务器错误';
      const errorCode = HttpStatus[status] ? HttpStatus[status] : 'UNKNOWN_ERROR';
      
      logger.error(`API错误: ${errorMessage}`, { status });
      return res.status(status).json({
        success: false,
        error: {
          message: errorMessage,
          code: errorCode,
        },
      });
    }
    
    // 如果第二个参数是错误对象
    const error = statusOrError;
    
    if (error instanceof ApiError) {
      const errorCode = error.isOperational && HttpStatus[error.statusCode] 
        ? HttpStatus[error.statusCode] 
        : 'INTERNAL_SERVER_ERROR';
        
      logger.error(`API错误: ${error.message}`, { stack: error.stack, status: error.statusCode });
      return res.status(error.statusCode).json({
        success: false,
        error: {
          message: error.message,
          code: errorCode,
        },
      });
    }

    logger.error(`未处理错误: ${error.message}`, { stack: error.stack });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: message || '服务器内部错误',
        code: 'INTERNAL_SERVER_ERROR',
      },
    });
  }

  /**
   * 异步请求处理包装器
   * @param fn 异步处理函数
   */
  protected asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch((error) => {
        this.error(res, error);
      });
    };
  }
}
