import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { SensitiveWordService } from '../services/sensitive-word.service';
import { sensitiveWordFilter } from '../utils/sensitive-word.util';
import { HttpStatus } from '../utils/error.util';
import { logger } from '../config/logger.config';

/**
 * 敏感词控制器，处理敏感词管理相关的HTTP请求
 */
export class SensitiveWordController extends BaseController {
  private readonly sensitiveWordService: SensitiveWordService;
  
  constructor() {
    super();
    this.sensitiveWordService = new SensitiveWordService();
    
    // 初始化敏感词过滤器
    this.sensitiveWordService.initializeSensitiveWordFilter()
      .catch(error => logger.error('敏感词过滤器初始化失败', error));
  }

  /**
   * 获取所有敏感词
   */
  getAllWords = this.asyncHandler(async (req: Request, res: Response) => {
    const { page, limit } = req.query;
    const pageNumber = parseInt(page as string) || 1;
    const limitNumber = parseInt(limit as string) || 20;
    
    const result = await this.sensitiveWordService.findAllPaged(pageNumber, limitNumber);
    return this.success(res, result);
  });

  /**
   * 添加敏感词
   */
  addWord = this.asyncHandler(async (req: Request, res: Response) => {
    const { word, category, isRegex } = req.body;
    const userId = req.user?.id;
    
    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return this.error(res, HttpStatus.BAD_REQUEST, '敏感词不能为空');
    }
    
    try {
      const savedWord = await this.sensitiveWordService.addWord(
        word.trim(), 
        userId, 
        category, 
        isRegex === true
      );
      return this.success(res, savedWord);
    } catch (error: any) {
      if (error.status === HttpStatus.CONFLICT) {
        return this.error(res, HttpStatus.CONFLICT, '敏感词已存在');
      }
      throw error;
    }
  });

  /**
   * 批量添加敏感词
   */
  addWords = this.asyncHandler(async (req: Request, res: Response) => {
    const { words, category } = req.body;
    const userId = req.user?.id;
    
    if (!Array.isArray(words) || words.length === 0) {
      return this.error(res, HttpStatus.BAD_REQUEST, '敏感词列表不能为空');
    }
    
    const validWords = words
      .filter(word => typeof word === 'string' && word.trim().length > 0)
      .map(word => word.trim());
    
    if (validWords.length === 0) {
      return this.error(res, HttpStatus.BAD_REQUEST, '没有有效的敏感词');
    }
    
    const result = await this.sensitiveWordService.addWords(validWords, userId, category);
    return this.success(res, result);
  });

  /**
   * 删除敏感词
   */
  removeWord = this.asyncHandler(async (req: Request, res: Response) => {
    const { word, id } = req.body;
    
    try {
      let success = false;
      
      if (id) {
        // 根据ID删除
        success = await this.sensitiveWordService.removeWordById(id);
      } else if (word && typeof word === 'string' && word.trim().length > 0) {
        // 根据词语删除
        success = await this.sensitiveWordService.removeWord(word.trim());
      } else {
        return this.error(res, HttpStatus.BAD_REQUEST, '需要提供敏感词ID或者敏感词内容');
      }
      
      return this.success(res, { success });
    } catch (error: any) {
      if (error.status === HttpStatus.NOT_FOUND) {
        return this.error(res, HttpStatus.NOT_FOUND, '敏感词不存在');
      }
      throw error;
    }
  });

  /**
   * 批量删除敏感词
   */
  removeWords = this.asyncHandler(async (req: Request, res: Response) => {
    const { ids, words } = req.body;
    
    if (ids && Array.isArray(ids) && ids.length > 0) {
      // 根据ID批量删除
      const result = await this.sensitiveWordService.removeWordsByIds(ids);
      return this.success(res, result);
    } else if (words && Array.isArray(words) && words.length > 0) {
      // 根据词语批量删除
      const validWords = words
        .filter(word => typeof word === 'string' && word.trim().length > 0)
        .map(word => word.trim());
      
      if (validWords.length === 0) {
        return this.error(res, HttpStatus.BAD_REQUEST, '没有有效的敏感词');
      }
      
      // 先查询这些词的ID
      const sensitiveWords = await Promise.all(
        validWords.map(async word => {
          try {
            await this.sensitiveWordService.removeWord(word);
            return word;
          } catch (error) {
            logger.warn(`删除敏感词失败: ${word}`);
            return null;
          }
        })
      );
      
      const removedWords = sensitiveWords.filter(word => word !== null) as string[];
      return this.success(res, { 
        success: true, 
        count: removedWords.length, 
        words: removedWords 
      });
    } else {
      return this.error(res, HttpStatus.BAD_REQUEST, '需要提供敏感词ID列表或者敏感词内容列表');
    }
  });

  /**
   * 检查文本是否包含敏感词
   */
  checkText = this.asyncHandler(async (req: Request, res: Response) => {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return this.error(res, HttpStatus.BAD_REQUEST, '文本不能为空');
    }
    
    const result = await this.sensitiveWordService.checkText(text);
    return this.success(res, result);
  });

  /**
   * 过滤文本中的敏感词
   */
  filterText = this.asyncHandler(async (req: Request, res: Response) => {
    const { text, replacement } = req.body;
    
    if (!text || typeof text !== 'string') {
      return this.error(res, HttpStatus.BAD_REQUEST, '文本不能为空');
    }
    
    const result = await this.sensitiveWordService.filterText(text, replacement);
    
    return this.success(res, {
      original: text,
      filtered: result.filtered,
      sensitiveWords: result.sensitiveWords,
      containsSensitiveWords: result.sensitiveWords.length > 0
    });
  });
}
