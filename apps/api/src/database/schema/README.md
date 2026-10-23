# Database Schema & Migrations

All migrations are maintained in `apps/api/database/migrations/`.

## Active Tables:
1. `users` — Administrator and staff login accounts (`001_create_users.sql`)
2. `students` — Student records (`002_create_students.sql`, scoped via `003_scope_students_to_users.sql`, soft delete via `005_add_student_soft_delete.sql`)
3. `staff` — Faculty and staff members (Staff Type via `009_add_staff_type.sql`)
4. `departments` — Academic departments & classes per institution (`004_create_departments.sql`)
5. `staff_role_options` — Custom staff designations per institution (`008_create_staff_role_options.sql`)

## Running Migrations:
```bash
node src/database/migrate.js
```
