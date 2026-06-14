const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[a-zA-Z0-9_-]{10,36}$/)
  .message('Must be a valid ID');

const transactionSchemas = {
  create: {
    body: Joi.object({
      productId: mongoId.required().messages({
        'any.required': 'Product ID is required',
      }),
      type: Joi.string().valid('IN', 'OUT').required().messages({
        'any.only': 'Transaction type must be either IN or OUT',
        'any.required': 'Transaction type is required',
      }),
      quantity: Joi.number().integer().min(1).required().messages({
        'number.integer': 'Quantity must be a whole number',
        'number.min': 'Quantity must be at least 1',
        'any.required': 'Quantity is required',
      }),
      reference: Joi.string().trim().max(200).allow('', null),
    }),
  },

  list: {
    query: Joi.object({
      product: mongoId,
      type: Joi.string().valid('IN', 'OUT'),
      startDate: Joi.date().iso(),
      endDate: Joi.date().iso().min(Joi.ref('startDate')).messages({
        'date.min': 'End date must be after start date',
      }),
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    }),
  },
};

module.exports = transactionSchemas;
