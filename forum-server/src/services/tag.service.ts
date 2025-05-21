import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Tag } from '../models/tag.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreateTagDto, UpdateTagDto, TagQueryDto } from '../dtos/tag.dto';
import { logger } from '../config/logger.config';

/**
 * 标签服务类，处理标签相关的业务逻辑
 */
export class TagService extends BaseService<Tag> {
  private readonly tagRepository: Repository<Tag>;

  constructor() {
    const tagRepository = AppDataSource.getRepository(Tag);
    super(tagRepository);
    this.tagRepository = tagRepository;
  }

  /**
   * 创建标签
   * @param createDto 创建数据
   * @returns 创建的标签
   */
  async createTag(createDto: CreateTagDto): Promise<Tag> {
    // 检查名称是否已存在
    const existingTag = await this.tagRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingTag) {
      throw new ApiError(HttpStatus.CONFLICT, '标签名称已存在');
    }

    // 创建新标签
    const newTag = this.tagRepository.create(createDto);
    const savedTag = await this.tagRepository.save(newTag);
    
    logger.info(`新标签创建成功: ${savedTag.name} (${savedTag.id})`);
    
    return savedTag;
  }

  /**
   * 更新标签
   * @param tagId 标签ID
   * @param updateDto 更新数据
   * @returns 更新后的标签
   */
  async updateTag(tagId: string, updateDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findById(tagId);
    
    // 如果更新名称，检查名称是否已存在
    if (updateDto.name && updateDto.name !== tag.name) {
      const existingTag = await this.tagRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingTag && existingTag.id !== tagId) {
        throw new ApiError(HttpStatus.CONFLICT, '标签名称已存在');
      }
    }
    
    // 更新标签
    const updatedTag = await this.update(tagId, updateDto);
    
    return updatedTag;
  }

  /**
   * 查询标签列表
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页标签列表
   */
  async findTags(
    queryDto: TagQueryDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Tag[]; total: number; page: number; limit: number }> {
    const { search, isActive } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.tagRepository.createQueryBuilder('tag');
    
    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(tag.name LIKE :search OR tag.description LIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // 激活状态过滤
    if (isActive !== undefined) {
      queryBuilder.andWhere('tag.isActive = :isActive', { isActive });
    }
    
    // 分页
    const total = await queryBuilder.getCount();
    const tags = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('tag.usageCount', 'DESC')
      .addOrderBy('tag.name', 'ASC')
      .getMany();
    
    return {
      items: tags,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取热门标签
   * @param limit 数量限制
   * @returns 热门标签列表
   */
  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { isActive: true },
      order: { usageCount: 'DESC' },
      take: limit,
    });
  }

  /**
   * 根据名称查找或创建标签
   * @param tagNames 标签名称数组
   * @returns 标签ID数组
   */
  async findOrCreateTags(tagNames: string[]): Promise<string[]> {
    const tagIds: string[] = [];
    
    for (const name of tagNames) {
      // 查找标签
      let tag = await this.tagRepository.findOne({
        where: { name },
      });
      
      // 如果不存在，创建新标签
      if (!tag) {
        tag = await this.createTag({ name });
      }
      
      tagIds.push(tag.id);
    }
    
    return tagIds;
  }

  /**
   * 更新标签使用计数
   * @param tagId 标签ID
   * @param increment 增量（正数增加，负数减少）
   * @returns 更新后的标签
   */
  async updateUsageCount(tagId: string, increment: number = 1): Promise<Tag> {
    const tag = await this.findById(tagId);
    
    // 更新使用计数
    tag.usageCount = Math.max(0, tag.usageCount + increment);
    
    return this.tagRepository.save(tag);
  }

  /**
   * 批量更新标签使用计数
   * @param tagIds 标签ID数组
   * @param increment 增量（正数增加，负数减少）
   * @returns 更新结果
   */
  async batchUpdateUsageCount(tagIds: string[], increment: number = 1): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }
    
    // 使用原生SQL批量更新
    if (increment > 0) {
      await this.tagRepository.query(
        `UPDATE tags SET "usageCount" = "usageCount" + $1 WHERE id IN ($2)`,
        [increment, tagIds.join(',')]
      );
    } else {
      await this.tagRepository.query(
        `UPDATE tags SET "usageCount" = GREATEST(0, "usageCount" + $1) WHERE id IN ($2)`,
        [increment, tagIds.join(',')]
      );
    }
  }
}
