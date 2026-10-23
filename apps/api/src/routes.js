const express = require('express');
const router = express.Router();
const requireAuth = require('./middlewares/require-auth');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const studentsRoutes = require('./modules/students/students.routes');
const staffRoutes = require('./modules/staff/staff.routes');
const departmentsRoutes = require('./modules/departments/departments.routes');
const academicConfigRoutes = require('./modules/academic-config/academic-config.routes');
const timetableRoutes = require('./modules/timetable/timetable.routes');

router.use('/auth', authRoutes);
router.use('/users', requireAuth, usersRoutes);
router.use('/students', requireAuth, studentsRoutes);
router.use('/staff', requireAuth, staffRoutes);
router.use('/departments', requireAuth, departmentsRoutes);
router.use('/academic-configurations', requireAuth, academicConfigRoutes);
router.use('/timetable', requireAuth, timetableRoutes);

module.exports = router;
