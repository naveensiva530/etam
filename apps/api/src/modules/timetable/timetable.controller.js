const timetableService = require('./timetable.service');

exports.getDepartments = async (req, res, next) => {
  try {
    const institution = req.headers['x-institution'] || req.query.institution || 'College';
    const departments = await timetableService.getDepartmentsWithStatus(req.auth.userId, institution);
    res.json({ data: departments });
  } catch (error) {
    next(error);
  }
};

exports.getOptions = async (req, res, next) => {
  try {
    const institution = req.headers['x-institution'] || req.query.institution || 'College';
    const { academicConfigId, sectionName } = req.query;
    const options = await timetableService.getOptions(
      req.auth.userId,
      institution,
      academicConfigId,
      sectionName
    );
    res.json({ data: options });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const timetable = await timetableService.getTimetableById(req.auth.userId, req.params.id);
    res.json({ data: timetable });
  } catch (error) {
    next(error);
  }
};

exports.getByAcademicConfigId = async (req, res, next) => {
  try {
    const timetable = await timetableService.getTimetableByAcademicConfigId(
      req.auth.userId,
      req.params.academicConfigId
    );
    res.json({ data: timetable });
  } catch (error) {
    next(error);
  }
};

exports.save = async (req, res, next) => {
  try {
    const institution = req.headers['x-institution'] || req.body.institution || 'College';
    const timetable = await timetableService.saveTimetable(req.auth.userId, institution, req.body);
    res.status(201).json({ data: timetable });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await timetableService.deleteTimetable(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};
