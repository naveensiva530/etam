const Joi = require('joi');

const validate = (schema, source) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, convert: true });
  if (error) return next(error);
  req[source] = value;
  next();
};

const statusSchema = Joi.string().valid('Active', 'Inactive');
const subjectTypeSchema = Joi.string().trim().min(1).max(50);
const academicYearSchema = Joi.string()
  .trim()
  .pattern(/^\d{4}-\d{4}$/)
  .custom((value, helpers) => {
    const [startYear, endYear] = value.split('-').map(Number);
    return endYear === startYear + 1 ? value : helpers.error('any.invalid');
  }, 'consecutive academic years');
const createSubjectSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(1).max(50).required(),
  name: Joi.string().trim().min(1).max(150).required(),
  type: subjectTypeSchema.required(),
  status: statusSchema.required(),
  description: Joi.string().trim().max(500).allow('').optional(),
});
const updateSubjectSchema = Joi.object({
  code: Joi.string().trim().uppercase().min(1).max(50).required(),
  name: Joi.string().trim().min(1).max(150).required(),
  type: subjectTypeSchema.required(),
  status: statusSchema.required(),
  description: Joi.string().trim().max(500).allow('').optional(),
}).unknown(false);
const sectionNameSchema = Joi.string().trim().min(1).max(100);
const allocatedSubjectSchema = Joi.object({
  id: Joi.string().max(64).optional(),
  code: Joi.string().trim().uppercase().min(1).max(50).required(),
  name: Joi.string().trim().min(1).max(150).required(),
  type: subjectTypeSchema.required(),
  credits: Joi.number().integer().min(0).max(999).required(),
  faculty: Joi.string().trim().max(150).allow('').optional(),
}).unknown(false);

module.exports = {
  // Query filters
  validateList: validate(
    Joi.object({
      academicYear: Joi.string().trim().optional(),
      status: statusSchema.optional(),
      search: Joi.string().trim().optional(),
    }).unknown(false),
    'query'
  ),

  // Create academic configuration:
  // 1. academic year (M)
  // 2. class/course/dept (M)
  // 3. sub-category
  // 4. status (M)
  validateCreate: validate(
    Joi.object({
      academicYear: academicYearSchema.required(),
      className: Joi.string().trim().min(1).max(150).required(),
      subCategory: Joi.string().trim().max(100).allow('').optional().default('General'),
      status: statusSchema.required(),
      sections: Joi.array()
        .items(Joi.string().trim().max(100))
        .max(100)
        .unique((left, right) => typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase())
        .optional()
        .default([]),
    }).unknown(false),
    'body'
  ),

  validateUpdate: validate(
    Joi.object({
      academicYear: academicYearSchema.optional(),
      className: Joi.string().trim().min(1).max(150).optional(),
      subCategory: Joi.string().trim().max(100).allow('').optional(),
      status: statusSchema.optional(),
      sections: Joi.array()
        .items(Joi.string().trim().max(100))
        .max(100)
        .unique((left, right) => typeof left === 'string' && typeof right === 'string' && left.toLowerCase() === right.toLowerCase())
        .optional(),
    }).unknown(false),
    'body'
  ),

  validateSections: validate(
    Joi.object({
      expectedSections: Joi.array()
        .items(Joi.string().trim().min(1).max(100))
        .max(100)
        .unique((left, right) =>
          typeof left === 'string' &&
          typeof right === 'string' &&
          left.toLowerCase() === right.toLowerCase())
        .required(),
      sections: Joi.array()
        .items(sectionNameSchema)
        .max(100)
        .unique((left, right) =>
          typeof left === 'string' &&
          typeof right === 'string' &&
          left.toLowerCase() === right.toLowerCase())
        .required(),
    })
      .unknown(false),
    'body'
  ),

  validateCreateSection: validate(
    Joi.object({ name: sectionNameSchema.required() }).unknown(false),
    'body'
  ),

  validateCreateSubjectType: validate(
    Joi.object({ name: Joi.string().trim().min(1).max(50).required() }).unknown(false),
    'body'
  ),

  validateUpdateSubjectType: validate(
    Joi.object({ name: Joi.string().trim().min(1).max(50).required() }).unknown(false),
    'body'
  ),

  validateUpdateSection: validate(
    Joi.object({ name: sectionNameSchema.required() }).unknown(false),
    'body'
  ),

  validateId: validate(
    Joi.object({
      id: Joi.string().required(),
    }).unknown(false),
    'params'
  ),

  // Subject Master validation
  validateCreateSubject: validate(createSubjectSchema.unknown(false), 'body'),
  validateUpdateSubject: validate(updateSubjectSchema, 'body'),
  validateCreateSubjects: validate(
    Joi.object({
      subjects: Joi.array()
        .items(createSubjectSchema)
        .min(1)
        .max(500)
        .unique((left, right) => left.code === right.code)
        .required(),
    }).unknown(false),
    'body'
  ),
  validateAllocations: validate(
    Joi.object({
      studentSections: Joi.object()
        .pattern(/^\d{1,20}$/, Joi.string().trim().min(1).max(100))
        .max(10000)
        .required(),
      sectionSubjects: Joi.object()
        .pattern(/^\d{1,20}_.{1,100}$/, Joi.array().items(allocatedSubjectSchema).max(500))
        .max(100)
        .required(),
    }).unknown(false),
    'body'
  ),
};
