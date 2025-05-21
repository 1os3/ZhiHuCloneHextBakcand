import { Router } from 'express';
import userRoutes from './user.routes';
import postRoutes from './post.routes';
import commentRoutes from './comment.routes';
import categoryRoutes from './category.routes';
import notificationRoutes from './notification.routes';
import messageRoutes from './message.routes';
import reportRoutes from './report.routes';
import fileRoutes from './file.routes';
import fileAdminRoutes from './file-admin.route';
import sensitiveWordRoutes from './sensitive-word.routes';
import markdownRoutes from './markdown.routes';
import csrfRoutes from './csrf.routes';
import ipFilterRoutes from './ip-filter.routes';
import logRoutes from './log.routes';
import healthRoutes from './health.routes';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// 健康检查路由
router.use('/health', healthRoutes);

// API版本前缀
const apiPrefix = '/api';

// 用户相关路由
router.use(`${apiPrefix}/users`, userRoutes);

// 帖子相关路由
router.use(`${apiPrefix}/posts`, postRoutes);

// 评论相关路由
router.use(`${apiPrefix}/comments`, commentRoutes);

// 分类相关路由
router.use(`${apiPrefix}/categories`, categoryRoutes);

// 通知相关路由 (需要认证)
router.use(`${apiPrefix}/notifications`, authenticate, notificationRoutes);

// 私信相关路由 (需要认证)
router.use(`${apiPrefix}/messages`, authenticate, messageRoutes);

// 举报相关路由
router.use(`${apiPrefix}/reports`, reportRoutes);

// 文件上传相关路由
router.use(`${apiPrefix}/files`, fileRoutes);

// 文件管理相关路由
router.use(`${apiPrefix}/admin/files`, fileAdminRoutes);

// 敏感词管理相关路由
router.use(`${apiPrefix}/sensitive-words`, sensitiveWordRoutes);

// Markdown相关路由
router.use(`${apiPrefix}/markdown`, markdownRoutes);

// CSRF 相关路由
router.use(`${apiPrefix}/csrf`, csrfRoutes);

// IP过滤相关路由
router.use(`${apiPrefix}/ip-filters`, ipFilterRoutes);

// IP过滤管理路由
router.use(`${apiPrefix}/admin/ip-filters`, ipFilterRoutes);

// 日志管理路由
router.use(`${apiPrefix}/admin/logs`, logRoutes);

export default router;
