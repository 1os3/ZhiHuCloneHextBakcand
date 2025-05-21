import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { MarkdownService } from '../services/markdown.service';
import { logger } from '../config/logger.config';
import { HttpStatus } from '../utils/error.util';
import { sensitiveWordFilter } from '../utils/sensitive-word.util';

/**
 * Markdown 控制器，处理 Markdown 相关的 HTTP 请求
 */
export class MarkdownController extends BaseController {
  private readonly markdownService: MarkdownService;
  constructor() {
    super();
    this.markdownService = new MarkdownService();
  }

  /**
   * 解析 Markdown 为 HTML
   * @route POST /api/markdown/parse
   */
  parseMarkdown = this.asyncHandler(async (req: Request, res: Response) => {
    const { markdown } = req.body;
    
    if (!markdown) {
      return this.error(res, HttpStatus.BAD_REQUEST, 'Markdown 内容不能为空');
    }
    
    // 检查敏感词
    const hasSensitiveWords = sensitiveWordFilter.containsSensitiveWords(markdown);
    if (hasSensitiveWords) {
      logger.warn(`Markdown 内容包含敏感词，用户: ${req.user?.id}`);
      
      // 过滤敏感词
      const filteredMarkdown = sensitiveWordFilter.filter(markdown, '*');
      const html = await this.markdownService.parseMarkdown(filteredMarkdown);
      
      return this.success(res, { 
        html, 
        containsSensitiveWords: true,
        message: '内容包含敏感词，已被过滤'
      });
    }
    
    const html = await this.markdownService.parseMarkdown(markdown);
    return this.success(res, { html, containsSensitiveWords: false });
  });

  /**
   * 解析 Markdown 并处理文件引用
   * @route POST /api/markdown/parse-with-files
   */
  parseMarkdownWithFiles = this.asyncHandler(async (req: Request, res: Response) => {
    const { markdown } = req.body;
    const userId = req.user?.id;
    
    if (!markdown) {
      return this.error(res, HttpStatus.BAD_REQUEST, 'Markdown 内容不能为空');
    }
    
    // 检查敏感词
    const hasSensitiveWords = sensitiveWordFilter.containsSensitiveWords(markdown);
    if (hasSensitiveWords) {
      logger.warn(`Markdown 内容包含敏感词，用户: ${userId}`);
      
      // 过滤敏感词
      const filteredMarkdown = sensitiveWordFilter.filter(markdown, '*');
      const html = await this.markdownService.parseMarkdownWithFileReferences(filteredMarkdown, userId);
      
      return this.success(res, { 
        html, 
        containsSensitiveWords: true,
        message: '内容包含敏感词，已被过滤'
      });
    }
    
    const html = await this.markdownService.parseMarkdownWithFileReferences(markdown, userId);
    return this.success(res, { html, containsSensitiveWords: false });
  });

  /**
   * 提取 Markdown 摘要
   * @route POST /api/markdown/extract-summary
   */
  extractSummary = this.asyncHandler(async (req: Request, res: Response) => {
    const { markdown, length } = req.body;
    
    if (!markdown) {
      return this.error(res, HttpStatus.BAD_REQUEST, 'Markdown 内容不能为空');
    }
    
    const summary = this.markdownService.extractSummary(markdown, length || 200);
    return this.success(res, { summary });
  });

  /**
   * 提取 Markdown 中的第一张图片作为封面
   * @route POST /api/markdown/extract-cover
   */
  extractCoverImage = this.asyncHandler(async (req: Request, res: Response) => {
    const { markdown } = req.body;
    
    if (!markdown) {
      return this.error(res, HttpStatus.BAD_REQUEST, 'Markdown 内容不能为空');
    }
    
    const coverImage = this.markdownService.extractCoverImage(markdown);
    return this.success(res, { coverImage });
  });

  /**
   * 验证 Markdown 内容是否有效
   * @route POST /api/markdown/validate
   */
  validateMarkdown = this.asyncHandler(async (req: Request, res: Response) => {
    const { markdown } = req.body;
    
    if (!markdown) {
      return this.success(res, { valid: false, message: 'Markdown 内容不能为空' });
    }
    
    const valid = this.markdownService.validateMarkdown(markdown);
    
    if (!valid) {
      return this.success(res, { 
        valid: false, 
        message: 'Markdown 内容无效，请确保内容长度至少为 10 个字符，并包含基本的标题或段落结构' 
      });
    }
    
    // 检查敏感词
    const hasSensitiveWords = sensitiveWordFilter.containsSensitiveWords(markdown);
    if (hasSensitiveWords) {
      return this.success(res, { 
        valid: true, 
        containsSensitiveWords: true,
        message: '内容包含敏感词，发布时将被过滤'
      });
    }
    
    return this.success(res, { valid: true, containsSensitiveWords: false });
  });
}
