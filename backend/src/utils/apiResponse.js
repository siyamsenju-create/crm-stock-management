/**
 * Standardized API response helpers.
 * Every response follows the envelope: { success, message, data, [meta] }
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {*} data
 * @param {object} [meta]  - Optional pagination / extra metadata
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}, meta = {}) => {
  const body = { success: true, message, data };
  if (Object.keys(meta).length) body.meta = meta;
  return res.status(statusCode).json(body);
};

/**
 * Send a failure response (used by error middleware).
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string|null} [code]
 * @param {*} [details]
 * @param {string|null} [stack]
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', code = null, details = null, stack = null) => {
  const body = { success: false, message, code };
  if (details) body.details = details;
  if (stack) body.stack = stack;
  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
