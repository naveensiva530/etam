const logger = require('../config/logger');

module.exports = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = error.statusCode || error.status || 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred.';

  if (error.isJoi) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed.';
  } else if (error.code === 'ER_DUP_ENTRY') {
    status = 409;
    code = 'RESOURCE_ALREADY_EXISTS';
    // Map specific MySQL unique constraint names to readable messages
    if (error.message.includes('uq_students_owner_institution_admission')) {
      message = 'Admission ID already exists for this institution.';
    } else if (error.message.includes('uq_students_owner_institution_student_id')) {
      message = 'Student ID (Roll Number) already exists for this institution.';
    } else if (error.message.includes('uq_staff_owner_institution_staff_id')) {
      message = 'Staff ID already exists for this institution.';
    } else if (error.message.includes('uq_departments_owner_institution_name')) {
      message = 'A department with this name already exists.';
    } else if (error.message.includes('uq_academic_config_year_class')) {
      message = 'This class/course is already configured for the selected academic year.';
    } else if (error.message.includes('uq_subject_code_owner')) {
      message = 'A subject with this code already exists.';
    } else if (error.message.includes('uq_academic_sections_owner_name')) {
      message = 'A section with this name already exists for this account.';
    } else {
      message = 'A record with these details already exists.';
    }
  } else if (error.code === 'ER_ROW_IS_REFERENCED_2' && error.message.includes('fk_students_academic_configuration')) {
    status = 409;
    code = 'ACADEMIC_CONFIGURATION_IN_USE';
    message = 'This academic configuration is assigned to students and cannot be deleted.';
  } else if (status < 500) {
    code = error.code || 'REQUEST_ERROR';
    message = error.message || 'The request could not be completed.';
  }

  if (status >= 500) logger.error(error);

  const response = { error: code, message };
  if (error.isJoi) {
    response.details = error.details.map(({ message: detail, path }) => ({
      field: path.join('.'),
      message: detail
    }));
  }

  res.status(status).json(response);
};