const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[a-fA-F0-9]{24}$/)
  .message('Must be a valid MongoDB ObjectId');

const productSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().trim().min(1).max(200).required().messages({
        'string.min': 'Product name cannot be empty',
        'string.max': 'Product name must be at most 200 characters',
        'any.required': 'Product name is required',
      }),
      price: Joi.number().min(0).precision(2).required().messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Price is required',
      }),
      quantity: Joi.number().integer().min(0).required().messages({
        'number.integer': 'Quantity must be a whole number',
        'number.min': 'Quantity cannot be negative',
        'any.required': 'Quantity is required',
      }),
      category: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Category is required',
      }),
      lowStockThreshold: Joi.number().integer().min(0).default(10),
    }),
  },

  update: {
    params: Joi.object({ id: mongoId.required() }),
    body: Joi.object({
      name: Joi.string().trim().min(1).max(200),
      price: Joi.number().min(0).precision(2),
      category: Joi.string().trim().min(1).max(100),
      lowStockThreshold: Joi.number().integer().min(0),
      // 'quantity' intentionally excluded — only modified via transactions
    }).min(1).message('At least one field must be provided for update'),
  },

  getById: {
    params: Joi.object({ id: mongoId.required() }),
  },

  deleteById: {
    params: Joi.object({ id: mongoId.required() }),
  },

  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().max(100),
      search: Joi.string().trim().max(100),
      category: Joi.string().trim().max(100),
      // Price range operators
      'price[gt]': Joi.number().min(0),
      'price[gte]': Joi.number().min(0),
      'price[lt]': Joi.number().min(0),
      'price[lte]': Joi.number().min(0),
      // Quantity range operators
      'quantity[gt]': Joi.number().integer().min(0),
      'quantity[gte]': Joi.number().integer().min(0),
      'quantity[lt]': Joi.number().integer().min(0),
      'quantity[lte]': Joi.number().integer().min(0),
    }),
  },
};

module.exports = productSchemas;
