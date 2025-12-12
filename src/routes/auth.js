const express = require('express');
const { register, login, refresh, me, updateProfile } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', authMiddleware, me);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;
