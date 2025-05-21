import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  CreateCategoryDto,
  UpdateCategoryDto
} from '../dtos/category.dto';

const router = Router();
const categoryController = new CategoryController();

// 公开路由
router.get('/', categoryController.getCategories);
router.get('/all', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategory);
router.get('/:id/post-count', categoryController.getCategoryPostCount);

// 管理员路由
router.post('/', authenticate, checkRole([UserRole.ADMIN]), validateRequest(CreateCategoryDto), categoryController.createCategory);
router.put('/:id', authenticate, checkRole([UserRole.ADMIN]), validateRequest(UpdateCategoryDto), categoryController.updateCategory);
router.delete('/:id', authenticate, checkRole([UserRole.ADMIN]), categoryController.deleteCategory);
router.put('/order', authenticate, checkRole([UserRole.ADMIN]), categoryController.updateCategoryOrder);

export default router;
