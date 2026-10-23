const studentsRepository = require('./students.repository');
const academicConfigRepository = require('../academic-config/academic-config.repository');

const pairKey = (academicYear, className) =>
  `${academicYear.trim().toLowerCase()}\u0000${className.trim().toLowerCase()}`;

const resolveAcademicConfigurations = async (
  userId,
  students,
  { requireActive, allowUnconfigured = false },
) => {
  const uniquePairs = Array.from(new Map(students.map((student) => {
    const key = pairKey(student.academicYear, student.department);
    return [key, { academicYear: student.academicYear, className: student.department }];
  })).values());
  const configurations = await academicConfigRepository.getConfigsByYearClassPairs(userId, uniquePairs);
  const byPair = new Map(configurations.map((configuration) => [
    pairKey(configuration.academicYear, configuration.className),
    configuration,
  ]));

  return students.map((student) => {
    const configuration = byPair.get(pairKey(student.academicYear, student.department));
    if (!configuration) {
      if (allowUnconfigured) {
        return { ...student, academicConfigurationId: null };
      }
      const error = new Error(
        `No academic configuration exists for ${student.department} (${student.academicYear}) in this account.`,
      );
      error.statusCode = 400;
      throw error;
    }
    if (requireActive && configuration.status !== 'Active') {
      const error = new Error('New students can only be enrolled in an active academic configuration.');
      error.statusCode = 400;
      throw error;
    }

    const configuredSubCategory = configuration.subCategory || 'General';
    if (
      student.subcategory &&
      student.subcategory.trim().toLowerCase() !== configuredSubCategory.trim().toLowerCase()
    ) {
      const error = new Error('The student sub-category does not match the selected academic configuration.');
      error.statusCode = 400;
      throw error;
    }

    return {
      ...student,
      academicConfigurationId: configuration.id,
      subcategory: student.subcategory || configuredSubCategory,
    };
  });
};

// ── List active students (pagination + search) ────────────────────────────────
exports.getStudents = (userId, institution, options) =>
  studentsRepository.getAll(userId, institution, options);

// ── Create one student ────────────────────────────────────────────────────────
exports.createStudent = async (userId, student) => {
  const [resolvedStudent] = await resolveAcademicConfigurations(userId, [student], {
    requireActive: true,
  });
  return studentsRepository.create(userId, resolvedStudent);
};

// ── Bulk create ───────────────────────────────────────────────────────────────
exports.createStudents = async (userId, students) => {
  const resolvedStudents = await resolveAcademicConfigurations(userId, students, {
    requireActive: true,
  });
  return studentsRepository.createMany(userId, resolvedStudents);
};

// ── Update one student ────────────────────────────────────────────────────────
exports.updateStudent = async (userId, id, student) => {
  const existing = await studentsRepository.getById(userId, id);
  if (!existing) {
    const error = new Error('Student record was not found.');
    error.statusCode = 404;
    throw error;
  }
  const unchangedUnconfiguredPair =
    !existing.academicConfigurationId &&
    existing.academicYear === student.academicYear &&
    existing.department === student.department;
  const [resolvedStudent] = await resolveAcademicConfigurations(userId, [student], {
    requireActive: false,
    allowUnconfigured: unchangedUnconfiguredPair,
  });
  if (!resolvedStudent.academicConfigurationId && !resolvedStudent.subcategory) {
    resolvedStudent.subcategory = existing.subcategory;
  }
  const updated = await studentsRepository.update(userId, id, resolvedStudent);
  if (!updated) {
    const error = new Error('Student record was not found.');
    error.statusCode = 404;
    throw error;
  }
  return updated;
};

// ── Soft-delete → recycle bin ─────────────────────────────────────────────────
exports.deleteStudent = async (userId, id) => {
  const deleted = await studentsRepository.softDelete(userId, id);
  if (!deleted) {
    const error = new Error('Student record was not found.');
    error.statusCode = 404;
    throw error;
  }
};

// ── Recycle bin — list archived students ──────────────────────────────────────
exports.getArchivedStudents = (userId, institution, options) =>
  studentsRepository.getArchived(userId, institution, options);

// ── Restore a student from the recycle bin ────────────────────────────────────
exports.restoreStudent = async (userId, id) => {
  const restored = await studentsRepository.restore(userId, id);
  if (!restored) {
    const error = new Error('Archived student record was not found.');
    error.statusCode = 404;
    throw error;
  }
  return restored;
};

// ── Hard-delete (permanent purge from recycle bin) ────────────────────────────
exports.purgeStudent = async (userId, id) => {
  const purged = await studentsRepository.hardDelete(userId, id);
  if (!purged) {
    const error = new Error('Student record was not found.');
    error.statusCode = 404;
    throw error;
  }
};