const staffService = require('./staff.service');

// ── GET /staff — active list with pagination + search ─────────────────────────
exports.list = async (req, res, next) => {
  try {
    const { institution, page, limit, search } = req.query;
    const result = await staffService.getStaff(req.auth.userId, institution, {
      page:   Number(page  || 1),
      limit:  Number(limit || 50),
      search: search || undefined,
    });
    res.json({ data: result.staff, total: result.total, page: result.page, limit: result.limit });
  } catch (error) {
    next(error);
  }
};

// ── GET /staff/:id — get one ──────────────────────────────────────────────────
exports.getById = async (req, res, next) => {
  try {
    const staff = await staffService.getStaffById(req.auth.userId, req.params.id);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
};

// ── POST /staff — create one ──────────────────────────────────────────────────
exports.create = async (req, res, next) => {
  try {
    const staff = await staffService.createStaff(req.auth.userId, req.body);
    res.status(201).json({ data: staff });
  } catch (error) {
    next(error);
  }
};

// ── POST /staff/bulk — create many ────────────────────────────────────────────
exports.createBulk = async (req, res, next) => {
  try {
    const staffList = await staffService.createStaffBulk(req.auth.userId, req.body.staffList);
    res.status(201).json({ data: staffList, count: staffList.length });
  } catch (error) {
    next(error);
  }
};

// ── PUT /staff/:id — update ───────────────────────────────────────────────────
exports.update = async (req, res, next) => {
  try {
    const staff = await staffService.updateStaff(req.auth.userId, req.params.id, req.body);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /staff/:id — soft-delete (recycle bin) ─────────────────────────────
exports.remove = async (req, res, next) => {
  try {
    await staffService.deleteStaff(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

// ── GET /staff/archived — recycle bin list ─────────────────────────────────────
exports.listArchived = async (req, res, next) => {
  try {
    const { institution } = req.query;
    const staff = await staffService.getArchivedStaff(req.auth.userId, institution);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
};

// ── POST /staff/:id/restore — restore from recycle bin ────────────────────────
exports.restore = async (req, res, next) => {
  try {
    const staff = await staffService.restoreStaff(req.auth.userId, req.params.id);
    res.json({ data: staff });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /staff/:id/purge — permanent hard-delete ───────────────────────────
exports.purge = async (req, res, next) => {
  try {
    await staffService.purgeStaff(req.auth.userId, req.params.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
};

exports.listRoles = async (req, res, next) => {
  try {
    const roles = await staffService.getStaffRoles(req.auth.userId, req.query.institution);
    res.json({ data: roles });
  } catch (error) {
    next(error);
  }
};

exports.saveRoles = async (req, res, next) => {
  try {
    const roles = await staffService.saveStaffRoles(
      req.auth.userId,
      req.body.institution,
      req.body.roles,
    );
    res.json({ data: roles });
  } catch (error) {
    next(error);
  }
};
