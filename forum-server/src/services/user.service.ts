import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { User, UserRole, UserStatus } from '../models/user.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { PasswordUtil } from '../utils/password.util';
import { JwtUtil } from '../utils/jwt.util';
import { RegisterUserDto, LoginUserDto, UpdateUserProfileDto, ChangePasswordDto, ResetPasswordDto, ForgotPasswordDto, AdminUpdateUserDto, UserQueryDto } from '../dtos/user.dto';
import { logger } from '../config/logger.config';
import * as crypto from 'crypto';
import { LoginAttemptService } from './login-attempt.service';

/**
 * 用户服务类，处理用户相关的业务逻辑
 */
export class UserService extends BaseService<User> {
  private readonly userRepository: Repository<User>;
  private readonly loginAttemptService: LoginAttemptService;

  constructor() {
    const userRepository = AppDataSource.getRepository(User);
    super(userRepository);
    this.userRepository = userRepository;
    this.loginAttemptService = new LoginAttemptService();
  }

  /**
   * 用户注册
   * @param registerDto 注册数据
   * @returns 注册成功的用户信息和令牌
   */
  async register(registerDto: RegisterUserDto): Promise<{ user: Partial<User>; token: string }> {
    // 检查用户名是否已存在
    const existingUsername = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUsername) {
      throw new ApiError(HttpStatus.CONFLICT, '用户名已被使用');
    }

    // 检查邮箱是否已存在
    const existingEmail = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingEmail) {
      throw new ApiError(HttpStatus.CONFLICT, '邮箱已被注册');
    }

    // 生成验证令牌
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // 创建新用户
    const hashedPassword = await PasswordUtil.hash(registerDto.password);
    const newUser = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      nickname: registerDto.nickname || registerDto.username,
      emailVerificationToken,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    // 保存用户
    const savedUser = await this.userRepository.save(newUser);
    logger.info(`新用户注册成功: ${savedUser.username} (${savedUser.id})`);

    // 发送验证邮件（此处省略实现）
    // await this.sendVerificationEmail(savedUser.email, emailVerificationToken);

    // 生成JWT令牌
    const token = JwtUtil.generateToken({
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
    });

    // 返回用户信息（排除敏感字段）
    const { password, emailVerificationToken: _, ...userWithoutSensitiveInfo } = savedUser;
    return { user: userWithoutSensitiveInfo, token };
  }

  /**
   * 用户登录
   * @param loginDto 登录数据
   * @param ipAddress 用户IP地址
   * @param userAgent 用户代理
   * @returns 登录成功的用户信息和令牌
   */
  async login(loginDto: LoginUserDto, ipAddress?: string, userAgent?: string): Promise<{ user: Partial<User>; token: string; refreshToken: string }> {
    const identifier = loginDto.usernameOrEmail;
    
    // 检查账户是否被锁定
    const lockStatus = await this.loginAttemptService.isAccountLocked(identifier);
    if (lockStatus.locked) {
      // 记录失败尝试
      await this.loginAttemptService.recordAttempt(
        identifier, 
        false, 
        ipAddress, 
        userAgent, 
        '账户已锁定'
      );
      
      const minutes = Math.ceil(lockStatus.remainingTime / 60);
      throw new ApiError(
        HttpStatus.TOO_MANY_REQUESTS, 
        `由于多次失败尝试，账户已被锁定。请在 ${minutes} 分钟后重试。`
      );
    }
    
    // 查找用户（通过用户名或邮箱）
    const user = await this.userRepository.findOne({
      where: [
        { username: identifier },
        { email: identifier },
      ],
    });

    if (!user) {
      // 记录失败尝试
      await this.loginAttemptService.recordAttempt(
        identifier, 
        false, 
        ipAddress, 
        userAgent, 
        '用户不存在'
      );
      throw new ApiError(HttpStatus.UNAUTHORIZED, '用户名/邮箱或密码不正确');
    }

    // 检查用户状态
    if (user.status === UserStatus.BANNED) {
      // 记录失败尝试
      await this.loginAttemptService.recordAttempt(
        identifier, 
        false, 
        ipAddress, 
        userAgent, 
        '账户已被禁用'
      );
      throw new ApiError(HttpStatus.FORBIDDEN, '账户已被禁用，请联系管理员');
    }

    // 验证密码
    const isPasswordValid = await PasswordUtil.verify(loginDto.password, user.password);
    if (!isPasswordValid) {
      // 记录失败尝试
      await this.loginAttemptService.recordAttempt(
        identifier, 
        false, 
        ipAddress, 
        userAgent, 
        '密码错误'
      );
      throw new ApiError(HttpStatus.UNAUTHORIZED, '用户名/邮箱或密码不正确');
    }

    // 登录成功，重置锁定状态
    await this.loginAttemptService.recordAttempt(
      identifier, 
      true, 
      ipAddress, 
      userAgent
    );

    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await this.userRepository.save(user);

    // 生成JWT令牌
    const token = JwtUtil.generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    // 生成刷新令牌
    const refreshToken = JwtUtil.generateRefreshToken({
      id: user.id,
      username: user.username,
    });

    // 返回用户信息（排除敏感字段）
    const { password: _, emailVerificationToken: __, ...userWithoutSensitiveInfo } = user;
    return { user: userWithoutSensitiveInfo, token, refreshToken };
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   * @returns 新的访问令牌
   */
  async refreshToken(refreshToken: string): Promise<{ token: string }> {
    try {
      // 验证刷新令牌
      const decoded = JwtUtil.verifyToken(refreshToken) as any;
      
      // 查找用户
      const user = await this.findById(decoded.id);
      
      // 生成新的访问令牌
      const token = JwtUtil.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });
      
      return { token };
    } catch (error) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, '无效的刷新令牌');
    }
  }

  /**
   * 更新用户资料
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新后的用户信息
   */
  async updateProfile(userId: string, updateDto: UpdateUserProfileDto): Promise<Partial<User>> {
    const user = await this.findById(userId);
    
    // 更新用户资料
    const updatedUser = await this.update(userId, updateDto);
    
    // 返回用户信息（排除敏感字段）
    const { password, emailVerificationToken, ...userWithoutSensitiveInfo } = updatedUser;
    return userWithoutSensitiveInfo;
  }

  /**
   * 更改密码
   * @param userId 用户ID
   * @param changePasswordDto 更改密码数据
   * @returns 更改结果
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ success: boolean }> {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;
    
    // 检查新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '新密码和确认密码不一致');
    }
    
    // 查找用户
    const user = await this.findById(userId);
    
    // 验证当前密码
    const isPasswordValid = await PasswordUtil.verify(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError(HttpStatus.UNAUTHORIZED, '当前密码不正确');
    }
    
    // 更新密码
    const hashedPassword = await PasswordUtil.hash(newPassword);
    await this.update(userId, { password: hashedPassword });
    
    return { success: true };
  }

  /**
   * 忘记密码
   * @param forgotPasswordDto 忘记密码数据
   * @returns 操作结果
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ success: boolean }> {
    const { email } = forgotPasswordDto;
    
    // 查找用户
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      // 为了安全，即使用户不存在也返回成功
      return { success: true };
    }
    
    // 生成密码重置令牌
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // 1小时有效期
    
    // 更新用户的密码重置信息
    await this.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });
    
    // 发送密码重置邮件（此处省略实现）
    // await this.sendPasswordResetEmail(email, resetToken);
    
    return { success: true };
  }

  /**
   * 重置密码
   * @param resetPasswordDto 重置密码数据
   * @returns 重置结果
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ success: boolean }> {
    const { token, newPassword, confirmPassword } = resetPasswordDto;
    
    // 检查新密码和确认密码是否一致
    if (newPassword !== confirmPassword) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '新密码和确认密码不一致');
    }
    
    // 查找具有该重置令牌且未过期的用户
    const user = await this.userRepository.findOne({
      where: {
        passwordResetToken: token,
        passwordResetExpires: new Date(Date.now()),
      },
    });
    
    if (!user) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '密码重置令牌无效或已过期');
    }
    
    // 更新密码并清除重置信息
    const hashedPassword = await PasswordUtil.hash(newPassword);
    await this.update(user.id, {
      password: hashedPassword,
      passwordResetToken: "",
      passwordResetExpires: undefined,
    });
    
    return { success: true };
  }

  /**
   * 验证邮箱
   * @param token 验证令牌
   * @returns 验证结果
   */
  async verifyEmail(token: string): Promise<{ success: boolean }> {
    // 查找具有该验证令牌的用户
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token },
    });
    
    if (!user) {
      throw new ApiError(HttpStatus.BAD_REQUEST, '邮箱验证令牌无效');
    }
    
    // 更新用户的邮箱验证状态
    await this.update(user.id, {
      emailVerified: true,
      emailVerificationToken: "",
    });
    
    return { success: true };
  }

  /**
   * 管理员更新用户
   * @param userId 用户ID
   * @param updateDto 更新数据
   * @returns 更新后的用户信息
   */
  async adminUpdateUser(userId: string, updateDto: AdminUpdateUserDto): Promise<Partial<User>> {
    const user = await this.findById(userId);
    
    // 更新用户信息
    const updatedUser = await this.update(userId, updateDto);
    
    // 返回用户信息（排除敏感字段）
    const { password, emailVerificationToken, ...userWithoutSensitiveInfo } = updatedUser;
    return userWithoutSensitiveInfo;
  }

  /**
   * 查询用户列表
   * @param queryDto 查询参数
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页用户列表
   */
  async findUsers(
    queryDto: UserQueryDto,
    page: number = 1,
    limit: number = 10
  ): Promise<{ items: Partial<User>[]; total: number; page: number; limit: number }> {
    const { search, role, status, emailVerified, createdAfter, createdBefore } = queryDto;
    
    // 构建查询条件
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    
    // 搜索条件
    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search OR user.nickname LIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    // 角色过滤
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }
    
    // 状态过滤
    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }
    
    // 邮箱验证状态过滤
    if (emailVerified !== undefined) {
      queryBuilder.andWhere('user.emailVerified = :emailVerified', { emailVerified });
    }
    
    // 创建日期范围过滤
    if (createdAfter) {
      queryBuilder.andWhere('user.createdAt >= :createdAfter', { createdAfter });
    }
    
    if (createdBefore) {
      queryBuilder.andWhere('user.createdAt <= :createdBefore', { createdBefore });
    }
    
    // 分页
    const total = await queryBuilder.getCount();
    const users = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.createdAt', 'DESC')
      .getMany();
    
    // 移除敏感字段
    const usersWithoutSensitiveInfo = users.map(user => {
      const { password, emailVerificationToken, passwordResetToken, passwordResetExpires, ...rest } = user;
      return rest;
    });
    
    return {
      items: usersWithoutSensitiveInfo,
      total,
      page,
      limit,
    };
  }

  /**
   * 获取用户详情
   * @param userId 用户ID
   * @returns 用户详情
   */
  async getUserDetails(userId: string): Promise<Partial<User>> {
    const user = await this.findById(userId, ['posts', 'comments']);
    
    // 返回用户信息（排除敏感字段）
    const { password, emailVerificationToken, passwordResetToken, passwordResetExpires, ...userWithoutSensitiveInfo } = user;
    return userWithoutSensitiveInfo;
  }
}
