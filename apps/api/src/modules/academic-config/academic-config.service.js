const repository = require('./academic-config.repository');

exports.listConfigs = async (userId, filters) => {
  return repository.getAllConfigs(userId, filters);
};

exports.listSections = (userId) => repository.getAllSections(userId);

exports.listSubjectTypes = (userId) => repository.getAllSubjectTypes(userId);

exports.createSubjectType = (userId, name) => repository.createSubjectType(userId, name);

exports.updateSubjectType = async (userId, id, name) => {
  const subjectType = await repository.updateSubjectType(userId, id, name);
  if (!subjectType) {
    const error = new Error('Subject type not found.');
    error.statusCode = 404;
    throw error;
  }
  return subjectType;
};

exports.deleteSubjectType = async (userId, id) => {
  const deleted = await repository.deleteSubjectType(userId, id);
  if (!deleted) {
    const error = new Error('Subject type not found.');
    error.statusCode = 404;
    throw error;
  }
};

const ensureSubjectTypeExists = async (userId, name) => {
  if (!await repository.hasSubjectType(userId, name)) {
    const error = new Error(`Subject type "${name}" is not available for this account.`);
    error.statusCode = 400;
    throw error;
  }
};

exports.createSection = (userId, name) => repository.createSection(userId, name);

exports.updateSection = async (userId, id, name) => {
  const section = await repository.updateSection(userId, id, name);
  if (!section) {
    const error = new Error('Section not found.');
    error.statusCode = 404;
    throw error;
  }
  return section;
};

exports.deleteSection = async (userId, id) => {
  const deleted = await repository.deleteSection(userId, id);
  if (!deleted) {
    const error = new Error('Section not found.');
    error.statusCode = 404;
    throw error;
  }
};

exports.getConfig = async (userId, id) => {
  const config = await repository.getConfigById(userId, id);
  if (!config) {
    const error = new Error('Academic configuration not found');
    error.status = 404;
    throw error;
  }
  return config;
};

exports.createConfig = async (userId, data) => {
  return repository.createConfig(userId, data);
};

exports.updateConfig = async (userId, id, data) => {
  const current = await repository.getConfigById(userId, id);
  if (!current) {
    const error = new Error('Academic configuration not found or could not be updated');
    error.status = 404;
    throw error;
  }
  const academicDetailsChanged = ['academicYear', 'className', 'subCategory']
    .some((field) => data[field] !== undefined && data[field] !== current[field]);
  if (academicDetailsChanged && await repository.hasStudents(userId, id)) {
    const error = new Error('Year, class/course, and sub-category cannot change while students are assigned.');
    error.status = 409;
    throw error;
  }

  const updated = await repository.updateConfig(userId, id, data);
  if (!updated) {
    const error = new Error('Academic configuration not found or could not be updated');
    error.status = 404;
    throw error;
  }
  return updated;
};

exports.updateConfigSections = async (userId, id, expectedSections, sections) => {
  const updated = await repository.updateConfigSections(
    userId,
    id,
    expectedSections,
    sections,
  );
  if (!updated) {
    const error = new Error('Academic configuration not found.');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

exports.deleteConfig = async (userId, id) => {
  const deleted = await repository.deleteConfig(userId, id);
  if (!deleted) {
    const error = new Error('Academic configuration not found or already deleted');
    error.status = 404;
    throw error;
  }
  return true;
};

// Subject Master service methods
exports.listSubjects = async (userId) => {
  return repository.getAllSubjects(userId);
};

exports.createSubject = async (userId, data) => {
  await ensureSubjectTypeExists(userId, data.type);
  return repository.createSubject(userId, data);
};

exports.updateSubject = async (userId, id, data) => {
  await ensureSubjectTypeExists(userId, data.type);
  const subject = await repository.updateSubject(userId, id, data);
  if (!subject) {
    const error = new Error('Subject not found.');
    error.statusCode = 404;
    throw error;
  }
  return subject;
};

exports.createSubjects = async (userId, subjects) => {
  const types = [...new Set(subjects.map((subject) => subject.type))];
  for (const type of types) {
    await ensureSubjectTypeExists(userId, type);
  }
  return repository.createSubjects(userId, subjects);
};

exports.deleteSubject = async (userId, id) => {
  const deleted = await repository.deleteSubject(userId, id);
  if (!deleted) {
    const error = new Error('Subject not found or already deleted');
    error.status = 404;
    throw error;
  }
  return true;
};

exports.getConfigAllocations = async (userId, configId) => {
  const config = await repository.getConfigById(userId, configId);
  if (!config) {
    const error = new Error('Academic configuration not found');
    error.status = 404;
    throw error;
  }
  return repository.getConfigAllocations(userId, configId);
};

exports.replaceConfigAllocations = async (userId, configId, allocations) => {
  const config = await repository.getConfigById(userId, configId);
  if (!config) {
    const error = new Error('Academic configuration not found');
    error.status = 404;
    throw error;
  }

  const validSections = new Set(config.sections);
  for (const sectionName of Object.values(allocations.studentSections)) {
    if (!validSections.has(sectionName)) {
      const error = new Error(`Section "${sectionName}" is not part of this academic configuration.`);
      error.status = 400;
      throw error;
    }
  }

  const prefix = `${configId}_`;
  const allocatedSubjectCount = Object.values(allocations.sectionSubjects)
    .reduce((total, subjects) => total + subjects.length, 0);
  if (allocatedSubjectCount > 2000) {
    const error = new Error('A maximum of 2,000 subject allocations can be saved at once.');
    error.status = 400;
    throw error;
  }
  for (const sectionKey of Object.keys(allocations.sectionSubjects)) {
    const sectionName = sectionKey.startsWith(prefix) ? sectionKey.slice(prefix.length) : '';
    if (!validSections.has(sectionName)) {
      const error = new Error('Subject allocations must target a section in this academic configuration.');
      error.status = 400;
      throw error;
    }
  }

  const allocationTypes = new Set(
    Object.values(allocations.sectionSubjects).flat().map((subject) => subject.type),
  );
  for (const type of allocationTypes) {
    await ensureSubjectTypeExists(userId, type);
  }

  const studentIds = Object.keys(allocations.studentSections);
  const ownedStudents = await repository.getOwnedStudentAllocations(userId, studentIds);
  if (ownedStudents.length !== studentIds.length) {
    const error = new Error('One or more students are unavailable for this account.');
    error.status = 400;
    throw error;
  }
  const configClass = config.className.trim().toLowerCase();
  const studentsMatchConfig = ownedStudents.every((student) => {
    const studentClass = student.department.trim().toLowerCase();
    return student.academic_year === config.academicYear &&
      (studentClass.includes(configClass) || configClass.includes(studentClass));
  });
  if (!studentsMatchConfig) {
    const error = new Error('Students must belong to this academic year and class/course.');
    error.status = 400;
    throw error;
  }

  return repository.replaceConfigAllocations(userId, configId, allocations);
};
