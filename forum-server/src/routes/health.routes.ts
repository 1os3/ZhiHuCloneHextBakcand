import { Router } from 'express';
import healthController from '../controllers/health.controller';

const router = Router();

/**
 * @route GET /health
 * @desc 获取应用程序健康状态
 * @access Public
 */
router.get('/', healthController.getHealth.bind(healthController));

export default router;
