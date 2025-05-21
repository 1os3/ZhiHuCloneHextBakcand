import { AppDataSource } from '../config/database.config';
import { FileService } from '../services/file.service';
import { logger } from '../config/logger.config';

/**
 * 文件清理命令
 * 用法:
 *   - 清理过期文件: npm run cleanup:files -- --type=expired
 *   - 清理未使用文件: npm run cleanup:files -- --type=unused --days=90
 *   - 模拟运行: npm run cleanup:files -- --type=expired --dry-run
 */
async function cleanupFiles() {
  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const options: { [key: string]: string | boolean } = {};
    
    args.forEach(arg => {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        options[key] = value || true;
      }
    });
    
    // 默认参数
    const type = options.type || 'expired';
    const days = parseInt(options.days as string) || 90;
    const dryRun = options['dry-run'] === true;
    
    // 初始化数据库连接
    await AppDataSource.initialize();
    logger.info('数据库连接已初始化');
    
    const fileService = new FileService();
    
    // 执行清理操作
    if (type === 'expired') {
      logger.info(`开始清理过期文件${dryRun ? '（模拟运行）' : ''}`);
      const result = await fileService.cleanupExpiredFiles(dryRun);
      logger.info(`过期文件清理完成，共 ${result.count} 个文件`);
      
      if (dryRun && result.files.length > 0) {
        logger.info('以下文件将被清理:');
        result.files.forEach(file => {
          logger.info(`- ${file.id}: ${file.originalname} (${file.status})`);
        });
      }
    } else if (type === 'unused') {
      logger.info(`开始清理 ${days} 天未使用的文件${dryRun ? '（模拟运行）' : ''}`);
      const result = await fileService.cleanupUnusedFiles(days, dryRun);
      logger.info(`未使用文件清理完成，共 ${result.count} 个文件`);
      
      if (dryRun && result.files.length > 0) {
        logger.info('以下文件将被标记为过期:');
        result.files.forEach(file => {
          logger.info(`- ${file.id}: ${file.originalname} (最后访问: ${file.lastAccessedAt || '从未访问'})`);
        });
      }
    } else {
      logger.error(`未知的清理类型: ${type}`);
      process.exit(1);
    }
    
    // 关闭数据库连接
    await AppDataSource.destroy();
    logger.info('数据库连接已关闭');
    
    process.exit(0);
  } catch (error: any) {
    logger.error(`文件清理失败: ${error.message}`);
    
    // 确保数据库连接关闭
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    
    process.exit(1);
  }
}

// 执行清理命令
cleanupFiles();
