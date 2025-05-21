import { Router } from 'express';
import { MarkdownController } from '../controllers/markdown.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateDto } from '../middlewares/validation.middleware';

const router = Router();
const markdownController = new MarkdownController();

// 基本解析端点 - 不需要身份验证
router.post('/parse', markdownController.parseMarkdown);

// 需要身份验证的端点
router.use(authenticate);

// 带文件引用的解析
router.post('/parse-with-files', markdownController.parseMarkdownWithFiles);

// 提取摘要
router.post('/extract-summary', markdownController.extractSummary);

// 提取封面图片
router.post('/extract-cover', markdownController.extractCoverImage);

// 验证 Markdown 内容
router.post('/validate', markdownController.validateMarkdown);

export default router;
