const express = require('express');
const router = express.Router();
const timetableController = require('./timetable.controller');

router.get('/departments', timetableController.getDepartments);
router.get('/options', timetableController.getOptions);
router.get('/config/academic/:academicConfigId', timetableController.getByAcademicConfigId);
router.get('/config/:id', timetableController.getById);
router.post('/config', timetableController.save);
router.delete('/config/:id', timetableController.remove);

module.exports = router;
