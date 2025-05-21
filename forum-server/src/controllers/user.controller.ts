import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { UserService } from '../services/user.service';
import { 
  RegisterUserDto, 
  LoginUserDto, 
  UpdateUserProfileDto, 
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UserQueryDto,
  AdminUpdateUserDto
} from '../dtos/user.dto';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../utils/logger.util';

/**
 * 用户控制器，处理用户相关的HTTP请求
 */
export class UserController extends BaseController {
  private readonly userService: UserService;

  constructor() {
    super();
    this.userService = new UserService();
  }

  /**
   * 用户注册
   * @route POST /api/users/register
   */
  register = this.asyncHandler(async (req: Request, res: Response) => {
    const registerDto = req.body as RegisterUserDto;
    const result = await this.userService.register(registerDto);
    logger.info(`用户注册成功: ${result.user.username}`);
    return this.success(res, result, HttpStatus.CREATED);
  });

  /**
   * 用户登录
   * @route POST /api/users/login
   */
  login = this.asyncHandler(async (req: Request, res: Response) => {
    const loginDto = req.body as LoginUserDto;
    
    // 获取用户 IP 地址
    const ipAddress = req.ip || 
                     req.headers['x-forwarded-for'] as string || 
                     req.socket.remoteAddress || 
                     'unknown';
    
    // 获取用户代理信息
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    // 调用登录服务，传递 IP 地址和用户代理信息
    const result = await this.userService.login(loginDto, ipAddress, userAgent);
    
    logger.info(`用户登录成功: ${result.user.username} (IP: ${ipAddress})`);
    return this.success(res, result);
  });

  /**
   * 刷新访问令牌
   * @route POST /api/users/refresh-token
   */
  refreshToken = this.asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await this.userService.refreshToken(refreshToken);
    return this.success(res, result);
  });

  /**
   * 获取当前用户信息
   * @route GET /api/users/me
   */
  getCurrentUser = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const user = await this.userService.getUserDetails(userId);
    return this.success(res, user);
  });

  /**
   * 更新用户资料
   * @route PUT /api/users/profile
   */
  updateProfile = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const updateDto = req.body as UpdateUserProfileDto;
    const updatedUser = await this.userService.updateProfile(userId, updateDto);
    logger.info(`用户资料更新成功: ${userId}`);
    return this.success(res, updatedUser);
  });

  /**
   * 更改密码
   * @route PUT /api/users/change-password
   */
  changePassword = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const changePasswordDto = req.body as ChangePasswordDto;
    const result = await this.userService.changePassword(userId, changePasswordDto);
    logger.info(`用户密码更改成功: ${userId}`);
    return this.success(res, result);
  });

  /**
   * 忘记密码
   * @route POST /api/users/forgot-password
   */
  forgotPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const forgotPasswordDto = req.body as ForgotPasswordDto;
    const result = await this.userService.forgotPassword(forgotPasswordDto);
    logger.info(`忘记密码请求处理成功: ${forgotPasswordDto.email}`);
    return this.success(res, result);
  });

  /**
   * 重置密码
   * @route POST /api/users/reset-password
   */
  resetPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const resetPasswordDto = req.body as ResetPasswordDto;
    const result = await this.userService.resetPassword(resetPasswordDto);
    logger.info(`密码重置成功`);
    return this.success(res, result);
  });

  /**
   * 验证邮箱
   * @route GET /api/users/verify-email/:token
   */
  verifyEmail = this.asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.params;
    const result = await this.userService.verifyEmail(token);
    logger.info(`邮箱验证成功`);
    return this.success(res, result);
  });

  /**
   * 管理员获取用户列表
   * @route GET /api/admin/users
   */
  getUsers = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...queryParams } = req.query;
    const queryDto = queryParams as unknown as UserQueryDto;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 10;
    
    const result = await this.userService.findUsers(queryDto, pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 管理员获取用户详情
   * @route GET /api/admin/users/:id
   */
  getUserById = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.getUserDetails(id);
    return this.success(res, user);
  });

  /**
   * 管理员更新用户
   * @route PUT /api/admin/users/:id
   */
  adminUpdateUser = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const updateDto = req.body as AdminUpdateUserDto;
    const updatedUser = await this.userService.adminUpdateUser(id, updateDto);
    logger.info(`管理员更新用户成功: ${id}`);
    return this.success(res, updatedUser);
  });
}
