CREATE TABLE IF NOT EXISTS timetable_configurations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  academic_configuration_id BIGINT UNSIGNED NOT NULL,
  department_name VARCHAR(150) NOT NULL,
  academic_year VARCHAR(30) NOT NULL,
  category VARCHAR(100) NOT NULL,
  sub_category VARCHAR(100) NOT NULL,
  shift VARCHAR(50) NOT NULL DEFAULT 'Morning',
  total_periods INT NOT NULL DEFAULT 8,
  period_duration_minutes INT NOT NULL DEFAULT 30,
  start_time VARCHAR(20) NOT NULL DEFAULT '09:30 AM',
  class_teacher_id VARCHAR(64) NULL,
  class_teacher_name VARCHAR(150) NULL,
  breaks_config JSON NOT NULL,
  status ENUM('Created', 'Not Created') NOT NULL DEFAULT 'Created',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_timetable_config_sec (owner_user_id, academic_configuration_id, sub_category),
  KEY idx_timetable_owner_inst (owner_user_id, institution),
  CONSTRAINT fk_timetable_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_timetable_academic_config
    FOREIGN KEY (academic_configuration_id) REFERENCES academic_configurations (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS timetable_period_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  timetable_configuration_id BIGINT UNSIGNED NOT NULL,
  day_of_week ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday') NOT NULL,
  period_number INT NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  subject_code VARCHAR(50) NULL,
  subject_name VARCHAR(150) NOT NULL,
  teacher_id VARCHAR(64) NULL,
  teacher_name VARCHAR(150) NOT NULL,
  teacher_avatar MEDIUMTEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_timetable_slot (timetable_configuration_id, day_of_week, period_number),
  KEY idx_period_alloc_config (timetable_configuration_id),
  KEY idx_period_alloc_teacher (owner_user_id, teacher_id),
  CONSTRAINT fk_period_timetable_config
    FOREIGN KEY (timetable_configuration_id) REFERENCES timetable_configurations (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
