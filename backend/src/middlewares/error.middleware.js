const logger = require('../utils/logger');
const AppError = require('../utils/AppError');
const { sendError } = require('../utils/apiResponse');

// ── Mongoose / DB error transformers ────────────────────────────────────────

const handleCastErrorDB = (err) =>
  AppError.badRequest(`Invalid ${err.path}: ${err.value}.`, 'INVALID_ID');

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : 'unknown';
  return AppError.conflict(`Duplicate value for '${field}': "${value}". Please use another value.`);
};

const handleValidationErrorDB = (err) => {
  const details = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return AppError.validation('Database validation failed', details);
};

// ── JWT error transformers ───────────────────────────────────────────────────

const handleJWTError = () =>
  AppError.unauthorized('Invalid token. Please log in again.');

const handleJWTExpiredError = () =>
  AppError.unauthorized('Your token has expired. Please log in again.');

// ── Main error handler ───────────────────────────────────────────────────────

/**
 * Global Express error-handling middleware (4-param signature required).
 */
// eslint-disable-next-line no-unused-vars
const errorMiddleware = (err, req, res, next) => {
  let error = err;

  // Clone so we can mutate without side effects
  if (!(error instanceof AppError)) {
    error = Object.assign(new AppError(err.message || 'Internal Server Error', err.statusCode || 500), {
      isOperational: false,
      code: null,
      details: null,
    });
  }

  // Transform known error types into clean AppErrors
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Log
  if (error.statusCode >= 500 || !error.isOperational) {
    logger.error('Unhandled server error', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: error.statusCode,
      message: error.message,
      stack: error.stack,
    });
  } else {
    logger.warn('Operational error', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: error.statusCode,
      message: error.message,
    });
  }

  // Respond
  const isDev = process.env.NODE_ENV === 'development';
  sendError(
    res,
    error.statusCode || 500,
    error.message || 'Internal Server Error',
    error.code || null,
    error.details || null,
    isDev ? error.stack : undefined
  );
};

module.exports = errorMiddleware;
