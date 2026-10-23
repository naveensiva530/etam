CREATE TABLE IF NOT EXISTS staff (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NULL,
  staff_id VARCHAR(64) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(100) NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  department VARCHAR(150) NOT NULL,
  qualification VARCHAR(150) NOT NULL,
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
