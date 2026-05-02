/**
 * Custom operational error class.
 * Distinguishes between expected operational errors (e.g. 404, 400)
 * and unexpected programming errors so the error middleware can
 * respond appropriately.
 */
class AppError extends Error {
  /**
   * @param {string} message  - Human-readable error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code]    - Optional machine-readable error code
   * @param {object} [details] - Optional validation details or extra data
   */
  constructor(message, statusCode, code, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code || null;
    this.details = details || null;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Factory helpers ──────────────────────────────────────────────────────

  /** 400 Bad Request */
  static badRequest(message, code, details) {
    return new AppError(message || 'Bad Request', 400, code || 'BAD_REQUEST', details);
  }

  /** 401 Unauthorized */
  static unauthorized(message) {
    return new AppError(message || 'Not authorized to access this route', 401, 'UNAUTHORIZED');
  }

  /** 403 Forbidden */
  static forbidden(message) {
    return new AppError(message || 'You do not have permission to perform this action', 403, 'FORBIDDEN');
  }

  /** 404 Not Found */
  static notFound(resource) {
    return new AppError(`${resource || 'Resource'} not found`, 404, 'NOT_FOUND');
  }

  /** 409 Conflict */
  static conflict(message) {
    return new AppError(message || 'Resource already exists', 409, 'CONFLICT');
  }

  /** 422 Unprocessable Entity (validation) */
  static validation(message, details) {
    return new AppError(message || 'Validation failed', 422, 'VALIDATION_ERROR', details);
  }

  /** 429 Too Many Requests */
  static tooMany(message) {
    return new AppError(message || 'Too many requests, please try again later', 429, 'TOO_MANY_REQUESTS');
  }

  /** 500 Internal Server Error */
  static internal(message) {
    return new AppError(message || 'Internal Server Error', 500, 'INTERNAL_ERROR');
  }
}

module.exports = AppError;
