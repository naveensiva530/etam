const pool = require('../../config/db');

const mapRowToConfig = (row) => ({
  id: String(row.id),
  academicYear: row.academic_year,
  className: row.class_name,
  subCategory: row.sub_category || 'General',
  status: row.status,
  sections: typeof row.sections === 'string' ? JSON.parse(row.sections) : (row.sections || []),
  createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : '',
});

const mapRowToSubject = (row) => ({
  id: String(row.id),
  code: row.code,
  name: row.name,
  type: row.type,
  status: row.status,
  description: row.description || '',
  createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
});

const mapRowToSection = (row) => ({
  id: String(row.id),
  name: row.name,
  classCount: Number(row.class_count || 0),
});

const mapRowToSubjectType = (row) => ({
  id: String(row.id),
  name: row.name,
});

const createConflictError = (message) => {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
};

exports.getAllSubjectTypes = async (userId) => {
  await pool.execute(
    `INSERT IGNORE INTO subject_types (owner_user_id, name)
     VALUES (?, 'Core'), (?, 'Elective'), (?, 'Practical')`,
    [userId, userId, userId],
  );
  const [rows] = await pool.execute(
    'SELECT id, name FROM subject_types WHERE owner_user_id = ? ORDER BY name ASC',
    [userId],
  );
  return rows.map(mapRowToSubjectType);
};

exports.hasSubjectType = async (userId, name) => {
  const [rows] = await pool.execute(
    'SELECT id FROM subject_types WHERE owner_user_id = ? AND name = ?',
    [userId, name],
  );
  return rows.length > 0;
};

exports.createSubjectType = async (userId, name) => {
  try {
    const [result] = await pool.execute(
      'INSERT INTO subject_types (owner_user_id, name) VALUES (?, ?)',
      [userId, name],
    );
    const [rows] = await pool.execute(
      'SELECT id, name FROM subject_types WHERE id = ? AND owner_user_id = ?',
      [result.insertId, userId],
    );
    return mapRowToSubjectType(rows[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw createConflictError(`Subject type "${name}" already exists.`);
    }
    throw error;
  }
};

exports.updateSubjectType = async (userId, id, name) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [typeRows] = await connection.execute(
      'SELECT id, name FROM subject_types WHERE id = ? AND owner_user_id = ? FOR UPDATE',
      [id, userId],
    );
    const subjectType = typeRows[0];
    if (!subjectType) {
      await connection.rollback();
      return null;
    }
    if (subjectType.name !== name) {
      await connection.execute(
        'UPDATE subject_types SET name = ? WHERE id = ? AND owner_user_id = ?',
        [name, id, userId],
      );
      await connection.execute(
        'UPDATE subject_master SET type = ? WHERE owner_user_id = ? AND type = ?',
        [name, userId, subjectType.name],
      );
      await connection.execute(
        'UPDATE academic_subject_allocations SET subject_type = ? WHERE owner_user_id = ? AND subject_type = ?',
        [name, userId, subjectType.name],
      );
    }
    await connection.commit();
    return { id: String(subjectType.id), name };
  } catch (error) {
    await connection.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      throw createConflictError(`Subject type "${name}" already exists.`);
    }
    throw error;
  } finally {
    connection.release();
  }
};

exports.deleteSubjectType = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [typeRows] = await connection.execute(
      'SELECT id, name FROM subject_types WHERE id = ? AND owner_user_id = ? FOR UPDATE',
      [id, userId],
    );
    const subjectType = typeRows[0];
    if (!subjectType) {
      await connection.rollback();
      return false;
    }

    const [typeCounts] = await connection.execute(
      'SELECT COUNT(*) AS count FROM subject_types WHERE owner_user_id = ?',
      [userId],
    );
    if (Number(typeCounts[0].count) <= 1) {
      throw createConflictError('At least one subject type must remain.');
    }
    const [subjectRows] = await connection.execute(
      `SELECT
         (SELECT COUNT(*) FROM subject_master WHERE owner_user_id = ? AND type = ?) +
         (SELECT COUNT(*) FROM academic_subject_allocations WHERE owner_user_id = ? AND subject_type = ?)
         AS usage_count`,
      [userId, subjectType.name, userId, subjectType.name],
    );
    if (Number(subjectRows[0].usage_count) > 0) {
      throw createConflictError(`Cannot delete "${subjectType.name}" while it is assigned to subjects or allocations.`);
    }
    await connection.execute(
      'DELETE FROM subject_types WHERE id = ? AND owner_user_id = ?',
      [id, userId],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getAllSections = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT section.id, section.name,
       COUNT(DISTINCT configuration.id) AS class_count
     FROM academic_sections AS section
     LEFT JOIN academic_configurations AS configuration
       ON configuration.owner_user_id = section.owner_user_id
       AND JSON_CONTAINS(configuration.sections, JSON_QUOTE(section.name))
     WHERE section.owner_user_id = ?
     GROUP BY section.id, section.name
     ORDER BY section.name ASC`,
    [userId],
  );
  return rows.map(mapRowToSection);
};

exports.createSection = async (userId, name) => {
  const [result] = await pool.execute(
    'INSERT INTO academic_sections (owner_user_id, name) VALUES (?, ?)',
    [userId, name],
  );
  const [rows] = await pool.execute(
    'SELECT id, name, 0 AS class_count FROM academic_sections WHERE id = ? AND owner_user_id = ?',
    [result.insertId, userId],
  );
  return mapRowToSection(rows[0]);
};

exports.updateSection = async (userId, id, name) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [sectionRows] = await connection.execute(
      'SELECT id, name FROM academic_sections WHERE id = ? AND owner_user_id = ? FOR UPDATE',
      [id, userId],
    );
    const currentSection = sectionRows[0];
    if (!currentSection) {
      await connection.rollback();
      return null;
    }
    if (currentSection.name === name) {
      await connection.commit();
      return { id: String(currentSection.id), name, classCount: 0 };
    }

    const [configs] = await connection.execute(
      'SELECT id, sections FROM academic_configurations WHERE owner_user_id = ? FOR UPDATE',
      [userId],
    );
    const affectedConfigs = [];
    for (const config of configs) {
      const sections = typeof config.sections === 'string' ? JSON.parse(config.sections) : (config.sections || []);
      if (sections.includes(currentSection.name)) {
        if (sections.some((section) => section.toLowerCase() === name.toLowerCase())) {
          const error = new Error(`Cannot rename "${currentSection.name}" because "${name}" already exists in a class.`);
          error.statusCode = 409;
          throw error;
        }
        affectedConfigs.push({ id: config.id, sections });
      }
    }

    await connection.execute(
      'UPDATE academic_sections SET name = ? WHERE id = ? AND owner_user_id = ?',
      [name, id, userId],
    );
    for (const config of affectedConfigs) {
      await connection.execute(
        'UPDATE academic_configurations SET sections = ? WHERE id = ? AND owner_user_id = ?',
        [JSON.stringify(config.sections.map((section) => section === currentSection.name ? name : section)), config.id, userId],
      );
    }
    await connection.execute(
      `UPDATE academic_student_section_allocations
       SET section_name = ? WHERE owner_user_id = ? AND section_name = ?`,
      [name, userId, currentSection.name],
    );
    await connection.execute(
      `UPDATE academic_subject_allocations
       SET section_name = ? WHERE owner_user_id = ? AND section_name = ?`,
      [name, userId, currentSection.name],
    );
    await connection.commit();
    return { id: String(currentSection.id), name, classCount: affectedConfigs.length };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.deleteSection = async (userId, id) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [sectionRows] = await connection.execute(
      'SELECT id, name FROM academic_sections WHERE id = ? AND owner_user_id = ? FOR UPDATE',
      [id, userId],
    );
    const section = sectionRows[0];
    if (!section) {
      await connection.rollback();
      return false;
    }

    const [configs] = await connection.execute(
      'SELECT id, sections FROM academic_configurations WHERE owner_user_id = ? FOR UPDATE',
      [userId],
    );
    for (const config of configs) {
      const sections = typeof config.sections === 'string' ? JSON.parse(config.sections) : (config.sections || []);
      if (sections.includes(section.name)) {
        await connection.execute(
          'UPDATE academic_configurations SET sections = ? WHERE id = ? AND owner_user_id = ?',
          [JSON.stringify(sections.filter((name) => name !== section.name)), config.id, userId],
        );
      }
    }
    await connection.execute(
      'DELETE FROM academic_student_section_allocations WHERE owner_user_id = ? AND section_name = ?',
      [userId, section.name],
    );
    await connection.execute(
      'DELETE FROM academic_subject_allocations WHERE owner_user_id = ? AND section_name = ?',
      [userId, section.name],
    );
    await connection.execute(
      'DELETE FROM academic_sections WHERE id = ? AND owner_user_id = ?',
      [id, userId],
    );
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// List all configurations for owner
exports.getAllConfigs = async (userId, filters = {}) => {
  let query = 'SELECT * FROM academic_configurations WHERE owner_user_id = ?';
  const params = [userId];

  if (filters.academicYear) {
    query += ' AND academic_year = ?';
    params.push(filters.academicYear);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.search) {
    query += ' AND (class_name LIKE ? OR sub_category LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  query += ' ORDER BY academic_year DESC, class_name ASC';

  const [rows] = await pool.execute(query, params);
  return rows.map(mapRowToConfig);
};

// Find single config by ID
exports.getConfigById = async (userId, id) => {
  const [rows] = await pool.execute(
    'SELECT * FROM academic_configurations WHERE id = ? AND owner_user_id = ?',
    [id, userId]
  );
  return rows[0] ? mapRowToConfig(rows[0]) : null;
};

exports.hasStudents = async (userId, id) => {
  const [rows] = await pool.execute(
    `SELECT 1 FROM students
     WHERE owner_user_id = ? AND academic_configuration_id = ?
     LIMIT 1`,
    [userId, id],
  );
  return rows.length > 0;
};

exports.getConfigsByYearClassPairs = async (userId, pairs) => {
  if (pairs.length === 0) return [];
  const pairPlaceholders = pairs.map(() => '(?, ?)').join(', ');
  const pairValues = pairs.flatMap(({ academicYear, className }) => [academicYear, className]);
  const [rows] = await pool.execute(
    `SELECT * FROM academic_configurations
     WHERE owner_user_id = ? AND (academic_year, class_name) IN (${pairPlaceholders})`,
    [userId, ...pairValues],
  );
  return rows.map(mapRowToConfig);
};

// Create new configuration
exports.createConfig = async (userId, data) => {
  const sectionsJson = JSON.stringify(data.sections || []);
  const [result] = await pool.execute(
    `INSERT INTO academic_configurations (owner_user_id, academic_year, class_name, sub_category, status, sections)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.academicYear,
      data.className,
      data.subCategory || 'General',
      data.status || 'Active',
      sectionsJson,
    ]
  );

  const [rows] = await pool.execute(
    'SELECT * FROM academic_configurations WHERE id = ? AND owner_user_id = ?',
    [result.insertId, userId]
  );
  return mapRowToConfig(rows[0]);
};

// Update configuration
exports.updateConfig = async (userId, id, data) => {
  const fields = [];
  const params = [];

  if (data.academicYear !== undefined) {
    fields.push('academic_year = ?');
    params.push(data.academicYear);
  }
  if (data.className !== undefined) {
    fields.push('class_name = ?');
    params.push(data.className);
  }
  if (data.subCategory !== undefined) {
    fields.push('sub_category = ?');
    params.push(data.subCategory);
  }
  if (data.status !== undefined) {
    fields.push('status = ?');
    params.push(data.status);
  }
  if (data.sections !== undefined) {
    fields.push('sections = ?');
    params.push(JSON.stringify(data.sections));
  }

  if (fields.length === 0) return exports.getConfigById(userId, id);

  params.push(id, userId);
  const sql = `UPDATE academic_configurations SET ${fields.join(', ')} WHERE id = ? AND owner_user_id = ?`;
  const [result] = await pool.execute(sql, params);
  if (!result.affectedRows) return null;

  return exports.getConfigById(userId, id);
};

exports.updateConfigSections = async (userId, id, expectedSections, sections) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [configRows] = await connection.execute(
      'SELECT sections FROM academic_configurations WHERE id = ? AND owner_user_id = ? FOR UPDATE',
      [id, userId],
    );
    if (!configRows[0]) {
      await connection.rollback();
      return null;
    }

    const currentSections = typeof configRows[0].sections === 'string'
      ? JSON.parse(configRows[0].sections)
      : (configRows[0].sections || []);
    if (JSON.stringify(currentSections) !== JSON.stringify(expectedSections)) {
      const error = new Error('Sections have changed. Refresh the configuration and try again.');
      error.statusCode = 409;
      throw error;
    }
    if (sections.length > 0) {
      const placeholders = sections.map(() => '?').join(', ');
      const [sectionRows] = await connection.execute(
        `SELECT name FROM academic_sections
         WHERE owner_user_id = ? AND name IN (${placeholders})`,
        [userId, ...sections],
      );
      if (sectionRows.length !== sections.length) {
        const error = new Error('One or more selected sections are not available to this account.');
        error.statusCode = 400;
        throw error;
      }
    }

    const removedSections = currentSections.filter((section) => !sections.includes(section));
    if (removedSections.length > 0) {
      const placeholders = removedSections.map(() => '?').join(', ');
      await connection.execute(
        `DELETE FROM academic_student_section_allocations
         WHERE owner_user_id = ? AND academic_configuration_id = ? AND section_name IN (${placeholders})`,
        [userId, id, ...removedSections],
      );
      await connection.execute(
        `DELETE FROM academic_subject_allocations
         WHERE owner_user_id = ? AND academic_configuration_id = ? AND section_name IN (${placeholders})`,
        [userId, id, ...removedSections],
      );
    }

    await connection.execute(
      'UPDATE academic_configurations SET sections = ? WHERE id = ? AND owner_user_id = ?',
      [JSON.stringify(sections), id, userId],
    );
    const [updatedRows] = await connection.execute(
      'SELECT * FROM academic_configurations WHERE id = ? AND owner_user_id = ?',
      [id, userId],
    );
    await connection.commit();
    return updatedRows[0] ? mapRowToConfig(updatedRows[0]) : null;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Delete configuration
exports.deleteConfig = async (userId, id) => {
  const [result] = await pool.execute(
    'DELETE FROM academic_configurations WHERE id = ? AND owner_user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

// Subject Master methods
exports.getAllSubjects = async (userId) => {
  const [rows] = await pool.execute(
    'SELECT * FROM subject_master WHERE owner_user_id = ? ORDER BY code ASC',
    [userId]
  );
  return rows.map(mapRowToSubject);
};

exports.createSubject = async (userId, data) => {
  const [result] = await pool.execute(
    `INSERT INTO subject_master (owner_user_id, code, name, type, status, description)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.code.toUpperCase(),
      data.name,
      data.type || 'Core',
      data.status || 'Active',
      data.description || null,
    ]
  );

  const [rows] = await pool.execute(
    'SELECT * FROM subject_master WHERE id = ? AND owner_user_id = ?',
    [result.insertId, userId]
  );
  return mapRowToSubject(rows[0]);
};

exports.updateSubject = async (userId, id, data) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [currentRows] = await connection.execute(
      'SELECT code FROM subject_master WHERE id = ? AND owner_user_id = ? FOR UPDATE',
      [id, userId],
    );
    const current = currentRows[0];
    if (!current) {
      await connection.rollback();
      return null;
    }

    const code = data.code.toUpperCase();
    await connection.execute(
      `UPDATE subject_master
       SET code = ?, name = ?, type = ?, status = ?, description = ?
       WHERE id = ? AND owner_user_id = ?`,
      [code, data.name, data.type, data.status, data.description || null, id, userId],
    );
    await connection.execute(
      `UPDATE academic_subject_allocations
       SET subject_code = ?, subject_name = ?, subject_type = ?
       WHERE owner_user_id = ? AND subject_code = ?`,
      [code, data.name, data.type, userId, current.code],
    );

    const [updatedRows] = await connection.execute(
      'SELECT * FROM subject_master WHERE id = ? AND owner_user_id = ?',
      [id, userId],
    );
    if (!updatedRows[0]) throw new Error('Unable to retrieve the updated subject.');
    await connection.commit();
    return mapRowToSubject(updatedRows[0]);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.createSubjects = async (userId, subjects) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const createdIds = [];
    for (const subject of subjects) {
      const [result] = await connection.execute(
        `INSERT INTO subject_master (owner_user_id, code, name, type, status, description)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          subject.code.toUpperCase(),
          subject.name,
          subject.type || 'Core',
          subject.status || 'Active',
          subject.description || null,
        ]
      );
      createdIds.push(result.insertId);
    }

    const placeholders = createdIds.map(() => '?').join(', ');
    const [rows] = await connection.execute(
      `SELECT * FROM subject_master WHERE owner_user_id = ? AND id IN (${placeholders})`,
      [userId, ...createdIds]
    );
    const rowsById = new Map(rows.map((row) => [String(row.id), row]));
    const createdRows = createdIds.map((id) => rowsById.get(String(id)));
    if (createdRows.some((row) => !row)) {
      throw new Error('Unable to retrieve all created subject records.');
    }
    await connection.commit();
    return createdRows.map(mapRowToSubject);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.deleteSubject = async (userId, id) => {
  const [result] = await pool.execute(
    'DELETE FROM subject_master WHERE id = ? AND owner_user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
};

exports.getConfigAllocations = async (userId, configId) => {
  const [studentRows] = await pool.execute(
    `SELECT student_id, section_name
     FROM academic_student_section_allocations
     WHERE owner_user_id = ? AND academic_configuration_id = ?`,
    [userId, configId]
  );
  const [subjectRows] = await pool.execute(
    `SELECT id, section_name, subject_code, subject_name, subject_type, credits, faculty
     FROM academic_subject_allocations
     WHERE owner_user_id = ? AND academic_configuration_id = ?
     ORDER BY id ASC`,
    [userId, configId]
  );

  const studentSections = Object.fromEntries(
    studentRows.map((row) => [String(row.student_id), row.section_name])
  );
  const sectionSubjects = {};
  subjectRows.forEach((row) => {
    const key = `${configId}_${row.section_name}`;
    if (!sectionSubjects[key]) sectionSubjects[key] = [];
    sectionSubjects[key].push({
      id: String(row.id),
      code: row.subject_code,
      name: row.subject_name,
      type: row.subject_type,
      credits: row.credits,
      faculty: row.faculty || '',
    });
  });

  return { studentSections, sectionSubjects };
};

exports.getOwnedStudentAllocations = async (userId, studentIds) => {
  if (studentIds.length === 0) return [];
  const placeholders = studentIds.map(() => '?').join(', ');
  const [rows] = await pool.execute(
    `SELECT id, academic_year, department
     FROM students
     WHERE owner_user_id = ? AND deleted_at IS NULL AND id IN (${placeholders})`,
    [userId, ...studentIds]
  );
  return rows;
};

exports.replaceConfigAllocations = async (userId, configId, allocations) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [configRows] = await connection.execute(
      'SELECT sections FROM academic_configurations WHERE owner_user_id = ? AND id = ? FOR UPDATE',
      [userId, configId],
    );
    if (!configRows[0]) {
      const error = new Error('Academic configuration not found.');
      error.statusCode = 404;
      throw error;
    }
    const validSections = new Set(
      typeof configRows[0].sections === 'string'
        ? JSON.parse(configRows[0].sections)
        : (configRows[0].sections || []),
    );
    if (Object.values(allocations.studentSections).some((section) => !validSections.has(section))) {
      const error = new Error('Student allocations must target a section in this academic configuration.');
      error.statusCode = 400;
      throw error;
    }
    const sectionPrefix = `${configId}_`;
    if (Object.keys(allocations.sectionSubjects).some((key) =>
      !key.startsWith(sectionPrefix) || !validSections.has(key.slice(sectionPrefix.length)))) {
      const error = new Error('Subject allocations must target a section in this academic configuration.');
      error.statusCode = 400;
      throw error;
    }

    await connection.execute(
      'DELETE FROM academic_student_section_allocations WHERE owner_user_id = ? AND academic_configuration_id = ?',
      [userId, configId]
    );
    await connection.execute(
      'DELETE FROM academic_subject_allocations WHERE owner_user_id = ? AND academic_configuration_id = ?',
      [userId, configId]
    );

    for (const [studentId, sectionName] of Object.entries(allocations.studentSections)) {
      await connection.execute(
        `INSERT INTO academic_student_section_allocations
          (owner_user_id, academic_configuration_id, student_id, section_name)
         VALUES (?, ?, ?, ?)`,
        [userId, configId, studentId, sectionName]
      );
    }

    for (const [sectionKey, subjects] of Object.entries(allocations.sectionSubjects)) {
      const sectionName = sectionKey.slice(sectionPrefix.length);
      for (const subject of subjects) {
        await connection.execute(
          `INSERT INTO academic_subject_allocations
            (owner_user_id, academic_configuration_id, section_name, subject_code, subject_name, subject_type, credits, faculty)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            configId,
            sectionName,
            subject.code.toUpperCase(),
            subject.name,
            subject.type,
            subject.credits,
            subject.faculty || null,
          ]
        );
      }
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  return exports.getConfigAllocations(userId, configId);
};
