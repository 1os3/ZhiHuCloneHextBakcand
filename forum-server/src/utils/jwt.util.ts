import jwt from 'jsonwebtoken';
import { env } from '../config/env.config';
import { ApiError, HttpStatus } from './error.util';

// JWT 工具类
export class JwtUtil {
  // 生成访问令牌
  static generateToken(payload: Record<string, any>): string {
    // 直接使用对象字面量，而不是 SignOptions 类型
    // 这样可以避免 TypeScript 类型错误
    return jwt.sign(
      payload, 
      String(env.jwt.secret), 
      { expiresIn: env.jwt.expiresIn }
    );
  }

  // 验证令牌
  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, String(env.jwt.secret));
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(HttpStatus.UNAUTHORIZED, '令牌已过期');
      }
      throw new ApiError(HttpStatus.UNAUTHORIZED, '无效的令牌');
    }
  }

  // 从请求头中提取令牌
  static extractTokenFromHeader(authHeader: string): string {
    if (!authHeader) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, '未提供授权令牌');
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new ApiError(HttpStatus.UNAUTHORIZED, '授权格式无效');
    }

    return parts[1];
  }

  // 生成刷新令牌（有效期更长）
  static generateRefreshToken(payload: Record<string, any>): string {
    // 直接使用对象字面量，而不是 SignOptions 类型
    return jwt.sign(
      payload, 
      String(env.jwt.secret), 
      { expiresIn: '7d' } // 7天
    );
  }
}
