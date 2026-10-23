ALTER TABLE staff
  MODIFY COLUMN department VARCHAR(150) NULL,
  ADD COLUMN staff_type ENUM('Teaching', 'Non-Teaching', 'Other') NULL AFTER institution;
