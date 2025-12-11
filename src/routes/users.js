const express = require('express');
const { listUsers, createStaff, updateUser } = require('../controllers/usersController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/users', listUsers);
router.post('/users', createStaff);
router.put('/users/:id', updateUser);


module.exports = router;
