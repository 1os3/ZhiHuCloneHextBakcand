import bcrypt from 'bcrypt';

// 密码加密工具类
export class PasswordUtil {
  // 加密密码
  static async hash(password: string): Promise<string> {
    // 生成盐值，数字越大安全性越高，但性能消耗也越大
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    // 使用盐值加密密码
    return bcrypt.hash(password, salt);
  }

  // 验证密码
  static async verify(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // 生成随机密码（用于重置密码）
  static generateRandomPassword(length = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+';
    let password = '';
    
    // 确保密码至少包含一个大写字母、一个小写字母、一个数字和一个特殊字符
    password += charset.substring(26, 52).charAt(Math.floor(Math.random() * 26)); // 大写字母
    password += charset.substring(0, 26).charAt(Math.floor(Math.random() * 26));  // 小写字母
    password += charset.substring(52, 62).charAt(Math.floor(Math.random() * 10)); // 数字
    password += charset.substring(62).charAt(Math.floor(Math.random() * (charset.length - 62))); // 特殊字符
    
    // 填充剩余长度
    for (let i = 4; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    // 打乱密码字符顺序
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }
}
