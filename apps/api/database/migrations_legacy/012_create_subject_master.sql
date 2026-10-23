CREATE TABLE IF NOT EXISTS subject_master (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id BIGINT UNSIGNED NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('Core', 'Elective', 'Practical') NOT NULL DEFAULT 'Core',
  status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  description TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subject_master_owner (owner_user_id),
  UNIQUE KEY uq_subject_code_owner (owner_user_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
