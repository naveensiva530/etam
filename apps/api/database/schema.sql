-- ==============================================================================
-- E-tam Consolidated Production Database Schema
-- ==============================================================================

-- 1. Users table (with Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'staff', 'student') NOT NULL DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 2. Departments / Academic units
CREATE TABLE IF NOT EXISTS departments (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  name VARCHAR(150) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_departments_owner_institution_name (owner_user_id, institution, name),
  KEY idx_departments_owner_institution (owner_user_id, institution),
  CONSTRAINT fk_departments_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 3. Academic configurations (Class + Year + Sections master)
CREATE TABLE IF NOT EXISTS academic_configurations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  academic_year VARCHAR(30) NOT NULL,
  class_name VARCHAR(150) NOT NULL,
  sub_category VARCHAR(100) NOT NULL DEFAULT 'General',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  sections JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_academic_config_owner (owner_user_id),
  UNIQUE KEY uq_academic_config_year_class (owner_user_id, academic_year, class_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 4. Academic section catalog (scoped per owner)
CREATE TABLE IF NOT EXISTS academic_sections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_academic_sections_owner_name (owner_user_id, name),
  CONSTRAINT fk_academic_sections_owner
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Subject types (scoped per owner)
CREATE TABLE IF NOT EXISTS subject_types (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subject_types_owner_name (owner_user_id, name),
  CONSTRAINT fk_subject_types_owner
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 5. Subject Master catalog
CREATE TABLE IF NOT EXISTS subject_master (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'Core',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subject_master_owner (owner_user_id),
  UNIQUE KEY uq_subject_code_owner (owner_user_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 6. Students table (full production schema)
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

-- 7. Staff table (full production schema)
CREATE TABLE IF NOT EXISTS staff (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NULL,
  staff_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  staff_type ENUM('Teaching', 'Non-Teaching', 'Other') NULL,
  department VARCHAR(150) NULL,
  qualification VARCHAR(150) NOT NULL,
  photo_url MEDIUMTEXT NULL,
  email VARCHAR(150) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  date_of_joining DATE NOT NULL,
  blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL,
  status ENUM('Active', 'Probation', 'Archived') NOT NULL DEFAULT 'Active',
  deleted_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_owner_institution_staff_id (owner_user_id, institution, staff_id),
  KEY idx_staff_owner_institution_active (owner_user_id, institution, deleted_at, created_at),
  CONSTRAINT fk_staff_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 8. Staff role options (custom roles per institution)
CREATE TABLE IF NOT EXISTS staff_role_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  roles JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_role_options_owner_institution (owner_user_id, institution),
  CONSTRAINT fk_staff_role_options_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 9. Academic student section allocations
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

-- 10. Academic subject allocations
CREATE TABLE IF NOT EXISTS academic_subject_allocations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  academic_configuration_id BIGINT UNSIGNED NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  subject_code VARCHAR(50) NOT NULL,
  subject_name VARCHAR(150) NOT NULL,
  subject_type VARCHAR(50) NOT NULL DEFAULT 'Core',
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
