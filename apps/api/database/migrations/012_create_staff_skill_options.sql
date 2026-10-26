CREATE TABLE IF NOT EXISTS staff_skill_options (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  owner_user_id INT NOT NULL,
  institution ENUM('School', 'College', 'Training') NOT NULL,
  skills JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_staff_skill_options_owner_institution (owner_user_id, institution),
  CONSTRAINT fk_staff_skill_options_owner_user
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
