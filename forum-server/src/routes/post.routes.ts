import { Router } from 'express';
import { PostController } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  CreatePostDto,
  UpdatePostDto,
  LikePostDto,
  FavoritePostDto,
  PostQueryDto
} from '../dtos/post.dto';

const router = Router();
const postController = new PostController();

// 公开路由
router.get('/', postController.getPosts);
router.get('/:id', postController.getPost);
router.post('/search', validateRequest(PostQueryDto), postController.searchPosts);

// 需要认证的路由
router.post('/', authenticate, validateRequest(CreatePostDto), postController.createPost);
router.put('/:id', authenticate, validateRequest(UpdatePostDto), postController.updatePost);
router.delete('/:id', authenticate, postController.deletePost);
router.post('/:id/like', authenticate, validateRequest(LikePostDto), postController.likePost);
router.post('/:id/favorite', authenticate, validateRequest(FavoritePostDto), postController.favoritePost);

// 管理员路由
router.put('/:id/pin', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR]), postController.pinPost);
router.put('/:id/featured', authenticate, checkRole([UserRole.ADMIN, UserRole.MODERATOR]), postController.featurePost);

export default router;
