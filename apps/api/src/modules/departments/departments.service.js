const departmentsRepository = require('./departments.repository');

exports.getDepartments = (userId, institution) => departmentsRepository.getAll(userId, institution);

exports.createDepartment = (userId, institution, name) =>
  departmentsRepository.create(userId, institution, name);

exports.updateDepartment = async (userId, id, name) => {
  const department = await departmentsRepository.update(userId, id, name);
  if (!department) {
    const error = new Error('Department was not found.');
    error.statusCode = 404;
    throw error;
  }
  return department;
};

exports.deleteDepartment = async (userId, id) => {
  const deleted = await departmentsRepository.remove(userId, id);
  if (!deleted) {
    const error = new Error('Department was not found.');
    error.statusCode = 404;
    throw error;
  }
};
