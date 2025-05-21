/**
 * 敏感词过滤工具
 * 使用DFA算法实现高效的敏感词过滤
 */

import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../config/logger.config';

// 敏感词节点类型
interface TrieNode {
  isEnd: boolean;
  children: Map<string, TrieNode>;
}

export class SensitiveWordFilter {
  private root: TrieNode;
  private sensitiveWords: string[];
  private readonly defaultReplacement: string = '***';

  constructor() {
    this.root = this.createTrieNode();
    this.sensitiveWords = [];
    this.init();
  }
  
  /**
   * 清空所有敏感词
   */
  public clearWords(): void {
    this.sensitiveWords = [];
    this.root = this.createTrieNode();
    logger.info('敏感词过滤器已清空');
  }

  /**
   * 创建字典树节点
   */
  private createTrieNode(): TrieNode {
    return {
      isEnd: false,
      children: new Map<string, TrieNode>()
    };
  }

  /**
   * 初始化敏感词过滤器
   */
  private init(): void {
    try {
      // 从文件加载敏感词
      const filePath = path.join(process.cwd(), 'config', 'sensitive-words.txt');
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        this.sensitiveWords = content
          .split('\n')
          .map(word => word.trim())
          .filter(word => word.length > 0);
        
        // 构建字典树
        this.buildTrie();
        logger.info(`敏感词过滤器初始化成功，加载了 ${this.sensitiveWords.length} 个敏感词`);
      } else {
        logger.warn('敏感词文件不存在，敏感词过滤功能将不可用');
      }
    } catch (error: any) {
      logger.error(`敏感词过滤器初始化失败: ${error.message}`);
    }
  }

  /**
   * 构建敏感词字典树
   */
  private buildTrie(): void {
    for (const word of this.sensitiveWords) {
      let node = this.root;
      for (const char of word) {
        if (!node.children.has(char)) {
          node.children.set(char, this.createTrieNode());
        }
        node = node.children.get(char)!;
      }
      node.isEnd = true;
    }
  }

  /**
   * 添加敏感词
   * @param word 敏感词
   */
  public addWord(word: string): void {
    if (!word || word.length === 0) return;
    
    word = word.trim();
    if (!this.sensitiveWords.includes(word)) {
      this.sensitiveWords.push(word);
      
      // 更新字典树
      let node = this.root;
      for (const char of word) {
        if (!node.children.has(char)) {
          node.children.set(char, this.createTrieNode());
        }
        node = node.children.get(char)!;
      }
      node.isEnd = true;
      
      // 保存到文件
      this.saveToFile();
    }
  }

  /**
   * 删除敏感词
   * @param word 敏感词
   */
  public removeWord(word: string): void {
    if (!word || word.length === 0) return;
    
    word = word.trim();
    const index = this.sensitiveWords.indexOf(word);
    if (index !== -1) {
      this.sensitiveWords.splice(index, 1);
      
      // 重建字典树
      this.root = this.createTrieNode();
      this.buildTrie();
      
      // 保存到文件
      this.saveToFile();
    }
  }

  /**
   * 保存敏感词到文件
   */
  private saveToFile(): void {
    try {
      const filePath = path.join(process.cwd(), 'config', 'sensitive-words.txt');
      const content = this.sensitiveWords.join('\n');
      
      // 确保目录存在
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf-8');
      logger.info(`敏感词已保存到文件，共 ${this.sensitiveWords.length} 个`);
    } catch (error: any) {
      logger.error(`保存敏感词到文件失败: ${error.message}`);
    }
  }

  /**
   * 检查文本是否包含敏感词
   * @param text 待检查的文本
   * @returns 是否包含敏感词
   */
  public containsSensitiveWords(text: string): boolean {
    if (!text || text.length === 0 || this.sensitiveWords.length === 0) {
      return false;
    }
    
    for (let i = 0; i < text.length; i++) {
      let node = this.root;
      let j = i;
      
      while (j < text.length && node.children.has(text[j])) {
        node = node.children.get(text[j])!;
        j++;
        
        if (node.isEnd) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * 获取文本中的所有敏感词
   * @param text 待检查的文本
   * @returns 敏感词列表
   */
  public findSensitiveWords(text: string): string[] {
    const result: string[] = [];
    
    if (!text || text.length === 0 || this.sensitiveWords.length === 0) {
      return result;
    }
    
    for (let i = 0; i < text.length; i++) {
      let node = this.root;
      let j = i;
      let word = '';
      
      while (j < text.length && node.children.has(text[j])) {
        word += text[j];
        node = node.children.get(text[j])!;
        j++;
        
        if (node.isEnd) {
          result.push(word);
          break;
        }
      }
    }
    
    return result;
  }

  /**
   * 过滤文本中的敏感词
   * @param text 待过滤的文本
   * @param replacement 替换字符串，默认为 '***'
   * @returns 过滤后的文本
   */
  public filter(text: string, replacement?: string): string {
    if (!text || text.length === 0 || this.sensitiveWords.length === 0) {
      return text;
    }
    
    const replaceStr = replacement || this.defaultReplacement;
    
    for (let i = 0; i < text.length; i++) {
      let node = this.root;
      let j = i;
      let matchLength = 0;
      
      while (j < text.length && node.children.has(text[j])) {
        node = node.children.get(text[j])!;
        j++;
        matchLength++;
        
        if (node.isEnd) {
          // 替换敏感词
          const sensitiveWord = text.substring(i, i + matchLength);
          text = text.substring(0, i) + replaceStr + text.substring(i + matchLength);
          i += replaceStr.length - 1; // 调整索引位置
          break;
        }
      }
    }
    
    return text;
  }

  /**
   * 获取所有敏感词
   * @returns 敏感词列表
   */
  public getAllWords(): string[] {
    return [...this.sensitiveWords];
  }
}

// 创建单例实例
export const sensitiveWordFilter = new SensitiveWordFilter();
