const express = require('express');
const studentsController = require('./students.controller');
const validation = require('./students.validation');
const requireAuth = require('../../middlewares/require-auth');

const router = express.Router();

// Auth is applied at the top-level routes.js — no need to repeat here

// ── Active students ───────────────────────────────────────────────────────────
router.get('/',     validation.validateList,   studentsController.list);
router.post('/',    validation.validateCreate, studentsController.create);
router.post('/bulk',validation.validateBulk,   studentsController.createBulk);
router.put('/:id',  validation.validateId, validation.validateCreate, studentsController.update);
router.delete('/:id', validation.validateId,   studentsController.remove);       // → soft-delete

// ── Recycle bin ───────────────────────────────────────────────────────────────
router.get('/archived',           validation.validateList, studentsController.listArchived);
router.post('/:id/restore',       validation.validateId,   studentsController.restore);
router.delete('/:id/purge',       validation.validateId,   studentsController.purge);  // hard-delete

module.exports = router;