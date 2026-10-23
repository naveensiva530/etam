const staffRepository = require('./staff.repository');

// ── List active staff (pagination + search) ───────────────────────────────────
exports.getStaff = (userId, institution, options) =>
  staffRepository.getAll(userId, institution, options);

// ── Get single staff by ID ────────────────────────────────────────────────────
exports.getStaffById = async (userId, id) => {
  const staff = await staffRepository.getById(userId, id);
  if (!staff) {
    const error = new Error('Staff record was not found.');
    error.statusCode = 404;
    throw error;
  }
  return staff;
};

// ── Create one staff member ───────────────────────────────────────────────────
exports.createStaff = (userId, staff) =>
  staffRepository.create(userId, staff);

// ── Bulk create ───────────────────────────────────────────────────────────────
exports.createStaffBulk = (userId, staffList) =>
  staffRepository.createMany(userId, staffList);

// ── Update one staff member ───────────────────────────────────────────────────
exports.updateStaff = async (userId, id, staff) => {
  const updated = await staffRepository.update(userId, id, staff);
  if (!updated) {
    const error = new Error('Staff record was not found.');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

// ── Soft-delete → recycle bin ─────────────────────────────────────────────────
exports.deleteStaff = async (userId, id) => {
  const deleted = await staffRepository.softDelete(userId, id);
  if (!deleted) {
    const error = new Error('Staff record was not found.');
    error.statusCode = 404;
    throw error;
  }
};

// ── Recycle bin — list archived staff ─────────────────────────────────────────
exports.getArchivedStaff = (userId, institution) =>
  staffRepository.getArchived(userId, institution);

// ── Restore a staff member from the recycle bin ───────────────────────────────
exports.restoreStaff = async (userId, id) => {
  const restored = await staffRepository.restore(userId, id);
  if (!restored) {
    const error = new Error('Archived staff record was not found.');
    error.statusCode = 404;
    throw error;
  }
  return restored;
};

// ── Hard-delete (permanent purge from recycle bin) ────────────────────────────
exports.purgeStaff = async (userId, id) => {
  const purged = await staffRepository.hardDelete(userId, id);
  if (!purged) {
    const error = new Error('Staff record was not found.');
    error.statusCode = 404;
    throw error;
  }
};

exports.getStaffRoles = (userId, institution) =>
  staffRepository.getRoles(userId, institution);

exports.saveStaffRoles = (userId, institution, roles) =>
  staffRepository.saveRoles(userId, institution, roles);
