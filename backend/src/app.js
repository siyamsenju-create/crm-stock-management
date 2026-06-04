require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/error.middleware');
const { requestId, httpLogger } = require('./middlewares/requestLogger.middleware');
const setupSwagger = require('./config/swagger');
const AppError = require('./utils/AppError');

// ── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const transactionRoutes = require('./routes/transaction.routes');
const settingsRoutes = require('./routes/settings.routes');
const customerRoutes = require('./routes/customer.routes');
const orderRoutes = require('./routes/order.routes');

// ── App ───────────────────────────────────────────────────────────────────────
const app = express();

// ── Security Headers (Helmet) ─────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Relaxed for API (no HTML served)
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser clients (Postman, mobile) and whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS policy: origin ${origin} is not allowed.`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id', 'X-Cache'],
    credentials: true,
    maxAge: 86400, // 24 h preflight cache
  })
);

// ── Request ID & HTTP Access Logging ─────────────────────────────────────────
app.use(requestId);
app.use(httpLogger);

// ── Body Parsers & Size Limits ────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again in 15 minutes.', code: 'TOO_MANY_REQUESTS' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

// Stricter auth limiter (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts, please try again in 15 minutes.', code: 'TOO_MANY_REQUESTS' },
  skip: (req) => process.env.NODE_ENV === 'test',
});

app.use('/api', apiLimiter);
app.use('/api/v1/auth', authLimiter);

// ── Swagger Docs ──────────────────────────────────────────────────────────────
setupSwagger(app);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    data: {
      env: process.env.NODE_ENV || 'development',
      uptime: `${Math.floor(process.uptime())}s`,
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Base route ────────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CRM Stock Management API is running',
    data: {
      version: 'v1',
      docs: '/api-docs',
      health: '/health',
    },
  });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/orders', orderRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorMiddleware);

// ── Unhandled promise rejections / exceptions (belt-and-suspenders) ──────────
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
  // Don't crash the process in production — let the error be logged
  if (process.env.NODE_ENV === 'production') return;
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

module.exports = app;
