const pool = require('../../config/db');

// ── Column list used for INSERT / UPDATE (never includes id, owner_user_id, created_at, deleted_at) ──
const columns = [
  'staff_id', 'name', 'role', 'institution', 'staff_type', 'department',
  'teaching_scope', 'qualification', 'photo_url', 'email', 'mobile', 'date_of_joining', 'blood_group', 'status',
];

const parseTeachingScope = (value) => {
  if (!value) return undefined;
  return typeof value === 'string' ? JSON.parse(value) : value;
};

const toValues = (staff) => [
  staff.staffId,
  staff.name,
  staff.role,
  staff.institution,
  staff.staffType,
  staff.department || null,
  staff.teachingScope ? JSON.stringify(staff.teachingScope) : null,
  staff.qualification,
  staff.photoUrl || null,
  staff.email,
  staff.mobile,
  staff.dateOfJoining,
  staff.bloodGroup || null,
  staff.status || 'Active',
];

const mapStaff = (row) => ({
  id: String(row.id),
  staffId: row.staff_id,
  name: row.name,
  role: row.role,
  institution: row.institution,
  staffType: row.staff_type || undefined,
  department: row.department || undefined,
  teachingScope: parseTeachingScope(row.teaching_scope),
  qualification: row.qualification,
  photoUrl: row.photo_url || undefined,
  email: row.email,
  mobile: row.mobile,
  dateOfJoining: row.date_of_joining instanceof Date
    ? row.date_of_joining.toISOString().slice(0, 10)
    : String(row.date_of_joining).slice(0, 10),
  bloodGroup: row.blood_group || undefined,
  status: row.status,
  createdAt: row.created_at instanceof Date
    ? row.created_at.toISOString()
    : new Date(row.created_at).toISOString(),
});

// ── Internal helper: fetch one row by id ──────────────────────────────────────
const selectById = async (executor, id) => {
  const [rows] = await executor.execute(
    'SELECT * FROM staff WHERE id = ? AND deleted_at IS NULL',
    [id],
  );
  return rows[0] ? mapStaff(rows[0]) : null;
};

// ── getAll — with optional institution filter, search, and pagination ─────────
exports.getAll = async (userId, institution, { page = 1, limit = 50, search } = {}) => {
  const offset = (page - 1) * limit;

  // Build WHERE clause dynamically
  const conditions = ['owner_user_id = ?', 'deleted_at IS NULL'];
  const params = [userId];

  if (institution) {
    conditions.push('institution = ?');
    params.push(institution);
  }
  if (search && search.trim()) {
    conditions.push('(name LIKE ? OR staff_id LIKE ? OR role LIKE ? OR department LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term, term);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.execute(
    `SELECT * FROM staff ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM staff ${where}`,
    params,
  );

  return {
    staff: rows.map(mapStaff),
    total: Number(total),
    page,
    limit,
  };
};

// ── getById ───────────────────────────────────────────────────────────────────
exports.getById = async (userId, id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM staff WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL',
    [userId, id],
  );
  return rows[0] ? mapStaff(rows[0]) : null;
};

// ── create — INSERT one staff ─────────────────────────────────────────────────
exports.create = async (userId, staff) => {
  const placeholders = ['owner_user_id', ...columns].map(() => '?').join(', ');
  const [result] = await pool.execute(
    `INSERT INTO staff (owner_user_id, ${columns.join(', ')}) VALUES (${placeholders})`,
    [userId, ...toValues(staff)],
  );
  return selectById(pool, result.insertId);
};

// ── createMany — bulk INSERT in a transaction ─────────────────────────────────
exports.createMany = async (userId, staffList) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const rowPlaceholder = `(${['owner_user_id', ...columns].map(() => '?').join(', ')})`;
    const placeholders = staffList.map(() => rowPlaceholder).join(', ');
    await connection.execute(
      `INSERT INTO staff (owner_user_id, ${columns.join(', ')}) VALUES ${placeholders}`,
      staffList.flatMap((staff) => [userId, ...toValues(staff)]),
    );

    const staffIds = staffList.map((s) => s.staffId);
    const inPlaceholders = staffIds.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT * FROM staff
       WHERE owner_user_id = ? AND institution = ? AND staff_id IN (${inPlaceholders})
         AND deleted_at IS NULL`,
      [userId, staffList[0].institution, ...staffIds],
    );

    const byStaffId = new Map(rows.map((row) => [row.staff_id, mapStaff(row)]));
    await connection.commit();
    return staffIds.map((staffId) => byStaffId.get(staffId));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── update — UPDATE all columns for one staff ─────────────────────────────────
exports.update = async (userId, id, staff) => {
  const assignments = columns.map((col) => `${col} = ?`).join(', ');
  const [result] = await pool.execute(
    `UPDATE staff SET ${assignments}
     WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL`,
    [...toValues(staff), userId, id],
  );

  if (result.affectedRows === 0) {
    const [rows] = await pool.execute(
      'SELECT id FROM staff WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL',
      [userId, id],
    );
    if (rows.length === 0) return null;
  }
  return selectById(pool, id);
};

// ── softDelete — set deleted_at + status=Archived (moves to recycle bin) ─────
exports.softDelete = async (userId, id) => {
  const [result] = await pool.execute(
    `UPDATE staff
     SET deleted_at = NOW(), status = 'Archived'
     WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL`,
    [userId, id],
  );
  return result.affectedRows > 0;
};

// ── getArchived — recycle bin list for this user+institution ──────────────────
exports.getArchived = async (userId, institution) => {
  const conditions = ['owner_user_id = ?', 'deleted_at IS NOT NULL'];
  const params = [userId];
  if (institution) { conditions.push('institution = ?'); params.push(institution); }

  const [rows] = await pool.execute(
    `SELECT * FROM staff WHERE ${conditions.join(' AND ')} ORDER BY deleted_at DESC, id DESC`,
    params,
  );
  return rows.map(mapStaff);
};

// ── restore — un-delete a staff from the recycle bin ─────────────────────────
exports.restore = async (userId, id) => {
  const [result] = await pool.execute(
    `UPDATE staff
     SET deleted_at = NULL, status = 'Active'
     WHERE owner_user_id = ? AND id = ? AND deleted_at IS NOT NULL`,
    [userId, id],
  );
  return result.affectedRows > 0 ? selectById(pool, id) : null;
};

// ── hardDelete — permanent delete (recycle bin purge) ────────────────────────
exports.hardDelete = async (userId, id) => {
  const [result] = await pool.execute(
    'DELETE FROM staff WHERE owner_user_id = ? AND id = ?',
    [userId, id],
  );
  return result.affectedRows > 0;
};

exports.getRoles = async (userId, institution) => {
  const [rows] = await pool.execute(
    'SELECT roles FROM staff_role_options WHERE owner_user_id = ? AND institution = ?',
    [userId, institution],
  );
  if (!rows[0]) return null;
  return typeof rows[0].roles === 'string' ? JSON.parse(rows[0].roles) : rows[0].roles;
};

exports.saveRoles = async (userId, institution, roles) => {
  await pool.execute(
    `INSERT INTO staff_role_options (owner_user_id, institution, roles)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE roles = VALUES(roles)`,
    [userId, institution, JSON.stringify(roles)],
  );
  return roles;
};

exports.getSkills = async (userId, institution) => {
  const [rows] = await pool.execute(
    'SELECT skills FROM staff_skill_options WHERE owner_user_id = ? AND institution = ?',
    [userId, institution],
  );
  if (!rows[0]) return null;
  return typeof rows[0].skills === 'string' ? JSON.parse(rows[0].skills) : rows[0].skills;
};

exports.saveSkills = async (userId, institution, skills) => {
  await pool.execute(
    `INSERT INTO staff_skill_options (owner_user_id, institution, skills)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE skills = VALUES(skills)`,
    [userId, institution, JSON.stringify(skills)],
  );
  return skills;
};
