const logger = require('../utils/logger');

const errorMiddleware = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}`, { stack: err.stack });

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    data: {},
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

module.exports = errorMiddleware;
