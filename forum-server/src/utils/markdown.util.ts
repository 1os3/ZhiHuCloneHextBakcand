import { marked } from 'marked';
import { Tokens } from 'marked';
import hljs from 'highlight.js';
import sanitizeHtml from 'sanitize-html';
import { logger } from '../config/logger.config';

/**
 * Markdown 工具类，用于处理 Markdown 内容的解析、渲染和安全过滤
 */
export class MarkdownUtil {
  private static instance: MarkdownUtil;

  private constructor() {
    this.initializeMarked();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MarkdownUtil {
    if (!MarkdownUtil.instance) {
      MarkdownUtil.instance = new MarkdownUtil();
    }
    return MarkdownUtil.instance;
  }

  /**
   * 初始化 Marked 配置
   */
  private initializeMarked(): void {
    // 配置 Marked
    marked.use({
      // 使用代码高亮
      renderer: {
        code(this: any, codeObj: Tokens.Code): string {
          const { text: code, lang: language } = codeObj;
          try {
            if (language && hljs.getLanguage(language)) {
              const highlighted = hljs.highlight(code, { language }).value;
              return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
            }
            const highlighted = hljs.highlightAuto(code).value;
            return `<pre><code class="hljs">${highlighted}</code></pre>`;
          } catch (error) {
            logger.error(`代码高亮失败: ${error}`);
            return `<pre><code>${code}</code></pre>`;
          }
        }
      },
      gfm: true, // GitHub Flavored Markdown
      breaks: true, // 转换换行符为 <br>
      pedantic: false,
      silent: false,
    });
  }

  /**
   * 解析 Markdown 为 HTML
   * @param markdown Markdown 内容
   * @returns 解析后的 HTML
   */
  public parse(markdown: string): string {
    try {
      if (!markdown) {
        return '';
      }

      // 解析 Markdown 为 HTML
      const html = marked.parse(markdown) as string;
      
      // 安全过滤 HTML
      return this.sanitize(html);
    } catch (error) {
      logger.error(`Markdown 解析失败: ${error}`);
      return `<p>内容解析失败</p>`;
    }
  }

  /**
   * 安全过滤 HTML，防止 XSS 攻击
   * @param html HTML 内容
   * @returns 过滤后的安全 HTML
   */
  private sanitize(html: string): string {
    try {
      return sanitizeHtml(html, {
        allowedTags: [
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
          'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
          'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span',
          'del', 'ins', 'sup', 'sub', 'details', 'summary',
        ],
        allowedAttributes: {
          a: ['href', 'name', 'target', 'rel', 'title'],
          img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
          div: ['class', 'id', 'style'],
          span: ['class', 'id', 'style'],
          code: ['class'],
          pre: ['class'],
          table: ['class', 'style'],
          th: ['style', 'scope'],
          td: ['style'],
          h1: ['id'],
          h2: ['id'],
          h3: ['id'],
          h4: ['id'],
          h5: ['id'],
          h6: ['id'],
          details: ['open'],
          '*': ['class', 'id'],
        },
        // 允许的 URL 协议
        allowedSchemes: ['http', 'https', 'mailto', 'tel'],
        allowedSchemesByTag: {
          img: ['http', 'https', 'data'],
        },
        // 允许的 CSS 属性
        allowedStyles: {
          '*': {
            'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
            'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
            'font-size': [/^\d+(?:px|em|rem|%)$/],
          },
          table: {
            'width': [/^(auto|\d+(?:px|em|rem|%)?)$/],
            'border': [/^\d+(?:px)?\s+\w+\s+\w+$/],
            'border-collapse': [/^collapse$/],
            'border-spacing': [/^\d+(?:px)?\s+\d+(?:px)?$/],
          },
          td: {
            'width': [/^(auto|\d+(?:px|em|rem|%)?)$/],
            'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
            'vertical-align': [/^top$/, /^middle$/, /^bottom$/],
            'padding': [/^\d+(?:px|em|rem|%)$/],
          },
          th: {
            'width': [/^(auto|\d+(?:px|em|rem|%)?)$/],
            'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
            'vertical-align': [/^top$/, /^middle$/, /^bottom$/],
            'padding': [/^\d+(?:px|em|rem|%)$/],
          },
        },
        // 转换相对 URL 为绝对 URL
        transformTags: {
          'a': (tagName, attribs) => {
            if (attribs.href && !attribs.href.startsWith('http') && !attribs.href.startsWith('mailto:') && !attribs.href.startsWith('tel:') && !attribs.href.startsWith('#')) {
              attribs.href = `//${attribs.href}`;
            }
            
            // 为外部链接添加 nofollow 和 target="_blank"
            if (attribs.href && (attribs.href.startsWith('http') || attribs.href.startsWith('//'))) {
              attribs.rel = 'nofollow noopener noreferrer';
              attribs.target = '_blank';
            }
            
            return {
              tagName,
              attribs,
            };
          },
          // 为图片添加 loading="lazy"
          'img': (tagName, attribs) => {
            attribs.loading = 'lazy';
            return {
              tagName,
              attribs,
            };
          },
        },
      });
    } catch (error) {
      logger.error(`HTML 安全过滤失败: ${error}`);
      return '<p>内容安全过滤失败</p>';
    }
  }

  /**
   * 提取 Markdown 中的纯文本（用于摘要等）
   * @param markdown Markdown 内容
   * @param length 最大长度
   * @returns 提取的纯文本
   */
  public extractText(markdown: string, length: number = 200): string {
    try {
      if (!markdown) {
        return '';
      }

      // 解析 Markdown 为 HTML
      const html = marked.parse(markdown) as string;
      
      // 移除所有 HTML 标签
      const text = html.replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // 截取指定长度
      return text.length > length ? `${text.substring(0, length)}...` : text;
    } catch (error) {
      logger.error(`提取 Markdown 文本失败: ${error}`);
      return '';
    }
  }

  /**
   * 提取 Markdown 中的图片 URL
   * @param markdown Markdown 内容
   * @returns 图片 URL 数组
   */
  public extractImages(markdown: string): string[] {
    try {
      if (!markdown) {
        return [];
      }

      // 解析 Markdown 为 HTML
      const html = marked.parse(markdown) as string;
      
      // 提取所有图片 URL
      const imgRegex = /<img[^>]+src="([^"]+)"/g;
      const images: string[] = [];
      let match;
      
      while ((match = imgRegex.exec(html)) !== null) {
        images.push(match[1]);
      }
      
      return images;
    } catch (error) {
      logger.error(`提取 Markdown 图片失败: ${error}`);
      return [];
    }
  }

  /**
   * 替换 Markdown 中的文件引用为实际 URL
   * @param markdown Markdown 内容
   * @param fileMap 文件映射 {fileId: fileUrl}
   * @returns 替换后的 Markdown
   */
  public replaceFileReferences(markdown: string, fileMap: Record<string, string>): string {
    try {
      if (!markdown || !fileMap || Object.keys(fileMap).length === 0) {
        return markdown;
      }

      // 替换文件引用格式 ![alt](file:fileId) 或 [text](file:fileId)
      return markdown.replace(/(!?\[.*?\])\(file:([a-f0-9-]+)\)/g, (match, linkText, fileId) => {
        const fileUrl = fileMap[fileId];
        if (fileUrl) {
          return `${linkText}(${fileUrl})`;
        }
        return match;
      });
    } catch (error) {
      logger.error(`替换 Markdown 文件引用失败: ${error}`);
      return markdown;
    }
  }
}

// 导出单例实例
export const markdownUtil = MarkdownUtil.getInstance();
