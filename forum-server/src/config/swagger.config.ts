import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

/**
 * Swagger 配置选项
 */
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '论坛系统 API 文档',
      version,
      description: '论坛系统 RESTful API 文档',
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
      contact: {
        name: '开发团队',
        email: 'dev@example.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: '开发服务器',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts', './src/models/*.ts', './src/dtos/*.ts'],
};

/**
 * Swagger 规范
 */
export const swaggerSpec = swaggerJsdoc(options);
