import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';
import { validateDto } from '../middlewares/validation.middleware';
import { FileQueryDto, FileUpdateDto } from '../dtos/file.dto';

const router = Router();
const fileController = new FileController();

// 上传文件 (需要认证)
router.post('/', authenticate, fileController.uploadFile);

// 获取文件详情
router.get('/:id', fileController.getFile);

// 获取文件列表 (管理员权限)
router.get('/', 
  authenticate, 
  checkRole([UserRole.ADMIN, UserRole.MODERATOR]),
  validateDto(FileQueryDto, 'query'),
  fileController.getFiles
);

// 获取用户上传的文件列表
router.get('/user/:userId', fileController.getUserFiles);

// 更新文件信息 (需要认证)
router.put('/:id', 
  authenticate, 
  validateDto(FileUpdateDto),
  fileController.updateFile
);

// 删除文件 (需要认证)
router.delete('/:id', authenticate, fileController.deleteFile);

export default router;
