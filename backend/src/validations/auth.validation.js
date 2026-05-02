const Joi = require('joi');

const authSchemas = {
  register: {
    body: Joi.object({
      name: Joi.string().trim().min(2).max(80).required().messages({
        'string.min': 'Name must be at least 2 characters',
        'string.max': 'Name must be at most 80 characters',
        'any.required': 'Name is required',
      }),
      email: Joi.string().trim().email().lowercase().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().min(6).max(72).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
      }),
      role: Joi.string().valid('Admin', 'Manager', 'User').default('User'),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().trim().email().lowercase().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().required().messages({
        'any.required': 'Password is required',
      }),
    }),
  },

  refresh: {
    body: Joi.object({
      token: Joi.string().required().messages({
        'any.required': 'Refresh token is required',
      }),
    }),
  },
};

module.exports = authSchemas;
