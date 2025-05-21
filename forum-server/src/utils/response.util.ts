import { Response } from 'express';
import { HttpStatus } from './error.util';

// 统一响应工具类
export class ResponseUtil {
  // 成功响应
  static success(res: Response, data: any = null, message: string = '操作成功', statusCode: number = HttpStatus.OK): Response {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  // 创建成功响应
  static created(res: Response, data: any = null, message: string = '创建成功'): Response {
    return this.success(res, data, message, HttpStatus.CREATED);
  }

  // 无内容响应
  static noContent(res: Response): Response {
    return res.status(HttpStatus.NO_CONTENT).end();
  }

  // 分页响应
  static paginate(
    res: Response, 
    data: any[], 
    page: number, 
    limit: number, 
    total: number, 
    message: string = '获取成功'
  ): Response {
    return res.status(HttpStatus.OK).json({
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  // 错误响应
  static error(
    res: Response, 
    message: string = '操作失败', 
    statusCode: number = HttpStatus.BAD_REQUEST, 
    errors: any = null
  ): Response {
    const response: any = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }
}
