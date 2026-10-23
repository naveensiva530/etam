ALTER TABLE students
  DROP INDEX uq_students_institution_admission,
  DROP INDEX uq_students_institution_student_id,
  ADD COLUMN owner_user_id INT NULL AFTER id,
  ADD UNIQUE KEY uq_students_owner_institution_admission (owner_user_id, institution, admission_id),
  ADD UNIQUE KEY uq_students_owner_institution_student_id (owner_user_id, institution, student_id),
  ADD KEY idx_students_owner_institution_created (owner_user_id, institution, created_at),
  ADD CONSTRAINT fk_students_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE;
