import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/role.middleware';
import { UserRole } from '../models/user.entity';
import { validateRequest } from '../middlewares/validation.middleware';
import { 
  RegisterUserDto, 
  LoginUserDto, 
  UpdateUserProfileDto, 
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AdminUpdateUserDto
} from '../dtos/user.dto';

const router = Router();
const userController = new UserController();

// 公开路由
router.post('/register', validateRequest(RegisterUserDto), userController.register);
router.post('/login', validateRequest(LoginUserDto), userController.login);
router.post('/refresh-token', userController.refreshToken);
router.post('/forgot-password', validateRequest(ForgotPasswordDto), userController.forgotPassword);
router.post('/reset-password', validateRequest(ResetPasswordDto), userController.resetPassword);
router.get('/verify-email/:token', userController.verifyEmail);

// 需要认证的路由
router.get('/me', authenticate, userController.getCurrentUser);
router.put('/profile', authenticate, validateRequest(UpdateUserProfileDto), userController.updateProfile);
router.put('/change-password', authenticate, validateRequest(ChangePasswordDto), userController.changePassword);

// 管理员路由
router.get('/', authenticate, checkRole([UserRole.ADMIN]), userController.getUsers);
router.get('/:id', authenticate, checkRole([UserRole.ADMIN]), userController.getUserById);
router.put('/:id', authenticate, checkRole([UserRole.ADMIN]), validateRequest(AdminUpdateUserDto), userController.adminUpdateUser);

export default router;
