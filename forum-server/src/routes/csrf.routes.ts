import { Router } from 'express';
import { Request, Response } from 'express';
import { refreshCsrfToken } from '../middlewares/csrf.middleware';

const router = Router();

/**
 * 获取新的 CSRF 令牌
 * @route GET /api/csrf/token
 */
router.get('/token', (req: Request, res: Response) => {
  refreshCsrfToken(req, res);
});

export default router;
