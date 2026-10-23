CREATE TABLE IF NOT EXISTS academic_student_section_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  academic_configuration_id BIGINT UNSIGNED NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_section_assignment (owner_user_id, academic_configuration_id, student_id),
  KEY idx_student_section_config (owner_user_id, academic_configuration_id),
  CONSTRAINT fk_student_section_config
    FOREIGN KEY (academic_configuration_id) REFERENCES academic_configurations (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS academic_subject_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  academic_configuration_id BIGINT UNSIGNED NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  subject_name VARCHAR(150) NOT NULL,
  subject_type ENUM('Core', 'Elective', 'Practical') NOT NULL DEFAULT 'Core',
  credits SMALLINT UNSIGNED NOT NULL DEFAULT 3,
  faculty VARCHAR(150) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_section_subject_allocation (owner_user_id, academic_configuration_id, section_name, subject_code),
  KEY idx_subject_allocation_config (owner_user_id, academic_configuration_id),
  CONSTRAINT fk_subject_allocation_config
    FOREIGN KEY (academic_configuration_id) REFERENCES academic_configurations (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
