import { Router } from 'express';
import { SensitiveWordController } from '../controllers/sensitive-word.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';

const router = Router();
const sensitiveWordController = new SensitiveWordController();

// 获取所有敏感词 (管理员权限)
router.get('/', 
  authenticate, 
  checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
  sensitiveWordController.getAllWords
);

// 添加敏感词 (管理员权限)
router.post('/', 
  authenticate, 
  checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
  sensitiveWordController.addWord
);

// 批量添加敏感词 (管理员权限)
router.post('/batch', 
  authenticate, 
  checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
  sensitiveWordController.addWords
);

// 删除敏感词 (管理员权限)
router.delete('/', 
  authenticate, 
  checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
  sensitiveWordController.removeWord
);

// 批量删除敏感词 (管理员权限)
router.delete('/batch', 
  authenticate, 
  checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
  sensitiveWordController.removeWords
);

// 检查文本是否包含敏感词
router.post('/check', sensitiveWordController.checkText);

// 过滤文本中的敏感词
router.post('/filter', sensitiveWordController.filterText);

export default router;
