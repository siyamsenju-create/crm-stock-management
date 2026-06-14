const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[a-zA-Z0-9_-]{10,36}$/)
  .message('Must be a valid ID');

const orderSchemas = {
  create: {
    body: Joi.object({
      customer: mongoId.required(),
      items: Joi.array().items(
        Joi.object({
          product: mongoId.required(),
          quantity: Joi.number().integer().min(1).required(),
        })
      ).min(1).required(),
      status: Joi.string().valid('Pending', 'Completed', 'Cancelled').default('Pending'),
    }),
  },
  updateStatus: {
    params: Joi.object({ id: mongoId.required() }),
    body: Joi.object({
      status: Joi.string().valid('Pending', 'Completed', 'Cancelled').required(),
    }),
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
      customer: mongoId,
      status: Joi.string().valid('Pending', 'Completed', 'Cancelled'),
    }),
  },
};

module.exports = orderSchemas;
