import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  CreateReportDto,
  ResolveReportDto
} from '../dtos/report.dto';

const router = Router();
const reportController = new ReportController();

// 需要认证的路由
router.post('/', authenticate, validateRequest(CreateReportDto), reportController.createReport);

// 管理员路由
router.get('/', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR]), reportController.getReports);
router.get('/:id', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR]), reportController.getReport);
router.put('/:id/resolve', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR]), validateRequest(ResolveReportDto), reportController.resolveReport);
router.get('/pending-count', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR]), reportController.getPendingCount);

export default router;
