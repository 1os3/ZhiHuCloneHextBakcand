import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { Category } from '../models/category.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from '../dtos/category.dto';
import { logger } from '../config/logger.config';

/**
 * 分类服务类，处理分类相关的业务逻辑
 */
export class CategoryService extends BaseService<Category> {
  private readonly categoryRepository: Repository<Category>;

  constructor() {
    const categoryRepository = AppDataSource.getRepository(Category);
    super(categoryRepository);
    this.categoryRepository = categoryRepository;
  }

  /**
   * 创建分类
   * @param createDto 创建数据
   * @returns 创建的分类
   */
  async createCategory(createDto: CreateCategoryDto): Promise<Category> {
    // 检查名称是否已存在
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createDto.name },
    });

    if (existingCategory) {
      throw new ApiError(HttpStatus.CONFLICT, '分类名称已存在');
    }

    // 如果有父分类，检查父分类是否存在
    if (createDto.parentId) {
      const parentExists = await this.exists(createDto.parentId);
      if (!parentExists) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '父分类不存在');
      }
    }

    // 创建新分类
    const newCategory = this.categoryRepository.create(createDto);
    const savedCategory = await this.categoryRepository.save(newCategory);
    
    logger.info(`新分类创建成功: ${savedCategory.name} (${savedCategory.id})`);
    
    return savedCategory;
  }

  /**
   * 更新分类
   * @param categoryId 分类ID
   * @param updateDto 更新数据
   * @returns 更新后的分类
   */
  async updateCategory(categoryId: string, updateDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findById(categoryId);
    
    // 如果更新名称，检查名称是否已存在
    if (updateDto.name && updateDto.name !== category.name) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { name: updateDto.name },
      });

      if (existingCategory && existingCategory.id !== categoryId) {
        throw new ApiError(HttpStatus.CONFLICT, '分类名称已存在');
      }
    }
    
    // 如果更新父分类，检查父分类是否存在，并防止循环引用
    if (updateDto.parentId) {
      // 不能将自己设为自己的父分类
      if (updateDto.parentId === categoryId) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '不能将分类设为自己的父分类');
      }
      
      // 检查父分类是否存在
      const parentExists = await this.exists(updateDto.parentId);
      if (!parentExists) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '父分类不存在');
      }
      
      // 防止循环引用（不能将子分类设为父分类）
      const isChildCategory = await this.isChildCategory(updateDto.parentId, categoryId);
      if (isChildCategory) {
        throw new ApiError(HttpStatus.BAD_REQUEST, '不能将子分类设为父分类');
      }
    }
    
    // 更新分类
    const updatedCategory = await this.update(categoryId, updateDto);
    
    return updatedCategory;
  }

  /**
   * 查询分类列表
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页分类列表
   */
  async findCategories(
    queryDto: CategoryQueryDto,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: Category[]; total: number; page: number; limit: number }> {
    const { search, parentId, isActive } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.categoryRepository.createQueryBuilder('category');
    
    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(category.name LIKE :search OR category.description LIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // 父分类过滤
    if (parentId !== undefined) {
      if (parentId === null) {
        queryBuilder.andWhere('category.parentId IS NULL');
      } else {
        queryBuilder.andWhere('category.parentId = :parentId', { parentId });
      }
    }
    
    // 激活状态过滤
    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }
    
    // 排序
    queryBuilder.orderBy('category.order', 'ASC');
    
    // 分页
    const total = await queryBuilder.getCount();
    const categories = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    
    return {
      items: categories,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取分类树
   * @param onlyActive 是否只返回激活的分类
   * @returns 分类树
   */
  async getCategoryTree(onlyActive: boolean = true): Promise<Category[]> {
    // 查询所有分类
    const queryBuilder = this.categoryRepository.createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .leftJoinAndSelect('children.children', 'grandchildren');
    
    // 只查询顶级分类
    queryBuilder.where('category.parentId IS NULL');
    
    // 激活状态过滤
    if (onlyActive) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive: true });
      queryBuilder.andWhere('children.isActive = :isActive', { isActive: true });
      queryBuilder.andWhere('grandchildren.isActive = :isActive', { isActive: true });
    }
    
    // 排序
    queryBuilder.orderBy('category.order', 'ASC');
    queryBuilder.addOrderBy('children.order', 'ASC');
    queryBuilder.addOrderBy('grandchildren.order', 'ASC');
    
    return queryBuilder.getMany();
  }

  /**
   * 获取分类详情
   * @param categoryId 分类ID
   * @returns 分类详情
   */
  async getCategoryDetails(categoryId: string): Promise<Category> {
    return this.findById(categoryId, ['parent', 'children', 'posts']);
  }

  /**
   * 检查是否为子分类
   * @param parentId 父分类ID
   * @param childId 子分类ID
   * @returns 是否为子分类
   */
  private async isChildCategory(parentId: string, childId: string): Promise<boolean> {
    // 获取所有子分类
    const children = await this.categoryRepository.find({
      where: { parentId: childId },
    });
    
    // 递归检查
    for (const child of children) {
      if (child.id === parentId) {
        return true;
      }
      
      const isChild = await this.isChildCategory(parentId, child.id);
      if (isChild) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 删除分类
   * @param categoryId 分类ID
   * @returns 是否删除成功
   */
  async deleteCategory(categoryId: string): Promise<boolean> {
    // 检查分类是否存在
    const category = await this.findById(categoryId);
    
    // 检查分类是否有子分类
    const hasChildren = await this.categoryRepository.count({
      where: { parentId: categoryId },
    });
    
    if (hasChildren > 0) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '分类包含子分类，无法删除');
    }
    
    // 检查分类是否有帖子
    const postCount = await AppDataSource.getRepository('posts').count({
      where: { categoryId },
    });
    
    if (postCount > 0) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '分类包含帖子，无法删除');
    }
    
    // 删除分类
    await this.categoryRepository.remove(category);
    
    return true;
  }

  /**
   * 获取所有分类（不分页）
   * @returns 分类列表
   */
  async getAllCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: {
        order: 'ASC',
      },
    });
  }

  /**
   * 获取分类的帖子数量
   * @param categoryId 分类ID
   * @returns 帖子数量
   */
  async getCategoryPostCount(categoryId: string): Promise<number> {
    // 检查分类是否存在
    await this.findById(categoryId);
    
    // 查询帖子数量
    const postCount = await AppDataSource.getRepository('posts').count({
      where: { categoryId },
    });
    
    return postCount;
  }

  /**
   * 更新分类排序
   * @param categoryIds 分类ID数组，按排序顺序
   * @returns 更新后的分类列表
   */
  async updateCategoryOrder(categoryIds: string[]): Promise<Category[]> {
    // 检查分类ID是否存在
    const categories = await this.categoryRepository.find({
      where: { id: In(categoryIds) },
    });
    
    if (categories.length !== categoryIds.length) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '包含无效的分类ID');
    }
    
    // 更新排序
    const updatePromises = categoryIds.map((id, index) => {
      return this.categoryRepository.update(id, { order: index });
    });
    
    await Promise.all(updatePromises);
    
    // 返回更新后的分类列表
    return this.categoryRepository.find({
      order: {
        order: 'ASC',
      },
    });
  }
}
