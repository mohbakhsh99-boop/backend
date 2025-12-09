const express = require('express');
const { listUsers, createStaff, updateUser } = require('../controllers/usersController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authMiddleware, roleMiddleware(['admin']), listUsers);
router.post('/users', authMiddleware, roleMiddleware(['admin']), createStaff);
router.put('/users/:id', authMiddleware, roleMiddleware(['admin']), updateUser);

module.exports = router;
