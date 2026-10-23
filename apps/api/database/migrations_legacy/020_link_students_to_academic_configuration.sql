ALTER TABLE students
  ADD COLUMN academic_configuration_id BIGINT UNSIGNED NULL AFTER academic_year,
  ADD KEY idx_students_academic_configuration (academic_configuration_id),
  ADD CONSTRAINT fk_students_academic_configuration
    FOREIGN KEY (academic_configuration_id) REFERENCES academic_configurations (id)
    ON DELETE RESTRICT;
