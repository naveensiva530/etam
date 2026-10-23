const Joi = require('joi');

const institutionSchema = Joi.string().valid('School', 'College', 'Training');

const validate = (schema, source) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, convert: true });
  if (error) return next(error);
  req[source] = value;
  next();
};

module.exports = {
  validateList: validate(Joi.object({
    institution: institutionSchema.required()
  }).unknown(false), 'query'),
  validateCreate: validate(Joi.object({
    institution: institutionSchema.required(),
    name: Joi.string().trim().min(1).max(150).required()
  }).unknown(false), 'body'),
  validateUpdate: validate(Joi.object({
    name: Joi.string().trim().min(1).max(150).required()
  }).unknown(false), 'body'),
  validateId: validate(Joi.object({
    id: Joi.string().pattern(/^[1-9]\d{0,19}$/).required()
  }).unknown(false), 'params')
};
