import { markdownUtil } from '../utils/markdown.util';
import { FileService } from './file.service';
import { logger } from '../config/logger.config';
import { ApiError, HttpStatus } from '../utils/error.util';

/**
 * Markdown 服务类，处理 Markdown 内容的解析和渲染
 */
export class MarkdownService {
  private readonly fileService: FileService;

  constructor() {
    this.fileService = new FileService();
  }

  /**
   * 解析 Markdown 为 HTML
   * @param markdown Markdown 内容
   * @returns 解析后的 HTML
   */
  async parseMarkdown(markdown: string): Promise<string> {
    try {
      if (!markdown) {
        return '';
      }
      
      return markdownUtil.parse(markdown);
    } catch (error: any) {
      logger.error(`Markdown 解析失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, 'Markdown 解析失败');
    }
  }

  /**
   * 解析 Markdown 并处理文件引用
   * @param markdown Markdown 内容
   * @param userId 用户ID（用于权限检查）
   * @returns 解析后的 HTML
   */
  async parseMarkdownWithFileReferences(markdown: string, userId?: string): Promise<string> {
    try {
      if (!markdown) {
        return '';
      }
      
      // 提取文件引用
      const fileIds = this.extractFileReferences(markdown);
      
      if (fileIds.length === 0) {
        // 没有文件引用，直接解析
        return await this.parseMarkdown(markdown);
      }
      
      // 获取文件 URL
      const fileMap: Record<string, string> = {};
      
      for (const fileId of fileIds) {
        try {
          const file = await this.fileService.getFileById(fileId, true);
          
          // 检查文件访问权限
          if (!file.isPublic && file.userId !== userId) {
            logger.warn(`用户 ${userId} 尝试访问非公开文件 ${fileId}`);
            continue;
          }
          
          fileMap[fileId] = file.url;
        } catch (error) {
          logger.warn(`获取文件失败 ${fileId}: ${error}`);
          // 继续处理其他文件
        }
      }
      
      // 替换文件引用
      const processedMarkdown = markdownUtil.replaceFileReferences(markdown, fileMap);
      
      // 解析 Markdown
      return markdownUtil.parse(processedMarkdown);
    } catch (error: any) {
      logger.error(`处理 Markdown 文件引用失败: ${error.message}`);
      throw new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, '处理 Markdown 文件引用失败');
    }
  }

  /**
   * 提取 Markdown 中的文件引用
   * @param markdown Markdown 内容
   * @returns 文件ID数组
   */
  private extractFileReferences(markdown: string): string[] {
    try {
      if (!markdown) {
        return [];
      }
      
      // 匹配文件引用格式 ![alt](file:fileId) 或 [text](file:fileId)
      const fileRegex = /(!?\[.*?\])\(file:([a-f0-9-]+)\)/g;
      const fileIds: string[] = [];
      let match;
      
      while ((match = fileRegex.exec(markdown)) !== null) {
        fileIds.push(match[2]);
      }
      
      return [...new Set(fileIds)]; // 去重
    } catch (error: any) {
      logger.error(`提取 Markdown 文件引用失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 提取 Markdown 摘要
   * @param markdown Markdown 内容
   * @param length 最大长度
   * @returns 提取的摘要
   */
  extractSummary(markdown: string, length: number = 200): string {
    return markdownUtil.extractText(markdown, length);
  }

  /**
   * 提取 Markdown 中的第一张图片作为封面
   * @param markdown Markdown 内容
   * @returns 图片 URL 或 null
   */
  extractCoverImage(markdown: string): string | null {
    const images = markdownUtil.extractImages(markdown);
    return images.length > 0 ? images[0] : null;
  }

  /**
   * 验证 Markdown 内容是否有效
   * @param markdown Markdown 内容
   * @returns 是否有效
   */
  validateMarkdown(markdown: string): boolean {
    if (!markdown || markdown.trim().length === 0) {
      return false;
    }
    
    // 检查最小内容长度
    if (markdown.trim().length < 10) {
      return false;
    }
    
    // 检查是否包含基本的 Markdown 结构
    const hasHeading = /^#+ .+/m.test(markdown);
    const hasParagraph = /^[^#>].+/m.test(markdown);
    
    return hasHeading || hasParagraph;
  }
}

// 导出单例实例
export const markdownService = new MarkdownService();
