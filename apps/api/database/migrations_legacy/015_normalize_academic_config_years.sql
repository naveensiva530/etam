UPDATE academic_configurations
SET academic_year = CONCAT(
  LEFT(academic_year, 4),
  '-',
  CAST(CAST(LEFT(academic_year, 4) AS UNSIGNED) + 1 AS CHAR)
)
WHERE academic_year REGEXP '^[0-9]{4}-[0-9]{2}$';
