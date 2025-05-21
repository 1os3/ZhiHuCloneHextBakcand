import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  CreateCommentDto,
  UpdateCommentDto,
  LikeCommentDto
} from '../dtos/comment.dto';

const router = Router();
const commentController = new CommentController();

// 公开路由
router.get('/:id', commentController.getComment);
router.get('/:parentId/replies', commentController.getCommentReplies);

// 需要认证的路由
router.post('/:parentId/replies', authenticate, validateRequest(CreateCommentDto), commentController.createReply);
router.put('/:id', authenticate, validateRequest(UpdateCommentDto), commentController.updateComment);
router.delete('/:id', authenticate, commentController.deleteComment);
router.post('/:id/like', authenticate, validateRequest(LikeCommentDto), commentController.likeComment);

export default router;
