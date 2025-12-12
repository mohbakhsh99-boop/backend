const express = require('express');
const {
  listUsers,
  createStaff,
  updateUser,
  updateProfile
} = require('../controllers/usersController');

const router = express.Router();

/**
 * USERS / STAFF (No auth - university project)
 */

// =========================
// Admin / Staff
// =========================

// List all users
router.get('/users', listUsers);

// Create staff/user (employee/admin)
router.post('/users', createStaff);

// Update user by admin (role, is_active, email, password)
// =========================
// Customer Profile (✔️ يجب أن يكون قبل :id)
// =========================
router.put('/users/profile', updateProfile);

// =========================
// Admin
// =========================
router.put('/users/:id', updateUser);


module.exports = router;
