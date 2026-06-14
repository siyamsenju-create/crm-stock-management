const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM Stock Management API',
      version: '1.0.0',
      description:
        'Production-ready REST API for the JJ Painting & Hardwares CRM & Inventory Management System.\n\n' +
        '**Authentication:** Use `/auth/login` to obtain a Bearer token, then click "Authorize" below.',
      contact: {
        name: 'API Support',
        email: 'support@jjpainting.com',
      },
      license: {
        name: 'ISC',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'v1 API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your access token obtained from /auth/login',
        },
      },
      schemas: {
        ApiResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' },
            meta: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            code: { type: 'string' },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        ProductInput: {
          type: 'object',
          required: ['name', 'price', 'quantity', 'category'],
          properties: {
            name: { type: 'string', example: 'Asian Paints 20L' },
            price: { type: 'number', example: 1250.0 },
            quantity: { type: 'integer', example: 50 },
            category: { type: 'string', example: 'Paints' },
            lowStockThreshold: { type: 'integer', example: 10 },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            pages: { type: 'integer' },
            next: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
              },
            },
            prev: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'], // scan all route files for @swagger JSDoc
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * Register Swagger UI at /api-docs — disabled in production.
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  // M-01 (Security Audit): Never expose API documentation in production.
  // Full endpoint schemas, auth mechanisms, and request examples would be
  // handed directly to attackers. Swagger is development/staging only.
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customSiteTitle: 'CRM Stock API Docs',
      customCss: `
        .swagger-ui .topbar { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
        .swagger-ui .info .title { color: #7c3aed; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
      },
    })
  );

  // Serve raw JSON spec (development / staging only)
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

module.exports = setupSwagger;
