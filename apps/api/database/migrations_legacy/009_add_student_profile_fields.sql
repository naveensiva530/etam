ALTER TABLE students
  ADD COLUMN category VARCHAR(100) NULL AFTER dob,
  ADD COLUMN subcategory VARCHAR(100) NULL AFTER category,
  ADD COLUMN residence_type ENUM('Day Scholar', 'Hosteller') NULL AFTER subcategory,
  ADD COLUMN communication_address TEXT NULL AFTER residence_type,
  ADD COLUMN pin_zip VARCHAR(20) NULL AFTER communication_address,
  MODIFY COLUMN status ENUM('Active', 'Pending', 'Inactive', 'Archived') NOT NULL DEFAULT 'Active';
