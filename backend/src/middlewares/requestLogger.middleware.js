const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const morgan = require('morgan');

/**
 * Attaches a unique `req.id` to every incoming request.
 * The ID is also sent back in the `X-Request-Id` response header
 * for distributed tracing / client correlation.
 */
const requestId = (req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-Id', req.id);
  next();
};

/**
 * Structured Morgan HTTP access logger that pipes into Winston.
 * Format: requestId | method url status contentLength - responseTime ms
 */
const httpLogger = morgan(
  (tokens, req, res) => {
    return JSON.stringify({
      requestId: req.id,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number.parseInt(tokens.status(req, res), 10),
      contentLength: tokens.res(req, res, 'content-length') || 0,
      responseTimeMs: parseFloat(tokens['response-time'](req, res)),
      referrer: tokens.referrer(req, res) || '-',
      userAgent: tokens['user-agent'](req, res) || '-',
      ip: tokens['remote-addr'](req, res),
    });
  },
  {
    stream: {
      write: (message) => {
        try {
          const obj = JSON.parse(message.trim());
          const level = obj.status >= 500 ? 'error' : obj.status >= 400 ? 'warn' : 'http';
          logger.log(level, 'HTTP request', obj);
        } catch {
          logger.http(message.trim());
        }
      },
    },
    // Skip health-check pings to avoid log noise in production
    skip: (req) => process.env.NODE_ENV === 'production' && req.url === '/health',
  }
);

module.exports = { requestId, httpLogger };
