CREATE TABLE IF NOT EXISTS students (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NULL,
  admission_id VARCHAR(64) NOT NULL,
  student_id VARCHAR(64) NOT NULL,
  student_name VARCHAR(100) NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  department VARCHAR(150) NOT NULL,
  academic_year VARCHAR(20) NOT NULL,
  academic_configuration_id BIGINT UNSIGNED NULL,
  gender ENUM('Male', 'Female', 'Other') NOT NULL,
  photo_url MEDIUMTEXT NULL,
  date_of_joining DATE NOT NULL,
  parent_name VARCHAR(100) NULL,
  parent_mobile VARCHAR(20) NULL,
  student_mobile VARCHAR(20) NULL,
  dob DATE NULL,
  category VARCHAR(100) NULL,
  subcategory VARCHAR(100) NULL,
  additional_department VARCHAR(150) NULL,
  residence_type ENUM('Day Scholar', 'Hosteller') NULL,
  communication_address TEXT NULL,
  pin_zip VARCHAR(20) NULL,
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
  status ENUM('Active', 'Pending', 'Inactive', 'Archived') NOT NULL DEFAULT 'Active',
  deleted_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_students_owner_institution_admission (owner_user_id, institution, admission_id),
  UNIQUE KEY uq_students_owner_institution_student_id (owner_user_id, institution, student_id),
  KEY idx_students_owner_institution_active (owner_user_id, institution, deleted_at, created_at),
  KEY idx_students_academic_configuration (academic_configuration_id),
  CONSTRAINT fk_students_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_students_academic_configuration
    FOREIGN KEY (academic_configuration_id) REFERENCES academic_configurations (id)
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
