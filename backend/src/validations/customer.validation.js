const Joi = require('joi');

const mongoId = Joi.string()
  .pattern(/^[a-fA-F0-9]{24}$/)
  .message('Must be a valid MongoDB ObjectId');

const customerSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().trim().min(1).max(200).required(),
      email: Joi.string().email().required(),
      phone: Joi.string().trim().allow(''),
      location: Joi.string().trim().allow(''),
      status: Joi.string().valid('Active', 'Inactive'),
    }),
  },
  update: {
    params: Joi.object({ id: mongoId.required() }),
    body: Joi.object({
      name: Joi.string().trim().min(1).max(200),
      email: Joi.string().email(),
      phone: Joi.string().trim().allow(''),
      location: Joi.string().trim().allow(''),
      status: Joi.string().valid('Active', 'Inactive'),
    }).min(1),
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
      status: Joi.string().valid('Active', 'Inactive'),
    }),
  },
};

module.exports = customerSchemas;
