const studentsService = require('./students.service');

// ── GET /students — active list with pagination + search ─────────────────────
exports.list = async (req, res, next) => {
  try {
    const { institution, page, limit, search } = req.query;
    const result = await studentsService.getStudents(req.auth.userId, institution, {
      page:   Number(page  || 1),
      limit:  Number(limit || 50),
      search: search || undefined,
    });
    res.json({ data: result.students, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    next(error);
  }
};

// ── POST /students — create one ──────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const student = await studentsService.createStudent(req.auth.userId, req.body);
    res.status(201).json({ data: student });
  } catch (error) {
    next(error);
  }
};

// ── POST /students/bulk — create many ────────────────────────────────────────
exports.createBulk = async (req, res, next) => {
  try {
    const students = await studentsService.createStudents(req.auth.userId, req.body.students);
    res.status(201).json({ data: students, count: students.length });
  } catch (error) {
    next(error);
  }
};

// ── PUT /students/:id — update ───────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const student = await studentsService.updateStudent(req.auth.userId, req.params.id, req.body);
    res.json({ data: student });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /students/:id — soft-delete (recycle bin) ─────────────────────────
exports.remove = async (req, res, next) => {
  try {
    await studentsService.deleteStudent(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// ── GET /students/archived — recycle bin list ─────────────────────────────────
exports.listArchived = async (req, res, next) => {
  try {
    const { institution, page, limit } = req.query;
    const result = await studentsService.getArchivedStudents(req.auth.userId, institution, {
      page: Number(page || 1),
      limit: Number(limit || 50),
    });
    res.json({
      data: result.students,
      total: result.total,
      page: result.page,
      limit: result.limit,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /students/:id/restore — restore from recycle bin ────────────────────
exports.restore = async (req, res, next) => {
  try {
    const student = await studentsService.restoreStudent(req.auth.userId, req.params.id);
    res.json({ data: student });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /students/:id/purge — permanent hard-delete ───────────────────────
exports.purge = async (req, res, next) => {
  try {
    await studentsService.purgeStudent(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};