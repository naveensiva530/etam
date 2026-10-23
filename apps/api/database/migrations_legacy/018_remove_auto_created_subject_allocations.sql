DELETE subject_allocation
FROM academic_subject_allocations AS subject_allocation
JOIN academic_configurations AS config
  ON config.id = subject_allocation.academic_configuration_id
WHERE JSON_LENGTH(config.sections) = 2
  AND JSON_CONTAINS(config.sections, JSON_ARRAY('Section A', 'Section B'));
