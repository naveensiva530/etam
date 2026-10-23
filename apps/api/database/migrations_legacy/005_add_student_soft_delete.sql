ALTER TABLE students
  ADD COLUMN deleted_at DATETIME NULL DEFAULT NULL AFTER status,
  ADD INDEX idx_students_owner_institution_active (owner_user_id, institution, deleted_at, created_at);
