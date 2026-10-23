const service = require('./academic-config.service');

exports.listSections = async (req, res, next) => {
  try {
    const sections = await service.listSections(req.auth.userId);
    res.json({ data: sections });
  } catch (error) {
    next(error);
  }
};

exports.createSection = async (req, res, next) => {
  try {
    const section = await service.createSection(req.auth.userId, req.body.name);
    res.status(201).json({ data: section, message: 'Section created successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateSection = async (req, res, next) => {
  try {
    const section = await service.updateSection(req.auth.userId, req.params.id, req.body.name);
    res.json({ data: section, message: 'Section renamed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.removeSection = async (req, res, next) => {
  try {
    await service.deleteSection(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.listSubjectTypes = async (req, res, next) => {
  try {
    const types = await service.listSubjectTypes(req.auth.userId);
    res.json({ data: types });
  } catch (error) {
    next(error);
  }
};

exports.createSubjectType = async (req, res, next) => {
  try {
    const subjectType = await service.createSubjectType(req.auth.userId, req.body.name);
    res.status(201).json({ data: subjectType, message: 'Subject type created successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateSubjectType = async (req, res, next) => {
  try {
    const subjectType = await service.updateSubjectType(
      req.auth.userId,
      req.params.id,
      req.body.name,
    );
    res.json({ data: subjectType, message: 'Subject type renamed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.removeSubjectType = async (req, res, next) => {
  try {
    await service.deleteSubjectType(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.list = async (req, res, next) => {
  try {
    const configs = await service.listConfigs(req.auth.userId, req.query);
    res.json({ data: configs });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const config = await service.getConfig(req.auth.userId, req.params.id);
    res.json({ data: config });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const config = await service.createConfig(req.auth.userId, req.body);
    res.status(201).json({ data: config, message: 'Academic configuration created successfully' });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const config = await service.updateConfig(req.auth.userId, req.params.id, req.body);
    res.json({ data: config, message: 'Academic configuration updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateSections = async (req, res, next) => {
  try {
    const config = await service.updateConfigSections(
      req.auth.userId,
      req.params.id,
      req.body.expectedSections,
      req.body.sections,
    );
    res.json({ data: config, message: 'Sections updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await service.deleteConfig(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// Subject Master controllers
exports.listSubjects = async (req, res, next) => {
  try {
    const subjects = await service.listSubjects(req.auth.userId);
    res.json({ data: subjects });
  } catch (error) {
    next(error);
  }
};

exports.createSubject = async (req, res, next) => {
  try {
    const subject = await service.createSubject(req.auth.userId, req.body);
    res.status(201).json({ data: subject, message: 'Subject created in Subject Master' });
  } catch (error) {
    next(error);
  }
};

exports.updateSubject = async (req, res, next) => {
  try {
    const subject = await service.updateSubject(req.auth.userId, req.params.id, req.body);
    res.json({ data: subject, message: 'Subject updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.createSubjects = async (req, res, next) => {
  try {
    const subjects = await service.createSubjects(req.auth.userId, req.body.subjects);
    res.status(201).json({ data: subjects, message: 'Subjects created in Subject Master' });
  } catch (error) {
    next(error);
  }
};

exports.removeSubject = async (req, res, next) => {
  try {
    await service.deleteSubject(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.getAllocations = async (req, res, next) => {
  try {
    const allocations = await service.getConfigAllocations(req.auth.userId, req.params.id);
    res.json({ data: allocations });
  } catch (error) {
    next(error);
  }
};

exports.updateAllocations = async (req, res, next) => {
  try {
    const allocations = await service.replaceConfigAllocations(
      req.auth.userId,
      req.params.id,
      req.body
    );
    res.json({ data: allocations, message: 'Academic allocations saved successfully' });
  } catch (error) {
    next(error);
  }
};
