const express = require('express');
const { listUsers, createStaff, updateUser } = require('../controllers/usersController');

const router = express.Router();

/**
 * USERS / STAFF (No auth - university project)
 */

// List all users
router.get('/users', listUsers);

// Create staff/user (employee/admin)
router.post('/users', createStaff);

// Update user (role, is_active)
router.put('/users/:id', updateUser);

module.exports = router;
