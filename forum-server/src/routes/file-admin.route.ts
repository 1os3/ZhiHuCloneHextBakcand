import { Router } from 'express';
import { FileAdminController } from '../controllers/file-admin.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';

const router = Router();
const fileAdminController = new FileAdminController();

// 所有路由都需要管理员权限
router.use(authenticate);
router.use(checkRole([UserRole.ADMIN]));

// 文件管理路由
router.get('/files', fileAdminController.getAllFiles);
router.get('/files/:id', fileAdminController.getFileDetails);
router.patch('/files/:id/status', fileAdminController.updateFileStatus);
router.delete('/files/:id', fileAdminController.deleteFile);
router.post('/files/batch-delete', fileAdminController.batchDeleteFiles);

// 文件清理路由
router.post('/files/cleanup/expired', fileAdminController.cleanupExpiredFiles);
router.post('/files/cleanup/unused', fileAdminController.cleanupUnusedFiles);

// 文件统计路由
router.get('/files/stats', fileAdminController.getFileStats);

export default router;
