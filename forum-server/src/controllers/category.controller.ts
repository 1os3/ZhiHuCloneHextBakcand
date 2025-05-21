import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { CategoryService } from '../services/category.service';
import { 
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryQueryDto
} from '../dtos/category.dto';
import { logger } from '../utils/logger.util';
import { HttpStatus } from '../utils/error.util';

/**
 * 分类控制器，处理分类相关的HTTP请求
 */
export class CategoryController extends BaseController {
  private readonly categoryService: CategoryService;

  constructor() {
    super();
    this.categoryService = new CategoryService();
  }

  /**
   * 创建分类
   * @route POST /api/categories
   */
  createCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const createDto = req.body as CreateCategoryDto;
    const category = await this.categoryService.createCategory(createDto);
    logger.info(`分类创建成功: ${category.id}, 名称: ${category.name}`);
    return this.success(res, category, HttpStatus.CREATED);
  });

  /**
   * 获取分类详情
   * @route GET /api/categories/:id
   */
  getCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await this.categoryService.getCategoryDetails(id);
    return this.success(res, category);
  });

  /**
   * 更新分类
   * @route PUT /api/categories/:id
   */
  updateCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateDto = req.body as UpdateCategoryDto;
    const updatedCategory = await this.categoryService.updateCategory(id, updateDto);
    logger.info(`分类更新成功: ${id}`);
    return this.success(res, updatedCategory);
  });

  /**
   * 删除分类
   * @route DELETE /api/categories/:id
   */
  deleteCategory = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.categoryService.deleteCategory(id);
    logger.info(`分类删除成功: ${id}`);
    return this.success(res, { success: true });
  });

  /**
   * 获取分类列表
   * @route GET /api/categories
   */
  getCategories = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as CategoryQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.categoryService.findCategories(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 获取所有分类（不分页）
   * @route GET /api/categories/all
   */
  getAllCategories = this.asyncHandler(async (req: Request, res: Response) => {
    const categories = await this.categoryService.getAllCategories();
    return this.success(res, categories);
  });

  /**
   * 获取分类的帖子数量
   * @route GET /api/categories/:id/post-count
   */
  getCategoryPostCount = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const count = await this.categoryService.getCategoryPostCount(id);
    return this.success(res, { count });
  });

  /**
   * 更新分类排序
   * @route PUT /api/categories/order
   */
  updateCategoryOrder = this.asyncHandler(async (req: Request, res: Response) => {
    const { categoryOrders } = req.body;
    await this.categoryService.updateCategoryOrder(categoryOrders);
    logger.info(`分类排序更新成功`);
    return this.success(res, { success: true });
  });
}
