const pool = require('../../config/db');

const mapRowToConfig = (row) => ({
  id: String(row.id),
  academicConfigurationId: String(row.academic_configuration_id),
  departmentName: row.department_name,
  academicYear: row.academic_year,
  category: row.category,
  subCategory: row.sub_category,
  shift: row.shift,
  totalPeriods: Number(row.total_periods),
  periodDurationMinutes: Number(row.period_duration_minutes),
  startTime: row.start_time,
  classTeacherId: row.class_teacher_id || '',
  classTeacherName: row.class_teacher_name || '',
  breaksConfig: typeof row.breaks_config === 'string' ? JSON.parse(row.breaks_config) : (row.breaks_config || []),
  status: row.status,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : '',
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
});

const mapRowToAllocation = (row) => ({
  id: String(row.id),
  timetableConfigurationId: String(row.timetable_configuration_id),
  dayOfWeek: row.day_of_week,
  periodNumber: Number(row.period_number),
  startTime: row.start_time,
  endTime: row.end_time,
  subjectCode: row.subject_code || '',
  subjectName: row.subject_name,
  teacherId: row.teacher_id || '',
  teacherName: row.teacher_name,
  teacherAvatar: row.teacher_avatar || '',
});

/**
 * Get departments/classes list with their Timetable status ('Created' vs 'Not Created')
 */
exports.getDepartmentsWithStatus = async (userId, institution) => {
  // 1. Get academic configurations for this owner
  const [configs] = await pool.execute(
    `SELECT id, academic_year, class_name, sub_category, status, sections
     FROM academic_configurations
     WHERE owner_user_id = ?
     ORDER BY class_name ASC, id ASC`,
    [userId]
  );

  // 2. Get timetable configurations for this owner and institution
  const [timetables] = await pool.execute(
    `SELECT id, academic_configuration_id, department_name, category, sub_category, status
     FROM timetable_configurations
     WHERE owner_user_id = ? AND institution = ?`,
    [userId, institution || 'College']
  );

  const timetableMap = new Map();
  timetables.forEach((tt) => {
    timetableMap.set(String(tt.academic_configuration_id), tt);
  });

  return configs.map((cfg) => {
    const tt = timetableMap.get(String(cfg.id));
    const parsedSections = typeof cfg.sections === 'string' ? JSON.parse(cfg.sections) : (cfg.sections || []);
    return {
      id: String(cfg.id),
      departmentId: `N00${String(cfg.id).padStart(2, '0')}`,
      departmentName: cfg.sub_category && cfg.sub_category !== 'General'
        ? `${cfg.class_name} ${cfg.sub_category}`
        : cfg.class_name,
      className: cfg.class_name,
      subCategory: cfg.sub_category || 'General',
      academicYear: cfg.academic_year,
      sections: parsedSections,
      status: tt ? 'Created' : 'Not Created',
      timetableId: tt ? String(tt.id) : null,
    };
  });
};

/**
 * Get options for assigning: teaching staff, allocated subjects, and master subjects
 */
exports.getOptions = async (userId, institution, academicConfigId, sectionName) => {
  // 1. Teaching staff
  const [staffRows] = await pool.execute(
    `SELECT staff_id, name, photo_url, role, department
     FROM staff
     WHERE (owner_user_id = ? OR owner_user_id IS NULL)
       AND institution = ?
       AND deleted_at IS NULL
       AND (staff_type = 'Teaching' OR staff_type IS NULL)
     ORDER BY name ASC`,
    [userId, institution || 'College']
  );

  // 2. Allocated subjects for this academic configuration & section
  let allocatedSubjects = [];
  if (academicConfigId) {
    const [allocRows] = await pool.execute(
      `SELECT subject_code, subject_name, subject_type, faculty
       FROM academic_subject_allocations
       WHERE owner_user_id = ? AND academic_configuration_id = ?
         AND (section_name = ? OR ? = '')
       ORDER BY subject_name ASC`,
      [userId, academicConfigId, sectionName || '', sectionName || '']
    );
    allocatedSubjects = allocRows.map((r) => ({
      code: r.subject_code,
      name: r.subject_name,
      type: r.subject_type,
      faculty: r.faculty || '',
    }));
  }

  // 3. Subject master records
  const [masterRows] = await pool.execute(
    `SELECT code, name, type
     FROM subject_master
     WHERE owner_user_id = ? AND status = 'Active'
     ORDER BY name ASC`,
    [userId]
  );

  return {
    teachingStaff: staffRows.map((s) => ({
      staffId: s.staff_id,
      name: s.name,
      photoUrl: s.photo_url || '',
      role: s.role || '',
      department: s.department || '',
    })),
    allocatedSubjects,
    masterSubjects: masterRows.map((m) => ({
      code: m.code,
      name: m.name,
      type: m.type,
    })),
  };
};

/**
 * Get timetable configuration by ID including all period allocations
 */
exports.getTimetableById = async (userId, id) => {
  const [configRows] = await pool.execute(
    `SELECT * FROM timetable_configurations WHERE id = ? AND owner_user_id = ?`,
    [id, userId]
  );
  if (configRows.length === 0) return null;

  const config = mapRowToConfig(configRows[0]);

  const [allocRows] = await pool.execute(
    `SELECT * FROM timetable_period_allocations
     WHERE timetable_configuration_id = ? AND owner_user_id = ?
     ORDER BY period_number ASC, day_of_week ASC`,
    [id, userId]
  );

  return {
    ...config,
    allocations: allocRows.map(mapRowToAllocation),
  };
};

/**
 * Get timetable configuration by Academic Configuration ID
 */
exports.getTimetableByAcademicConfigId = async (userId, academicConfigId) => {
  const [configRows] = await pool.execute(
    `SELECT * FROM timetable_configurations
     WHERE academic_configuration_id = ? AND owner_user_id = ?
     LIMIT 1`,
    [academicConfigId, userId]
  );
  if (configRows.length === 0) return null;

  const config = mapRowToConfig(configRows[0]);

  const [allocRows] = await pool.execute(
    `SELECT * FROM timetable_period_allocations
     WHERE timetable_configuration_id = ? AND owner_user_id = ?
     ORDER BY period_number ASC, day_of_week ASC`,
    [config.id, userId]
  );

  return {
    ...config,
    allocations: allocRows.map(mapRowToAllocation),
  };
};

/**
 * Save (create or update) a full timetable configuration + period allocations
 */
exports.saveTimetable = async (userId, institution, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      academicConfigurationId,
      departmentName,
      academicYear,
      category,
      subCategory,
      shift = 'Morning',
      totalPeriods = 8,
      periodDurationMinutes = 30,
      startTime = '09:30 AM',
      classTeacherId = '',
      classTeacherName = '',
      breaksConfig = [],
      allocations = [],
    } = data;

    // Check if configuration already exists for this academic_configuration_id & sub_category
    const [existing] = await connection.execute(
      `SELECT id FROM timetable_configurations
       WHERE owner_user_id = ? AND academic_configuration_id = ? AND sub_category = ?`,
      [userId, academicConfigurationId, subCategory]
    );

    let timetableId;
    if (existing.length > 0) {
      timetableId = existing[0].id;
      await connection.execute(
        `UPDATE timetable_configurations
         SET institution = ?,
             department_name = ?,
             academic_year = ?,
             category = ?,
             shift = ?,
             total_periods = ?,
             period_duration_minutes = ?,
             start_time = ?,
             class_teacher_id = ?,
             class_teacher_name = ?,
             breaks_config = ?,
             status = 'Created',
             updated_at = NOW()
         WHERE id = ? AND owner_user_id = ?`,
        [
          institution || 'College',
          departmentName,
          academicYear,
          category,
          shift,
          totalPeriods,
          periodDurationMinutes,
          startTime,
          classTeacherId,
          classTeacherName,
          JSON.stringify(breaksConfig),
          timetableId,
          userId,
        ]
      );
    } else {
      const [insertResult] = await connection.execute(
        `INSERT INTO timetable_configurations (
           owner_user_id, institution, academic_configuration_id,
           department_name, academic_year, category, sub_category,
           shift, total_periods, period_duration_minutes, start_time,
           class_teacher_id, class_teacher_name, breaks_config, status
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created')`,
        [
          userId,
          institution || 'College',
          academicConfigurationId,
          departmentName,
          academicYear,
          category,
          subCategory,
          shift,
          totalPeriods,
          periodDurationMinutes,
          startTime,
          classTeacherId,
          classTeacherName,
          JSON.stringify(breaksConfig),
        ]
      );
      timetableId = insertResult.insertId;
    }

    // Clear old allocations for this timetable
    await connection.execute(
      `DELETE FROM timetable_period_allocations
       WHERE timetable_configuration_id = ? AND owner_user_id = ?`,
      [timetableId, userId]
    );

    // Batch insert new period allocations
    if (allocations && allocations.length > 0) {
      const insertSql = `
        INSERT INTO timetable_period_allocations (
          owner_user_id, timetable_configuration_id, day_of_week, period_number,
          start_time, end_time, subject_code, subject_name, teacher_id, teacher_name, teacher_avatar
        ) VALUES ?
      `;

      const values = allocations.map((alloc) => [
        userId,
        timetableId,
        alloc.dayOfWeek,
        alloc.periodNumber,
        alloc.startTime,
        alloc.endTime,
        alloc.subjectCode || null,
        alloc.subjectName,
        alloc.teacherId || null,
        alloc.teacherName,
        alloc.teacherAvatar || null,
      ]);

      await connection.query(insertSql, [values]);
    }

    await connection.commit();
    return timetableId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Delete a timetable configuration and all associated allocations
 */
exports.deleteTimetable = async (userId, id) => {
  const [result] = await pool.execute(
    `DELETE FROM timetable_configurations WHERE id = ? AND owner_user_id = ?`,
    [id, userId]
  );
  return result.affectedRows > 0;
};
