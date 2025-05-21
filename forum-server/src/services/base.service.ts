import { Repository, FindOptionsWhere, FindManyOptions, DeepPartial } from 'typeorm';
import { ApiError, HttpStatus } from '../utils/error.util';

/**
 * 基础服务类，提供通用的 CRUD 操作
 * @template T 实体类型
 * @template ID ID类型
 */
import { ObjectLiteral } from 'typeorm';

export abstract class BaseService<T extends ObjectLiteral, ID = string> {
  protected constructor(protected readonly repository: Repository<T>) {}

  /**
   * 创建实体
   * @param data 实体数据
   * @returns 创建的实体
   */
  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity as any);
  }

  /**
   * 根据ID查找实体
   * @param id 实体ID
   * @param relations 关联关系
   * @returns 找到的实体，如果不存在则抛出异常
   */
  async findById(id: ID, relations: string[] = []): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
      relations,
    });

    if (!entity) {
      throw new ApiError(HttpStatus.NOT_FOUND, `ID为${id}的实体不存在`);
    }

    return entity;
  }

  /**
   * 查找所有实体
   * @param options 查询选项
   * @returns 实体列表
   */
  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  /**
   * 分页查询实体
   * @param options 查询选项
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async findWithPagination(
    options: FindManyOptions<T>,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: T[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.repository.findAndCount({
      ...options,
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  /**
   * 更新实体
   * @param id 实体ID
   * @param data 更新数据
   * @returns 更新后的实体
   */
  async update(id: ID, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findById(id);
    const updatedEntity = this.repository.merge(entity, data as any);
    return this.repository.save(updatedEntity as any);
  }

  /**
   * 删除实体
   * @param id 实体ID
   * @returns 删除结果
   */
  async delete(id: ID): Promise<boolean> {
    const entity = await this.findById(id);
    const result = await this.repository.remove(entity as any);
    return !!result;
  }

  /**
   * 检查实体是否存在
   * @param id 实体ID
   * @returns 是否存在
   */
  async exists(id: ID): Promise<boolean> {
    const count = await this.repository.count({
      where: { id } as FindOptionsWhere<T>,
    });
    return count > 0;
  }
}
