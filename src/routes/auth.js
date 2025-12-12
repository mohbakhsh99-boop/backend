const express = require('express');
const { register, login, refresh } = require('../controllers/authController');

const router = express.Router();

/**
 * AUTH ROUTES (simple auth – no tokens, no middleware)
 */

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);

module.exports = router;
