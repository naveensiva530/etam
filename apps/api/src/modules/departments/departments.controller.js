const departmentsService = require('./departments.service');

exports.list = async (req, res, next) => {
  try {
    const departments = await departmentsService.getDepartments(req.auth.userId, req.query.institution);
    res.json({ data: departments });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const department = await departmentsService.createDepartment(
      req.auth.userId,
      req.body.institution,
      req.body.name
    );
    res.status(201).json({ data: department });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const department = await departmentsService.updateDepartment(
      req.auth.userId,
      req.params.id,
      req.body.name
    );
    res.json({ data: department });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await departmentsService.deleteDepartment(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
