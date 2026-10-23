const pool = require('../../config/db');

// ── Column list used for INSERT / UPDATE (never includes id, owner_user_id, created_at) ──
const columns = [
  'admission_id', 'student_id', 'student_name', 'institution', 'department',
  'academic_year', 'academic_configuration_id', 'gender', 'photo_url', 'date_of_joining', 'parent_name',
  'parent_mobile', 'student_mobile', 'dob', 'category', 'subcategory', 'additional_department',
  'residence_type', 'communication_address', 'pin_zip', 'blood_group', 'status',
];

const toValues = (student) => [
  student.admissionId,
  student.studentId,
  student.studentName,
  student.institution,
  student.department,
  student.academicYear,
  student.academicConfigurationId,
  student.gender,
  student.photoUrl || null,
  student.dateOfJoining,
  student.parentName  || null,
  student.parentMobile  || null,
  student.studentMobile || null,
  student.dob       || null,
  student.category || null,
  student.subcategory || null,
  student.additionalDepartment || null,
  student.residenceType || null,
  student.communicationAddress || null,
  student.pinZip || null,
  student.bloodGroup  || null,
  student.status    || 'Active',
];

const mapStudent = (row) => ({
  id:            String(row.id),
  admissionId:   row.admission_id,
  studentId:     row.student_id,
  studentName:   row.student_name,
  institution:   row.institution,
  department:    row.department,
  academicYear:  row.academic_year,
  academicConfigurationId: row.academic_configuration_id
    ? String(row.academic_configuration_id)
    : undefined,
  gender:        row.gender,
  photoUrl:      row.photo_url || undefined,
  dateOfJoining: row.date_of_joining instanceof Date
    ? row.date_of_joining.toISOString().slice(0, 10)
    : String(row.date_of_joining).slice(0, 10),
  parentName:    row.parent_name   || undefined,
  parentMobile:  row.parent_mobile || undefined,
  studentMobile: row.student_mobile || undefined,
  dob: row.dob
    ? (row.dob instanceof Date ? row.dob.toISOString().slice(0, 10) : String(row.dob).slice(0, 10))
    : undefined,
  category: row.category || undefined,
  subcategory: row.subcategory || undefined,
  additionalDepartment: row.additional_department || undefined,
  residenceType: row.residence_type || undefined,
  communicationAddress: row.communication_address || undefined,
  pinZip: row.pin_zip || undefined,
  bloodGroup: row.blood_group || undefined,
  status:     row.status,
  createdAt:  row.created_at instanceof Date
    ? row.created_at.toISOString()
    : new Date(row.created_at).toISOString(),
});

// ── Internal helper: fetch one row by id ──────────────────────────────────────
const selectById = async (executor, userId, id) => {
  const [rows] = await executor.execute(
    'SELECT * FROM students WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL',
    [userId, id],
  );
  return rows[0] ? mapStudent(rows[0]) : null;
};

exports.getById = async (userId, id) => selectById(pool, userId, id);

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
    conditions.push('(student_name LIKE ? OR admission_id LIKE ? OR student_id LIKE ?)');
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.execute(
    `SELECT * FROM students ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset],
  );

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM students ${where}`,
    params,
  );

  return {
    students: rows.map(mapStudent),
    total: Number(total),
    page,
    limit,
  };
};

// ── create — INSERT one student ───────────────────────────────────────────────
exports.create = async (userId, student) => {
  const placeholders = ['owner_user_id', ...columns].map(() => '?').join(', ');
  const [result] = await pool.execute(
    `INSERT INTO students (owner_user_id, ${columns.join(', ')}) VALUES (${placeholders})`,
    [userId, ...toValues(student)],
  );
  return selectById(pool, userId, result.insertId);
};

// ── createMany — bulk INSERT in a transaction ─────────────────────────────────
exports.createMany = async (userId, students) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const rowPlaceholder = `(${['owner_user_id', ...columns].map(() => '?').join(', ')})`;
    const placeholders = students.map(() => rowPlaceholder).join(', ');
    await connection.execute(
      `INSERT INTO students (owner_user_id, ${columns.join(', ')}) VALUES ${placeholders}`,
      students.flatMap((student) => [userId, ...toValues(student)]),
    );

    const admissionIds = students.map((s) => s.admissionId);
    const inPlaceholders = admissionIds.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT * FROM students
       WHERE owner_user_id = ? AND institution = ? AND admission_id IN (${inPlaceholders})
         AND deleted_at IS NULL`,
      [userId, students[0].institution, ...admissionIds],
    );

    const byAdmissionId = new Map(rows.map((row) => [row.admission_id, mapStudent(row)]));
    await connection.commit();
    return admissionIds.map((admissionId) => byAdmissionId.get(admissionId));
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// ── update — UPDATE all columns for one student ───────────────────────────────
exports.update = async (userId, id, student) => {
  const assignments = columns.map((col) => `${col} = ?`).join(', ');
  const [result] = await pool.execute(
    `UPDATE students SET ${assignments}
     WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL`,
    [...toValues(student), userId, id],
  );

  if (result.affectedRows === 0) {
    // Distinguish between "not found" and "no data change"
    const [rows] = await pool.execute(
      'SELECT id FROM students WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL',
      [userId, id],
    );
    if (rows.length === 0) return null;
  }
  return selectById(pool, userId, id);
};

// ── softDelete — set deleted_at + status=Archived (moves to recycle bin) ─────
exports.softDelete = async (userId, id) => {
  const [result] = await pool.execute(
    `UPDATE students
     SET deleted_at = NOW(), status = 'Archived'
     WHERE owner_user_id = ? AND id = ? AND deleted_at IS NULL`,
    [userId, id],
  );
  return result.affectedRows > 0;
};

// ── getArchived — recycle bin list for this user+institution ──────────────────
exports.getArchived = async (userId, institution, { page = 1, limit = 50 } = {}) => {
  const conditions = ['owner_user_id = ?', 'deleted_at IS NOT NULL'];
  const params = [userId];
  if (institution) { conditions.push('institution = ?'); params.push(institution); }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.execute(
    `SELECT * FROM students ${where} ORDER BY deleted_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM students ${where}`,
    params,
  );
  return { students: rows.map(mapStudent), total: Number(total), page, limit };
};

// ── restore — un-delete a student from the recycle bin ───────────────────────
exports.restore = async (userId, id) => {
  const [result] = await pool.execute(
    `UPDATE students
     SET deleted_at = NULL, status = 'Active'
     WHERE owner_user_id = ? AND id = ? AND deleted_at IS NOT NULL`,
    [userId, id],
  );
  return result.affectedRows > 0 ? selectById(pool, userId, id) : null;
};

// ── hardDelete — permanent delete (admin only / recycle bin purge) ────────────
exports.hardDelete = async (userId, id) => {
  const [result] = await pool.execute(
    'DELETE FROM students WHERE owner_user_id = ? AND id = ?',
    [userId, id],
  );
  return result.affectedRows > 0;
};