const express = require('express');
const staffController = require('./staff.controller');
const validation = require('./staff.validation');

const router = express.Router();

// Auth is applied at the top-level routes.js — no need to repeat here

router.get('/roles', validation.validateRoleList, staffController.listRoles);
router.put('/roles', validation.validateRoleSave, staffController.saveRoles);

// ── Recycle bin ───────────────────────────────────────────────────────────────
router.get('/archived',     validation.validateList, staffController.listArchived);

// ── Active staff ──────────────────────────────────────────────────────────────
router.get('/',           validation.validateList,   staffController.list);
router.post('/',          validation.validateCreate, staffController.create);
router.post('/bulk',      validation.validateBulk,   staffController.createBulk);
router.get('/:id',        validation.validateId,     staffController.getById);
router.put('/:id',        validation.validateId, validation.validateCreate, staffController.update);
router.delete('/:id',     validation.validateId,     staffController.remove);       // → soft-delete
router.post('/:id/restore', validation.validateId,   staffController.restore);
router.delete('/:id/purge', validation.validateId,   staffController.purge);        // hard-delete


module.exports = router;
