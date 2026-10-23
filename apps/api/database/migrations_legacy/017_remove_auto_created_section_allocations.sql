DELETE student_allocation
FROM academic_student_section_allocations AS student_allocation
JOIN academic_configurations AS config
  ON config.id = student_allocation.academic_configuration_id
WHERE JSON_LENGTH(config.sections) = 2
  AND JSON_CONTAINS(config.sections, JSON_ARRAY('Section A', 'Section B'));
