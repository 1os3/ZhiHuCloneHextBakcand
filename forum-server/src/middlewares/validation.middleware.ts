import { Request, Response, NextFunction } from 'express';
import { validate as classValidate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ApiError, HttpStatus } from '../utils/error.util';

// 验证请求数据中间件
export const validateRequest = (dtoClass: any, source: 'body' | 'query' | 'params' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // 将请求数据转换为DTO实例
      const dtoInstance = plainToInstance(dtoClass, req[source]);
      
      // 验证DTO实例
      const errors: ValidationError[] = await classValidate(dtoInstance, {
        whitelist: true, // 只保留DTO中定义的属性
        forbidNonWhitelisted: true, // 禁止未在DTO中定义的属性
        skipMissingProperties: false, // 不跳过缺失的属性
      });
      
      // 如果有验证错误
      if (errors.length > 0) {
        // 格式化错误信息
        const formattedErrors = errors.reduce((acc: Record<string, string[]>, error: ValidationError) => {
          const property = error.property;
          const constraints = error.constraints ? Object.values(error.constraints) : ['验证失败'];
          
          if (!acc[property]) {
            acc[property] = [];
          }
          
          acc[property].push(...constraints);
          
          // 处理嵌套验证错误
          if (error.children && error.children.length > 0) {
            error.children.forEach((child: ValidationError) => {
              const nestedProperty = `${property}.${child.property}`;
              const nestedConstraints = child.constraints ? Object.values(child.constraints) : ['验证失败'];
              
              if (!acc[nestedProperty]) {
                acc[nestedProperty] = [];
              }
              
              acc[nestedProperty].push(...nestedConstraints);
            });
          }
          
          return acc;
        }, {});
        
        throw new ApiError(
          HttpStatus.BAD_REQUEST,
          '请求数据验证失败',
          true,
          JSON.stringify(formattedErrors)
        );
      }
      
      // 将验证通过的DTO实例添加到请求对象中
      req[source] = dtoInstance;
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 验证ID参数中间件
export const validateIdParam = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const id = req.params[paramName];
    
    // 验证ID是否为有效的UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!id || !uuidRegex.test(id)) {
      return next(new ApiError(HttpStatus.BAD_REQUEST, `无效的${paramName}参数`));
    }
    
    next();
  };
};

// 导出验证DTO的中间件函数
export const validateDto = validateRequest;
