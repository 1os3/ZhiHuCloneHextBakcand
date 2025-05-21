import { Repository, FindOptionsWhere, In } from 'typeorm';
import { AppDataSource } from '../config/database.config';
import { SensitiveWord } from '../models/sensitive-word.entity';
import { BaseService } from './base.service';
import { ApiError, HttpStatus } from '../utils/error.util';
import { sensitiveWordFilter } from '../utils/sensitive-word.util';
import { logger } from '../config/logger.config';

/**
 * 敏感词服务类，处理敏感词相关的业务逻辑
 */
export class SensitiveWordService extends BaseService<SensitiveWord> {
  private readonly sensitiveWordRepository: Repository<SensitiveWord>;

  constructor() {
    const sensitiveWordRepository = AppDataSource.getRepository(SensitiveWord);
    super(sensitiveWordRepository);
    this.sensitiveWordRepository = sensitiveWordRepository;
  }

  /**
   * 初始化敏感词过滤器
   * 从数据库加载所有敏感词到内存中
   */
  async initializeSensitiveWordFilter(): Promise<void> {
    try {
      const words = await this.sensitiveWordRepository.find({
        where: { isActive: true }
      });

      // 清空现有的敏感词
      sensitiveWordFilter.clearWords();

      // 添加所有活跃的敏感词到过滤器
      words.forEach(word => {
        sensitiveWordFilter.addWord(word.word);
      });

      logger.info(`敏感词过滤器初始化完成，共加载 ${words.length} 个敏感词`);
    } catch (error) {
      logger.error('敏感词过滤器初始化失败', error);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '敏感词过滤器初始化失败');
    }
  }

  /**
   * 获取所有敏感词带分页
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页敏感词列表
   */
  async findAllPaged(page: number = 1, limit: number = 20): Promise<{ items: SensitiveWord[]; total: number; page: number; limit: number }> {
    const [items, total] = await this.sensitiveWordRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' }
    });

    return {
      items,
      total,
      page,
      limit
    };
  }

  /**
   * 添加敏感词
   * @param word 敏感词
   * @param userId 创建者ID
   * @param category 分类
   * @param isRegex 是否正则表达式
   * @returns 创建的敏感词
   */
  async addWord(word: string, userId?: string, category?: string, isRegex: boolean = false): Promise<SensitiveWord> {
    try {
      // 检查敏感词是否已存在
      const existingWord = await this.sensitiveWordRepository.findOne({
        where: { word }
      });

      if (existingWord) {
        throw new ApiError(HttpStatus.CONFLICT, '敏感词已存在');
      }

      // 创建新敏感词
      const sensitiveWord = this.sensitiveWordRepository.create({
        word,
        category,
        isRegex,
        createdBy: userId,
        isActive: true
      });

      // 保存到数据库
      const savedWord = await this.sensitiveWordRepository.save(sensitiveWord);

      // 添加到内存中的过滤器
      sensitiveWordFilter.addWord(word);

      logger.info(`敏感词添加成功: ${word}`);
      return savedWord;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('敏感词添加失败', error);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '敏感词添加失败');
    }
  }

  /**
   * 批量添加敏感词
   * @param words 敏感词数组
   * @param userId 创建者ID
   * @param category 分类
   * @returns 添加成功的敏感词数量
   */
  async addWords(words: string[], userId?: string, category?: string): Promise<{ count: number; words: SensitiveWord[] }> {
    try {
      // 过滤重复的敏感词
      const uniqueWords = [...new Set(words)];
      
      // 检查哪些敏感词已存在
      const existingWords = await this.sensitiveWordRepository.find({
        where: { word: In(uniqueWords) }
      });
      
      const existingWordSet = new Set(existingWords.map(w => w.word));
      const newWords = uniqueWords.filter(word => !existingWordSet.has(word));
      
      if (newWords.length === 0) {
        return { count: 0, words: [] };
      }
      
      // 创建新敏感词实体
      const sensitiveWords = newWords.map(word => {
        return this.sensitiveWordRepository.create({
          word,
          category,
          createdBy: userId,
          isActive: true
        });
      });
      
      // 保存到数据库
      const savedWords = await this.sensitiveWordRepository.save(sensitiveWords);
      
      // 添加到内存中的过滤器
      savedWords.forEach(word => {
        sensitiveWordFilter.addWord(word.word);
      });
      
      logger.info(`批量添加敏感词成功，共 ${savedWords.length} 个`);
      return { count: savedWords.length, words: savedWords };
    } catch (error) {
      logger.error('批量添加敏感词失败', error);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '批量添加敏感词失败');
    }
  }

  /**
   * 删除敏感词
   * @param id 敏感词ID
   * @returns 删除结果
   */
  async removeWordById(id: string): Promise<boolean> {
    try {
      const sensitiveWord = await this.sensitiveWordRepository.findOne({
        where: { id }
      });

      if (!sensitiveWord) {
        throw new ApiError(HttpStatus.NOT_FOUND, '敏感词不存在');
      }

      // 从数据库中删除
      await this.sensitiveWordRepository.remove(sensitiveWord);

      // 从内存中的过滤器中删除
      sensitiveWordFilter.removeWord(sensitiveWord.word);

      logger.info(`敏感词删除成功: ${sensitiveWord.word}`);
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('敏感词删除失败', error);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '敏感词删除失败');
    }
  }

  /**
   * 根据词语删除敏感词
   * @param word 敏感词
   * @returns 删除结果
   */
  async removeWord(word: string): Promise<boolean> {
    try {
      const sensitiveWord = await this.sensitiveWordRepository.findOne({
        where: { word }
      });

      if (!sensitiveWord) {
        throw new ApiError(HttpStatus.NOT_FOUND, '敏感词不存在');
      }

      // 从数据库中删除
      await this.sensitiveWordRepository.remove(sensitiveWord);

      // 从内存中的过滤器中删除
      sensitiveWordFilter.removeWord(word);

      logger.info(`敏感词删除成功: ${word}`);
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      logger.error('敏感词删除失败', error);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '敏感词删除失败');
    }
  }

  /**
   * 批量删除敏感词
   * @param ids 敏感词ID数组
   * @returns 删除结果
   */
  async removeWordsByIds(ids: string[]): Promise<{ count: number }> {
    try {
      const sensitiveWords = await this.sensitiveWordRepository.find({
        where: { id: In(ids) }
      });

      if (sensitiveWords.length === 0) {
        return { count: 0 };
      }

      // 从数据库中删除
      await this.sensitiveWordRepository.remove(sensitiveWords);

      // 从内存中的过滤器中删除
      sensitiveWords.forEach(word => {
        sensitiveWordFilter.removeWord(word.word);
      });

      logger.info(`批量删除敏感词成功，共 ${sensitiveWords.length} 个`);
      return { count: sensitiveWords.length };
    } catch (error) {
      logger.error('批量删除敏感词失败', error);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '批量删除敏感词失败');
    }
  }

  /**
   * 更新敏感词命中次数
   * @param word 敏感词
   * @returns 更新结果
   */
  async incrementHitCount(word: string): Promise<void> {
    try {
      await this.sensitiveWordRepository.increment({ word }, 'hitCount', 1);
    } catch (error) {
      logger.error(`更新敏感词命中次数失败: ${word}`, error);
      // 不抛出异常，避免影响正常业务流程
    }
  }

  /**
   * 批量更新敏感词命中次数
   * @param words 敏感词数组
   */
  async batchIncrementHitCount(words: string[]): Promise<void> {
    try {
      if (words.length === 0) {
        return;
      }

      // 使用事务批量更新
      await AppDataSource.transaction(async transactionalEntityManager => {
        for (const word of words) {
          await transactionalEntityManager.increment(SensitiveWord, { word }, 'hitCount', 1);
        }
      });
    } catch (error) {
      logger.error('批量更新敏感词命中次数失败', error);
      // 不抛出异常，避免影响正常业务流程
    }
  }

  /**
   * 检查文本是否包含敏感词
   * @param text 要检查的文本
   * @returns 检查结果和找到的敏感词
   */
  async checkText(text: string): Promise<{ containsSensitiveWords: boolean; sensitiveWords: string[] }> {
    // 使用内存中的过滤器检查
    const containsSensitiveWords = sensitiveWordFilter.containsSensitiveWords(text);
    const foundWords = sensitiveWordFilter.findSensitiveWords(text);
    
    // 如果找到敏感词，更新命中次数
    if (foundWords.length > 0) {
      await this.batchIncrementHitCount(foundWords);
    }
    
    return {
      containsSensitiveWords,
      sensitiveWords: foundWords
    };
  }

  /**
   * 过滤文本中的敏感词
   * @param text 要过滤的文本
   * @param replacement 替换字符，默认为 *
   * @returns 过滤后的文本和找到的敏感词
   */
  async filterText(text: string, replacement: string = '*'): Promise<{ filtered: string; sensitiveWords: string[] }> {
    // 使用内存中的过滤器过滤
    const filtered = sensitiveWordFilter.filter(text, replacement);
    const foundWords = sensitiveWordFilter.findSensitiveWords(text);
    
    // 如果找到敏感词，更新命中次数
    if (foundWords.length > 0) {
      await this.batchIncrementHitCount(foundWords);
    }
    
    return {
      filtered,
      sensitiveWords: foundWords
    };
  }
}
