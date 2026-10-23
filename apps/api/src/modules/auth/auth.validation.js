const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(255).lowercase().required(),
  password: Joi.string().min(1).max(128).required()
}).unknown(false);

const registerSchema = Joi.object({
  email: Joi.string().trim().email().max(255).lowercase().required(),
  password: Joi.string().min(10).max(128).required()
}).unknown(false);

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, convert: true });
  if (error) return next(error);
  req.body = value;
  next();
};

module.exports = {
  validateLogin: validate(loginSchema),
  validateRegister: validate(registerSchema)
};
