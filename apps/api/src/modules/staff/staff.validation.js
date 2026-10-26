const Joi = require('joi');

const namePattern = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u;
const mobilePattern = /^[6-9]\d{9}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const validDate = (value, helpers) => {
  if (!datePattern.test(value) || new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) !== value) {
    return helpers.error('any.invalid');
  }
  return value;
};

const dateField = Joi.string().custom(validDate).messages({
  'any.invalid': 'Date must be a valid YYYY-MM-DD value.'
});

const uniqueStringList = Joi.array().items(Joi.string().trim().min(1).max(100)).max(100).unique(
  (left, right) => left.toLowerCase() === right.toLowerCase(),
);
const teachingScopeSchema = Joi.alternatives().conditional('institution', [
  {
    is: 'School',
    then: Joi.object({
      institution: Joi.string().valid('School').required(),
      teachingWing: Joi.string().trim().max(100).allow('').optional(),
      eligibleClasses: uniqueStringList.required(),
      skillTags: uniqueStringList.required(),
      classTeacherEligible: Joi.boolean().required(),
    }).unknown(false),
  },
  {
    is: 'College',
    then: Joi.object({
      institution: Joi.string().valid('College').required(),
      department: Joi.string().trim().max(150).allow('').optional(),
      teachingYears: uniqueStringList.required(),
      specializations: uniqueStringList.required(),
    }).unknown(false),
  },
  {
    is: 'Training',
    then: Joi.object({
      institution: Joi.string().valid('Training').required(),
      track: Joi.string().trim().max(150).allow('').optional(),
      activeBatches: uniqueStringList.required(),
      modules: uniqueStringList.required(),
    }).unknown(false),
  },
]);

const staffSchema = Joi.object({
  staffId: Joi.string().trim().min(1).max(64).required(),
  name: Joi.string().trim().min(2).max(100).pattern(namePattern).required(),
  role: Joi.string().trim().min(2).max(100).required(),
  institution: Joi.string().valid('School', 'College', 'Training').required(),
  staffType: Joi.string().valid('Teaching', 'Non-Teaching', 'Other').required(),
  department: Joi.string().trim().min(1).max(150).allow('', null).optional(),
  teachingScope: teachingScopeSchema.optional(),
  qualification: Joi.string().trim().min(1).max(150).required(),
  photoUrl: Joi.string().max(3_000_000).allow('', null).optional(),
  email: Joi.string().email().trim().max(150).required(),
  mobile: Joi.string().pattern(mobilePattern).required().messages({
    'string.pattern.base': 'Mobile number must be a valid 10-digit Indian mobile number.'
  }),
  dateOfJoining: dateField.required(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow('', null).optional(),
  status: Joi.string().valid('Active', 'Probation', 'Archived').default('Active')
}).custom((staff, helpers) => {
  if (staff.dateOfJoining > new Date().toISOString().slice(0, 10)) {
    return helpers.error('staff.futureJoiningDate');
  }
  return staff;
}).messages({
  'staff.futureJoiningDate': 'Date of joining cannot be in the future.'
}).unknown(false);

const validate = (schema, source) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, convert: true });
  if (error) return next(error);
  req[source] = value;
  next();
};

module.exports = {
  validateRoleList: validate(Joi.object({
    institution: Joi.string().valid('School', 'College', 'Training').required(),
  }).unknown(false), 'query'),
  validateRoleSave: validate(Joi.object({
    institution: Joi.string().valid('School', 'College', 'Training').required(),
    roles: Joi.array().items(Joi.string().trim().min(1).max(100)).max(100).unique(
      (left, right) => left.toLowerCase() === right.toLowerCase(),
    ).required(),
  }).unknown(false), 'body'),
  validateSkillList: validate(Joi.object({
    institution: Joi.string().valid('School', 'College', 'Training').required(),
  }).unknown(false), 'query'),
  validateSkillSave: validate(Joi.object({
    institution: Joi.string().valid('School', 'College', 'Training').required(),
    skills: uniqueStringList.required(),
  }).unknown(false), 'body'),
  validateCreate: validate(staffSchema, 'body'),
  validateBulk: validate(Joi.object({
    staffList: Joi.array().items(staffSchema).min(1).max(500).required()
  }).unknown(false), 'body'),
  validateList: validate(Joi.object({
    institution: Joi.string().valid('School', 'College', 'Training').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(50),
    search: Joi.string().trim().max(100).allow('').optional(),
  }).unknown(false), 'query'),
  validateId: validate(Joi.object({
    id: Joi.string().pattern(/^[1-9]\d{0,19}$/).required()
  }).unknown(false), 'params')
};
