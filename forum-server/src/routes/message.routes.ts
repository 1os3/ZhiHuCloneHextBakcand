import { Router } from 'express';
import { MessageController } from '../controllers/message.controller';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  CreateMessageDto,
  UpdateMessageStatusDto,
  DeleteMessageDto
} from '../dtos/message.dto';

const router = Router();
const messageController = new MessageController();

// 所有私信路由都需要认证，已在主路由文件中添加authenticate中间件

// 发送私信
router.post('/', validateRequest(CreateMessageDto), messageController.sendMessage);

// 获取私信详情
router.get('/:id', messageController.getMessage);

// 更新私信状态
router.put('/:id', validateRequest(UpdateMessageStatusDto), messageController.updateMessageStatus);

// 批量更新私信状态
router.put('/batch-update', validateRequest(UpdateMessageStatusDto), messageController.batchUpdateMessageStatus);

// 删除私信
router.delete('/:id', messageController.deleteMessage);

// 批量删除私信
router.delete('/', validateRequest(DeleteMessageDto), messageController.batchDeleteMessages);

// 获取私信列表
router.get('/', messageController.getMessages);

// 获取会话列表
router.get('/conversations', messageController.getConversations);

// 获取未读私信数量
router.get('/unread-count', messageController.getUnreadCount);

export default router;
