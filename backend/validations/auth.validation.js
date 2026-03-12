// Example using Joi
const Joi = require('joi');

exports.registerValidation = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'pharmacist', 'cashier', 'manager'),
});

exports.loginValidation = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});