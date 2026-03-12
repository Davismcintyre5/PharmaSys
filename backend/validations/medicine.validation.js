const Joi = require('joi');

exports.medicineValidation = Joi.object({
  name: Joi.string().required(),
  price: Joi.number().positive().required(),
  // ... other fields
});