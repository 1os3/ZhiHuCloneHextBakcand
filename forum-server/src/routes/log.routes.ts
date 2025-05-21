import { Router } from 'express';
import { LogController } from '../controllers/log.controller';
import { validateDto } from '../middlewares/validation.middleware';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorization.middleware';
import { UserRole } from '../models/user.entity';
import { LogCleanupDto } from '../dtos/log.dto';

const router = Router();
const logController = new LogController();

// 获取操作日志列表 - 需要管理员权限
router.get(
  '/activity',
  authenticate,
  authorize([UserRole.ADMIN]),
  logController.getActivityLogs
);

// 获取访问日志列表 - 需要管理员权限
router.get(
  '/access',
  authenticate,
  authorize([UserRole.ADMIN]),
  logController.getAccessLogs
);

// 获取访问统计数据 - 需要管理员权限
router.get(
  '/stats',
  authenticate,
  authorize([UserRole.ADMIN]),
  logController.getAccessStats
);

// 清理过期日志 - 需要管理员权限
router.post(
  '/cleanup',
  authenticate,
  authorize([UserRole.ADMIN]),
  validateDto(LogCleanupDto),
  logController.cleanupLogs
);

export default router;
