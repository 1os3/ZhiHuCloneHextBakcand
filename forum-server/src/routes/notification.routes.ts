import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { UpdateNotificationDto } from '../dtos/notification.dto';

const router = Router();
const notificationController = new NotificationController();

// 所有通知路由都需要认证，已在主路由文件中添加authenticate中间件

// 获取通知列表
router.get('/', notificationController.getNotifications);

// 获取通知详情
router.get('/:id', notificationController.getNotification);

// 标记通知为已读
router.put('/:id', validateRequest(UpdateNotificationDto), notificationController.markAsRead);

// 批量标记通知为已读
router.put('/batch-update', validateRequest(UpdateNotificationDto), notificationController.batchMarkAsRead);

// 删除通知
router.delete('/:id', notificationController.deleteNotification);

// 获取未读通知数量
router.get('/unread-count', notificationController.getUnreadCount);

export default router;
