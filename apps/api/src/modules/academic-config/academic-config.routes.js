const express = require('express');
const router = express.Router();
const controller = require('./academic-config.controller');
const {
  validateList,
  validateCreate,
  validateUpdate,
  validateId,
  validateCreateSubject,
  validateUpdateSubject,
  validateCreateSubjects,
  validateAllocations,
  validateSections,
  validateCreateSection,
  validateUpdateSection,
  validateCreateSubjectType,
  validateUpdateSubjectType,
} = require('./academic-config.validation');

// Subject Master endpoints
router.get('/subjects', controller.listSubjects);
router.post('/subjects/bulk', validateCreateSubjects, controller.createSubjects);
router.post('/subjects', validateCreateSubject, controller.createSubject);
router.put('/subjects/:id', validateId, validateUpdateSubject, controller.updateSubject);
router.delete('/subjects/:id', validateId, controller.removeSubject);

// Owner-scoped subject type catalog
router.get('/subject-types', controller.listSubjectTypes);
router.post('/subject-types', validateCreateSubjectType, controller.createSubjectType);
router.put('/subject-types/:id', validateId, validateUpdateSubjectType, controller.updateSubjectType);
router.delete('/subject-types/:id', validateId, controller.removeSubjectType);

// Owner-scoped section catalog
router.get('/sections', controller.listSections);
router.post('/sections', validateCreateSection, controller.createSection);
router.put('/sections/:id', validateId, validateUpdateSection, controller.updateSection);
router.delete('/sections/:id', validateId, controller.removeSection);

// Academic Configuration endpoints
router.get('/:id/allocations', validateId, controller.getAllocations);
router.put('/:id/allocations', validateId, validateAllocations, controller.updateAllocations);
router.put('/:id/sections', validateId, validateSections, controller.updateSections);
router.get('/', validateList, controller.list);
router.post('/', validateCreate, controller.create);
router.get('/:id', validateId, controller.getById);
router.put('/:id', validateId, validateUpdate, controller.update);
router.delete('/:id', validateId, controller.remove);

module.exports = router;
