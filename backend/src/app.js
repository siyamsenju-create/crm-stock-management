require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const errorMiddleware = require('./middlewares/error.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const transactionRoutes = require('./routes/transaction.routes');
// const userRoutes = require('./routes/user.routes');
// const workspaceRoutes = require('./routes/workspace.routes');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request Logging
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/transactions', transactionRoutes);
// app.use('/api/v1/users', userRoutes);
// app.use('/api/v1/workspaces', workspaceRoutes);

// Base route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully',
    data: {},
  });
});

// Error Handling Middleware
app.use(errorMiddleware);

module.exports = app;
