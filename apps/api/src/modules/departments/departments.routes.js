const express = require('express');
const departmentsController = require('./departments.controller');
const validation = require('./departments.validation');

const router = express.Router();

// Auth is applied at the top-level routes.js — no need to repeat here
router.get('/', validation.validateList, departmentsController.list);
router.post('/', validation.validateCreate, departmentsController.create);
router.put('/:id', validation.validateId, validation.validateUpdate, departmentsController.update);
router.delete('/:id', validation.validateId, departmentsController.remove);

module.exports = router;
