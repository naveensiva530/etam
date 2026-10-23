INSERT IGNORE INTO academic_sections (owner_user_id, name)
SELECT configurations.owner_user_id, section_values.section_name
FROM academic_configurations AS configurations
JOIN JSON_TABLE(
  configurations.sections,
  '$[*]' COLUMNS (section_name VARCHAR(100) PATH '$')
) AS section_values
WHERE configurations.owner_user_id IS NOT NULL
  AND section_values.section_name IS NOT NULL
  AND TRIM(section_values.section_name) <> '';
