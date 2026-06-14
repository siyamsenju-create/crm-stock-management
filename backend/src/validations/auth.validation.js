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
      password: Joi.string().min(8).max(72).required().messages({
        'string.min': 'Password must be at least 8 characters',
        'any.required': 'Password is required',
      }),
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

  updateProfile: {
    body: Joi.object({
      name: Joi.string().trim().min(2).max(80).optional(),
      email: Joi.string().trim().email().lowercase().optional(),
      company: Joi.string().trim().allow('', null).optional(),
      // NOTE: 'role' is intentionally excluded — role changes must go through a
      // dedicated admin endpoint. Allowing self-promotion here is a privilege
      // escalation vulnerability (H-01 in security audit).
      language: Joi.string().trim().optional(),
      timezone: Joi.string().trim().optional(),
      // Require current password when setting a new one (H-01)
      currentPassword: Joi.string().min(1).optional(),
      password: Joi.string().min(8).max(72).optional(),
      notifications: Joi.object({
        email: Joi.boolean().optional(),
        push: Joi.boolean().optional(),
        sms: Joi.boolean().optional()
      }).optional()
    })
    .min(1) // Require at least one field to be updated
    .and('password', 'currentPassword'), // Both required together if either is present
  },

  googleLogin: {
    body: Joi.object({
      idToken: Joi.string().required().messages({
        'any.required': 'Firebase ID token is required',
        'string.empty': 'Firebase ID token cannot be empty',
      }),
    }),
  },
};

module.exports = authSchemas;

