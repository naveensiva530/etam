UPDATE academic_configurations
SET sections = JSON_ARRAY()
WHERE JSON_LENGTH(sections) = 2
  AND JSON_CONTAINS(sections, JSON_ARRAY('Section A', 'Section B'));
