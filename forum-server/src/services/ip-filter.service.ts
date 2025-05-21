import { Repository, LessThan, IsNull } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { IPFilter, IPFilterType } from '../models/ip-filter.entity';
import { ApiError, HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';
import * as ipaddr from 'ipaddr.js';

/**
 * IP过滤服务类
 * 用于管理IP黑白名单和IP访问控制
 */
export class IPFilterService {
  private readonly ipFilterRepository: Repository<IPFilter>;
  private whitelistCache: Map<string, IPFilter> = new Map();
  private blacklistCache: Map<string, IPFilter> = new Map();
  private cidrWhitelistCache: { cidr: ipaddr.IPv4 | ipaddr.IPv6, prefix: number, filter: IPFilter }[] = [];
  private cidrBlacklistCache: { cidr: ipaddr.IPv4 | ipaddr.IPv6, prefix: number, filter: IPFilter }[] = [];
  private lastCacheUpdate: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 缓存有效期5分钟

  constructor() {
    this.ipFilterRepository = AppDataSource.getRepository(IPFilter);
  }

  /**
   * 初始化IP过滤缓存
   */
  async initializeCache(): Promise<void> {
    try {
      await this.updateCache();
      logger.info('IP过滤缓存初始化成功');
    } catch (error: any) {
      logger.error(`IP过滤缓存初始化失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 更新IP过滤缓存
   */
  private async updateCache(): Promise<void> {
    try {
      // 清空缓存
      this.whitelistCache.clear();
      this.blacklistCache.clear();
      this.cidrWhitelistCache = [];
      this.cidrBlacklistCache = [];

      // 获取所有活跃的IP过滤规则
      const filters = await this.ipFilterRepository.find({
        where: [
          { isActive: true, expiresAt: IsNull() },
          { isActive: true, expiresAt: LessThan(new Date()) }
        ]
      });

      // 更新缓存
      for (const filter of filters) {
        if (this.isCIDR(filter.ipAddress)) {
          // 处理CIDR格式
          const { addr, prefix } = this.parseCIDR(filter.ipAddress);
          if (filter.type === IPFilterType.WHITELIST) {
            this.cidrWhitelistCache.push({ cidr: addr, prefix, filter });
          } else {
            this.cidrBlacklistCache.push({ cidr: addr, prefix, filter });
          }
        } else {
          // 处理单个IP地址
          if (filter.type === IPFilterType.WHITELIST) {
            this.whitelistCache.set(filter.ipAddress, filter);
          } else {
            this.blacklistCache.set(filter.ipAddress, filter);
          }
        }
      }

      // 更新缓存时间戳
      this.lastCacheUpdate = Date.now();
      logger.debug(`IP过滤缓存已更新，白名单: ${this.whitelistCache.size + this.cidrWhitelistCache.length}，黑名单: ${this.blacklistCache.size + this.cidrBlacklistCache.length}`);
    } catch (error: any) {
      logger.error(`更新IP过滤缓存失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 检查IP地址是否被允许访问
   * @param ipAddress IP地址
   * @returns 是否允许访问
   */
  async isIPAllowed(ipAddress: string): Promise<boolean> {
    try {
      // 检查缓存是否需要更新
      if (Date.now() - this.lastCacheUpdate > this.CACHE_TTL) {
        await this.updateCache();
      }

      // 首先检查IP是否在白名单中
      if (this.whitelistCache.has(ipAddress)) {
        return true;
      }

      // 检查IP是否在CIDR白名单中
      const parsedIP = ipaddr.parse(ipAddress);
      for (const { cidr, prefix } of this.cidrWhitelistCache) {
        if (parsedIP.kind() === cidr.kind() && parsedIP.match(cidr, prefix)) {
          return true;
        }
      }

      // 如果白名单为空，则默认允许所有IP
      if (this.whitelistCache.size === 0 && this.cidrWhitelistCache.length === 0) {
        // 检查IP是否在黑名单中
        if (this.blacklistCache.has(ipAddress)) {
          return false;
        }

        // 检查IP是否在CIDR黑名单中
        for (const { cidr, prefix } of this.cidrBlacklistCache) {
          if (parsedIP.kind() === cidr.kind() && parsedIP.match(cidr, prefix)) {
            return false;
          }
        }

        // 如果不在黑名单中，则允许访问
        return true;
      }

      // 如果有白名单但IP不在白名单中，则拒绝访问
      return false;
    } catch (error: any) {
      logger.error(`检查IP访问权限失败: ${error.message}`);
      // 出错时默认允许访问，避免系统完全无法访问
      return true;
    }
  }

  /**
   * 添加IP过滤规则
   * @param ipAddress IP地址或CIDR
   * @param type 过滤类型
   * @param description 描述
   * @param expiresAt 过期时间
   * @returns 创建的IP过滤规则
   */
  async addIPFilter(
    ipAddress: string,
    type: IPFilterType,
    description?: string,
    expiresAt?: Date
  ): Promise<IPFilter> {
    try {
      // 验证IP地址格式
      this.validateIPAddress(ipAddress);

      // 检查是否已存在相同的规则
      const existingFilter = await this.ipFilterRepository.findOne({
        where: { ipAddress, type }
      });

      if (existingFilter) {
        throw new ApiError(HttpStatus.CONFLICT, `该IP地址已存在于${type === IPFilterType.WHITELIST ? '白' : '黑'}名单中`);
      }

      // 创建新规则
      const filter = this.ipFilterRepository.create({
        ipAddress,
        type,
        description,
        expiresAt,
        isActive: true
      });

      // 保存规则
      const savedFilter = await this.ipFilterRepository.save(filter);
      
      // 更新缓存
      await this.updateCache();
      
      return savedFilter;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`添加IP过滤规则失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '添加IP过滤规则失败');
    }
  }

  /**
   * 更新IP过滤规则
   * @param id 规则ID
   * @param isActive 是否启用
   * @param description 描述
   * @param expiresAt 过期时间
   * @returns 更新后的IP过滤规则
   */
  async updateIPFilter(
    id: string,
    isActive?: boolean,
    description?: string,
    expiresAt?: Date | null
  ): Promise<IPFilter> {
    try {
      // 查找规则
      const filter = await this.ipFilterRepository.findOne({
        where: { id }
      });

      if (!filter) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'IP过滤规则不存在');
      }

      // 更新规则
      if (isActive !== undefined) filter.isActive = isActive;
      if (description !== undefined) filter.description = description;
      if (expiresAt !== undefined) filter.expiresAt = expiresAt;

      // 保存更新
      const updatedFilter = await this.ipFilterRepository.save(filter);
      
      // 更新缓存
      await this.updateCache();
      
      return updatedFilter;
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`更新IP过滤规则失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '更新IP过滤规则失败');
    }
  }

  /**
   * 删除IP过滤规则
   * @param id 规则ID
   * @returns 操作结果
   */
  async deleteIPFilter(id: string): Promise<{ success: boolean }> {
    try {
      // 查找规则
      const filter = await this.ipFilterRepository.findOne({
        where: { id }
      });

      if (!filter) {
        throw new ApiError(HttpStatus.NOT_FOUND, 'IP过滤规则不存在');
      }

      // 删除规则
      await this.ipFilterRepository.remove(filter);
      
      // 更新缓存
      await this.updateCache();
      
      return { success: true };
    } catch (error: any) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error(`删除IP过滤规则失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '删除IP过滤规则失败');
    }
  }

  /**
   * 获取IP过滤规则列表
   * @param type 过滤类型
   * @param isActive 是否启用
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页IP过滤规则列表
   */
  async getIPFilters(
    type?: IPFilterType,
    isActive?: boolean,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: IPFilter[]; total: number; page: number; limit: number }> {
    try {
      const skip = (page - 1) * limit;
      
      // 构建查询条件
      const whereConditions: any = {};
      if (type !== undefined) whereConditions.type = type;
      if (isActive !== undefined) whereConditions.isActive = isActive;

      // 查询总数
      const total = await this.ipFilterRepository.count({
        where: whereConditions
      });

      // 查询数据
      const items = await this.ipFilterRepository.find({
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
      logger.error(`获取IP过滤规则列表失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '获取IP过滤规则列表失败');
    }
  }

  /**
   * 清理过期的IP过滤规则
   * @returns 清理结果
   */
  async cleanupExpiredFilters(): Promise<{ count: number }> {
    try {
      const now = new Date();
      
      // 查找过期的规则
      const result = await this.ipFilterRepository.delete({
        expiresAt: LessThan(now)
      });
      
      // 如果有删除，更新缓存
      if (result.affected && result.affected > 0) {
        await this.updateCache();
      }
      
      return { count: result.affected || 0 };
    } catch (error: any) {
      logger.error(`清理过期IP过滤规则失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '清理过期IP过滤规则失败');
    }
  }

  /**
   * 判断是否为CIDR格式
   * @param ip IP地址或CIDR
   * @returns 是否为CIDR格式
   */
  private isCIDR(ip: string): boolean {
    return ip.includes('/');
  }

  /**
   * 解析CIDR格式
   * @param cidr CIDR格式的IP范围
   * @returns 解析结果
   */
  private parseCIDR(cidr: string): { addr: ipaddr.IPv4 | ipaddr.IPv6, prefix: number } {
    try {
      const result = ipaddr.parseCIDR(cidr);
      return {
        addr: result[0],
        prefix: result[1]
      };
    } catch (error) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `无效的CIDR格式: ${cidr}`);
    }
  }

  /**
   * 验证IP地址或CIDR格式
   * @param ipAddress IP地址或CIDR
   */
  private validateIPAddress(ipAddress: string): void {
    try {
      if (this.isCIDR(ipAddress)) {
        ipaddr.parseCIDR(ipAddress);
      } else {
        ipaddr.parse(ipAddress);
      }
    } catch (error) {
      throw new ApiError(HttpStatus.BAD_REQUEST, `无效的IP地址或CIDR格式: ${ipAddress}`);
    }
  }
}
