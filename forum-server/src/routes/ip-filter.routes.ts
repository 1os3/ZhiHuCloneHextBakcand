import { Router } from 'express';
import { IPFilterController } from '../controllers/ip-filter.controller';
import { validateDto } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import { UserRole } from '../models/user.entity';
import { CreateIPFilterDto, UpdateIPFilterDto } from '../dtos/ip-filter.dto';

const router = Router();
const ipFilterController = new IPFilterController();

// 公共路由 - 检查当前IP是否被允许访问
router.get('/check', ipFilterController.checkIPAccess);

// 管理员路由 - 需要管理员权限
// 获取IP过滤规则列表
router.get(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  ipFilterController.getIPFilters
);

// 创建IP过滤规则
router.post(
  '/',
  authenticate,
  authorize([UserRole.ADMIN]),
  validateDto(CreateIPFilterDto),
  ipFilterController.createIPFilter
);

// 更新IP过滤规则
router.put(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  validateDto(UpdateIPFilterDto),
  ipFilterController.updateIPFilter
);

// 删除IP过滤规则
router.delete(
  '/:id',
  authenticate,
  authorize([UserRole.ADMIN]),
  ipFilterController.deleteIPFilter
);

// 手动清理过期的IP过滤规则
router.post(
  '/cleanup',
  authenticate,
  authorize([UserRole.ADMIN]),
  ipFilterController.cleanupExpiredFilters
);

export default router;
