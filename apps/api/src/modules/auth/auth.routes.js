const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const validation = require('./auth.validation');

router.post('/login', validation.validateLogin, authController.login);
router.post('/register', validation.validateRegister, authController.register);

module.exports = router;
