const Joi = require('joi');

const namePattern = /^[\p{L}\p{M}]+(?:[ .'-][\p{L}\p{M}]+)*$/u;
const mobilePattern = /^[6-9]\d{9}$/;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const validDate = (value, helpers) => {
  const parsedDate = datePattern.test(value) ? new Date(`${value}T00:00:00.000Z`) : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value) {
    return helpers.error('any.invalid');
  }
  return value;
};

const dateField = Joi.string().custom(validDate).messages({
  'any.invalid': 'Date must be a valid YYYY-MM-DD value.'
});

const studentSchema = Joi.object({
  admissionId: Joi.string().trim().min(1).max(64).required(),
  studentId: Joi.string().trim().min(1).max(64).required(),
  studentName: Joi.string().trim().min(2).max(100).pattern(namePattern).required(),
  institution: Joi.string().valid('School', 'College', 'Training').required(),
  department: Joi.string().trim().min(1).max(150).required(),
  academicYear: Joi.string()
    .trim()
    .pattern(/^\d{4}-\d{4}$/)
    .custom((value, helpers) => {
      const [startYear, endYear] = value.split('-').map(Number);
      return endYear === startYear + 1 ? value : helpers.error('any.invalid');
    }, 'consecutive academic years')
    .required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  photoUrl: Joi.string().max(3_000_000).allow('', null).optional(),
  dateOfJoining: dateField.required(),
  parentName: Joi.string().trim().min(2).max(100).pattern(namePattern).allow('', null).optional(),
  parentMobile: Joi.string().pattern(mobilePattern).allow('', null).optional(),
  studentMobile: Joi.string().pattern(mobilePattern).allow('', null).optional(),
  dob: dateField.allow('', null).optional(),
  category: Joi.string().trim().max(100).allow('', null).optional(),
  subcategory: Joi.string().trim().max(100).allow('', null).optional(),
  additionalDepartment: Joi.string().trim().max(150).allow('', null).optional(),
  residenceType: Joi.string().valid('Day Scholar', 'Hosteller').required(),
  communicationAddress: Joi.string().trim().max(2000).allow('', null).optional(),
  pinZip: Joi.string().trim().max(20).allow('', null).optional(),
  bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').allow('', null).optional(),
  status: Joi.string().valid('Active', 'Pending', 'Inactive').required()
}).custom((student, helpers) => {
  if (student.dateOfJoining > new Date().toISOString().slice(0, 10)) {
    return helpers.error('student.futureJoiningDate');
  }

  if (student.dob && student.dob >= new Date().toISOString().slice(0, 10)) {
    return helpers.error('student.invalidDateOfBirth');
  }

  if (student.institution === 'School' && (!student.parentName || !student.parentMobile || !student.dob || !student.bloodGroup)) {
    return helpers.error('student.schoolFieldsRequired');
  }

  if (student.institution === 'Training' && !student.dob) {
    return helpers.error('student.trainingDobRequired');
  }

  if ((student.institution === 'College' || student.institution === 'Training') && !student.studentMobile) {
    return helpers.error('student.studentMobileRequired');
  }

  if (student.institution === 'Training' && student.dob) {
    const today = new Date();
    const birthDate = new Date(`${student.dob}T00:00:00.000Z`);
    let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
    const beforeBirthday = today.getUTCMonth() < birthDate.getUTCMonth()
      || (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() < birthDate.getUTCDate());
    if (beforeBirthday) age -= 1;
    if (age < 18 && (!student.parentName || !student.parentMobile)) {
      return helpers.error('student.trainingParentRequired');
    }
  }

  return student;
}).messages({
  'student.futureJoiningDate': 'Date of joining cannot be in the future.',
  'student.invalidDateOfBirth': 'Date of birth must be in the past.',
  'student.schoolFieldsRequired': 'School students require parent name, parent mobile, date of birth, and blood group.',
  'student.trainingDobRequired': 'Date of birth is required for Training students.',
  'student.studentMobileRequired': 'Student mobile is required for College and Training editions.',
  'student.trainingParentRequired': 'Parent name and mobile are required for Training students under 18.'
}).unknown(false);

const validate = (schema, source) => (req, res, next) => {
  const { error, value } = schema.validate(req[source], { abortEarly: false, convert: true });
  if (error) return next(error);
  req[source] = value;
  next();
};

module.exports = {
  validateCreate: validate(studentSchema, 'body'),
  validateBulk: validate(Joi.object({
    students: Joi.array()
      .items(studentSchema)
      .min(1)
      .max(500)
      .unique('admissionId')
      .unique('studentId')
      .custom((students, helpers) => {
        const institution = students[0]?.institution;
        if (students.some((student) => student.institution !== institution)) {
          return helpers.error('array.institution');
        }
        return students;
      })
      .messages({
        'array.institution': 'All students in a bulk upload must belong to the same institution.',
      })
      .required()
  }).unknown(false), 'body'),
  validateList: validate(Joi.object({
    institution: Joi.string().valid('School', 'College', 'Training').optional(),
    page:        Joi.number().integer().min(1).default(1),
    limit:       Joi.number().integer().min(1).max(200).default(50),
    search:      Joi.string().trim().max(100).allow('').optional(),
  }).unknown(false), 'query'),
  validateId: validate(Joi.object({
    id: Joi.string().pattern(/^[1-9]\d{0,19}$/).required()
  }).unknown(false), 'params')
};