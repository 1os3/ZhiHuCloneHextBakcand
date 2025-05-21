import { Repository, Between, LessThan } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { ActivityLog, ActivityType } from '../models/activity-log.entity';
import { AccessLog, HttpMethod } from '../models/access-log.entity';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';
import { Request, Response } from 'express';

/**
 * 日志服务类
 * 用于记录和管理系统日志
 */
export class LogService {
  private readonly activityLogRepository: Repository<ActivityLog>;
  private readonly accessLogRepository: Repository<AccessLog>;

  constructor() {
    this.activityLogRepository = AppDataSource.getRepository(ActivityLog);
    this.accessLogRepository = AppDataSource.getRepository(AccessLog);
  }

  /**
   * 记录操作日志
   * @param type 操作类型
   * @param description 操作描述
   * @param userId 用户ID
   * @param username 用户名
   * @param ipAddress IP地址
   * @param userAgent 用户代理
   * @param details 操作详情
   * @param resourceType 资源类型
   * @param resourceId 资源ID
   * @param success 是否成功
   * @param failureReason 失败原因
   * @returns 创建的操作日志
   */
  async logActivity(
    type: ActivityType,
    description: string,
    userId?: string,
    username?: string,
    ipAddress?: string,
    userAgent?: string,
    details?: string,
    resourceType?: string,
    resourceId?: string,
    success: boolean = true,
    failureReason?: string
  ): Promise<ActivityLog | null> {
    try {
      const activityLog = this.activityLogRepository.create({
        type,
        description,
        userId,
        username,
        ipAddress,
        userAgent,
        details,
        resourceType,
        resourceId,
        success,
        failureReason
      });

      return await this.activityLogRepository.save(activityLog);
    } catch (error: any) {
      logger.error(`记录操作日志失败: ${error.message}`);
      // 日志记录失败不应影响主要业务流程，所以这里只记录错误，不抛出异常
      return null;
    }
  }

  /**
   * 记录访问日志
   * @param req 请求对象
   * @param res 响应对象
   * @param startTime 请求开始时间
   * @param error 错误信息
   * @returns 创建的访问日志
   */
  async logAccess(
    req: Request,
    res: Response,
    startTime: [number, number],
    error?: Error
  ): Promise<AccessLog | null> {
    try {
      // 计算响应时间（纳秒转毫秒）
      const endTime = process.hrtime(startTime);
      const responseTime = Math.round((endTime[0] * 1e9 + endTime[1]) / 1e6);

      // 获取请求参数（排除敏感信息）
      const requestParams = { ...req.query, ...req.params };
      delete requestParams.password;
      delete requestParams.token;

      // 获取请求体摘要（排除敏感信息）
      let requestBody = null;
      if (req.body && typeof req.body === 'object') {
        requestBody = { ...req.body };
        delete requestBody.password;
        delete requestBody.token;
      }

      // 创建访问日志
      const accessLog = this.accessLogRepository.create({
        path: req.path,
        method: req.method as HttpMethod,
        statusCode: res.statusCode,
        responseTime,
        userId: req.user?.id,
        ipAddress: req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'] as string,
        referer: req.headers.referer as string,
        requestParams,
        requestBody,
        errorMessage: error?.message
      });

      return await this.accessLogRepository.save(accessLog);
    } catch (error: any) {
      logger.error(`记录访问日志失败: ${error.message}`);
      // 日志记录失败不应影响主要业务流程，所以这里只记录错误，不抛出异常
      return null;
    }
  }

  /**
   * 获取操作日志列表
   * @param userId 用户ID
   * @param type 操作类型
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页操作日志列表
   */
  async getActivityLogs(
    userId?: string,
    type?: ActivityType,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: ActivityLog[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // 构建查询条件
      const whereConditions: any = {};
      if (userId) whereConditions.userId = userId;
      if (type) whereConditions.type = type;
      
      // 添加日期范围条件
      if (startDate && endDate) {
        whereConditions.createdAt = Between(startDate, endDate);
      } else if (startDate) {
        whereConditions.createdAt = Between(startDate, new Date());
      } else if (endDate) {
        whereConditions.createdAt = LessThan(endDate);
      }

      // 查询总数
      const total = await this.activityLogRepository.count({
        where: whereConditions
      });

      // 查询数据
      const items = await this.activityLogRepository.find({
        where: whereConditions,
        skip,
        take: limit,
        order: {
          createdAt: 'DESC'
        }
      });

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error: any) {
      logger.error(`获取操作日志列表失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '获取操作日志列表失败');
    }
  }

  /**
   * 获取访问日志列表
   * @param path 请求路径
   * @param method HTTP方法
   * @param statusCode HTTP状态码
   * @param userId 用户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页访问日志列表
   */
  async getAccessLogs(
    path?: string,
    method?: HttpMethod,
    statusCode?: number,
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: AccessLog[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // 构建查询条件
      const whereConditions: any = {};
      if (path) whereConditions.path = path;
      if (method) whereConditions.method = method;
      if (statusCode) whereConditions.statusCode = statusCode;
      if (userId) whereConditions.userId = userId;
      
      // 添加日期范围条件
      if (startDate && endDate) {
        whereConditions.createdAt = Between(startDate, endDate);
      } else if (startDate) {
        whereConditions.createdAt = Between(startDate, new Date());
      } else if (endDate) {
        whereConditions.createdAt = LessThan(endDate);
      }

      // 查询总数
      const total = await this.accessLogRepository.count({
        where: whereConditions
      });

      // 查询数据
      const items = await this.accessLogRepository.find({
        where: whereConditions,
        skip,
        take: limit,
        order: {
          createdAt: 'DESC'
        }
      });

      return {
        items,
        total,
        page,
        limit
      };
    } catch (error: any) {
      logger.error(`获取访问日志列表失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '获取访问日志列表失败');
    }
  }

  /**
   * 获取访问统计数据
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 访问统计数据
   */
  async getAccessStats(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalRequests: number;
    uniqueUsers: number;
    uniqueIPs: number;
    avgResponseTime: number;
    statusCodes: Record<number, number>;
    topPaths: Array<{ path: string; count: number }>;
    requestsByMethod: Record<string, number>;
  }> {
    try {
      // 设置默认日期范围（过去7天）
      if (!startDate) {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }
      
      if (!endDate) {
        endDate = new Date();
      }

      // 构建日期范围条件
      const dateCondition = Between(startDate, endDate);

      // 获取总请求数
      const totalRequests = await this.accessLogRepository.count({
        where: {
          createdAt: dateCondition
        }
      });

      // 获取唯一用户数
      const uniqueUsersResult = await this.accessLogRepository
        .createQueryBuilder('access_log')
        .select('COUNT(DISTINCT access_log.userId)', 'count')
        .where('access_log.userId IS NOT NULL')
        .andWhere('access_log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .getRawOne();
      
      const uniqueUsers = parseInt(uniqueUsersResult.count, 10);

      // 获取唯一IP数
      const uniqueIPsResult = await this.accessLogRepository
        .createQueryBuilder('access_log')
        .select('COUNT(DISTINCT access_log.ipAddress)', 'count')
        .where('access_log.ipAddress IS NOT NULL')
        .andWhere('access_log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .getRawOne();
      
      const uniqueIPs = parseInt(uniqueIPsResult.count, 10);

      // 获取平均响应时间
      const avgResponseTimeResult = await this.accessLogRepository
        .createQueryBuilder('access_log')
        .select('AVG(access_log.responseTime)', 'avg')
        .where('access_log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .getRawOne();
      
      const avgResponseTime = parseFloat(avgResponseTimeResult.avg) || 0;

      // 获取状态码分布
      const statusCodesResult = await this.accessLogRepository
        .createQueryBuilder('access_log')
        .select('access_log.statusCode', 'statusCode')
        .addSelect('COUNT(access_log.id)', 'count')
        .where('access_log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('access_log.statusCode')
        .getRawMany();
      
      const statusCodes: Record<number, number> = {};
      statusCodesResult.forEach((item: any) => {
        statusCodes[item.statusCode] = parseInt(item.count, 10);
      });

      // 获取访问量最高的路径
      const topPathsResult = await this.accessLogRepository
        .createQueryBuilder('access_log')
        .select('access_log.path', 'path')
        .addSelect('COUNT(access_log.id)', 'count')
        .where('access_log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('access_log.path')
        .orderBy('count', 'DESC')
        .limit(10)
        .getRawMany();
      
      const topPaths = topPathsResult.map((item: any) => ({
        path: item.path,
        count: parseInt(item.count, 10)
      }));

      // 获取请求方法分布
      const requestsByMethodResult = await this.accessLogRepository
        .createQueryBuilder('access_log')
        .select('access_log.method', 'method')
        .addSelect('COUNT(access_log.id)', 'count')
        .where('access_log.createdAt BETWEEN :startDate AND :endDate', {
          startDate,
          endDate
        })
        .groupBy('access_log.method')
        .getRawMany();
      
      const requestsByMethod: Record<string, number> = {};
      requestsByMethodResult.forEach((item: any) => {
        requestsByMethod[item.method] = parseInt(item.count, 10);
      });

      return {
        totalRequests,
        uniqueUsers,
        uniqueIPs,
        avgResponseTime,
        statusCodes,
        topPaths,
        requestsByMethod
      };
    } catch (error: any) {
      logger.error(`获取访问统计数据失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '获取访问统计数据失败');
    }
  }

  /**
   * 清理过期日志
   * @param days 保留天数
   * @returns 清理结果
   */
  async cleanupOldLogs(days: number = 90): Promise<{ activityLogs: number; accessLogs: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // 清理过期操作日志
      const activityLogResult = await this.activityLogRepository.delete({
        createdAt: LessThan(cutoffDate)
      });

      // 清理过期访问日志
      const accessLogResult = await this.accessLogRepository.delete({
        createdAt: LessThan(cutoffDate)
      });

      return {
        activityLogs: activityLogResult.affected || 0,
        accessLogs: accessLogResult.affected || 0
      };
    } catch (error: any) {
      logger.error(`清理过期日志失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '清理过期日志失败');
    }
  }
}
