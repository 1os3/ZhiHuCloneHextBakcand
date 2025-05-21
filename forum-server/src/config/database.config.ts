import { DataSource } from 'typeorm';
import { env } from './env.config';
import path from 'path';

// 创建 TypeORM 数据源
export const AppDataSource = new DataSource({
  type: env.database.type as 'postgres',
  host: env.database.host,
  port: env.database.port,
  username: env.database.username,
  password: env.database.password,
  database: env.database.database,
  synchronize: env.nodeEnv === 'development', // 开发环境下自动同步数据库结构
  logging: env.nodeEnv === 'development', // 开发环境下记录SQL日志
  entities: [path.join(__dirname, '../models/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, '../migrations/**/*{.ts,.js}')],
  subscribers: [path.join(__dirname, '../subscribers/**/*{.ts,.js}')],
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false,
});

// 初始化数据库连接
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('数据库连接已建立');
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
};
