const timetableRepository = require('./timetable.repository');

exports.getDepartmentsWithStatus = async (userId, institution) => {
  return timetableRepository.getDepartmentsWithStatus(userId, institution);
};

exports.getOptions = async (userId, institution, academicConfigId, sectionName) => {
  return timetableRepository.getOptions(userId, institution, academicConfigId, sectionName);
};

exports.getTimetableById = async (userId, id) => {
  const timetable = await timetableRepository.getTimetableById(userId, id);
  if (!timetable) {
    const error = new Error('Timetable configuration not found');
    error.statusCode = 404;
    throw error;
  }
  return timetable;
};

exports.getTimetableByAcademicConfigId = async (userId, academicConfigId) => {
  return timetableRepository.getTimetableByAcademicConfigId(userId, academicConfigId);
};

exports.saveTimetable = async (userId, institution, payload) => {
  if (!payload.academicConfigurationId) {
    const error = new Error('academicConfigurationId is required');
    error.statusCode = 400;
    throw error;
  }
  if (!payload.departmentName) {
    const error = new Error('departmentName is required');
    error.statusCode = 400;
    throw error;
  }
  if (!payload.subCategory) {
    const error = new Error('subCategory (Section) is required');
    error.statusCode = 400;
    throw error;
  }

  const timetableId = await timetableRepository.saveTimetable(userId, institution, payload);
  return timetableRepository.getTimetableById(userId, timetableId);
};

exports.deleteTimetable = async (userId, id) => {
  const deleted = await timetableRepository.deleteTimetable(userId, id);
  if (!deleted) {
    const error = new Error('Timetable configuration not found');
    error.statusCode = 404;
    throw error;
  }
  return true;
};
