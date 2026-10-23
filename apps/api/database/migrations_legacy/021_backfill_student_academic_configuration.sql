UPDATE students AS student
JOIN academic_configurations AS configuration
  ON configuration.owner_user_id = student.owner_user_id
  AND configuration.academic_year = student.academic_year
  AND configuration.class_name = student.department
SET student.academic_configuration_id = configuration.id
WHERE student.academic_configuration_id IS NULL;
