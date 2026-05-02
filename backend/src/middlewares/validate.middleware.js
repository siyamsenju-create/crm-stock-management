const AppError = require('../utils/AppError');

/**
 * Factory that returns an Express middleware validating the
 * request using a provided Joi schema object.
 *
 * @param {object} schema - Joi schema object with optional keys: body, params, query
 * @returns {import('express').RequestHandler}
 *
 * Usage:
 *   router.post('/', validate(productSchemas.create), createProduct);
 */
const validate = (schema) => (req, res, next) => {
  const validationErrors = [];

  const targets = ['body', 'params', 'query'];

  for (const key of targets) {
    if (!schema[key]) continue;

    const { error, value } = schema[key].validate(req[key], {
      abortEarly: false,   // collect ALL errors, not just first
      stripUnknown: true,  // silently strip fields not in schema (security)
      convert: true,       // allow type coercion (string → number for query params)
    });

    if (error) {
      const details = error.details.map((d) => ({
        field: d.path.join('.'),
        message: d.message.replace(/['"]/g, ''),
      }));
      validationErrors.push(...details);
    } else {
      // Replace req[key] with sanitized + coerced value
      req[key] = value;
    }
  }

  if (validationErrors.length > 0) {
    return next(AppError.validation('Request validation failed', validationErrors));
  }

  return next();
};

module.exports = validate;
