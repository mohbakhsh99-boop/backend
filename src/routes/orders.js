const express = require('express');
const router = express.Router();

const {
  createOrder,
  myHistory,
  getOrder,
  activeOrders,
  updateStatus,
  rateOrder,
} = require('../controllers/ordersController');

/**
 * =========================
 * Orders Routes
 * =========================
 */

// Create new order
router.post('/', createOrder);

// User order history
router.get('/my-history', myHistory);

// Active orders (for staff / kitchen)
router.get('/active', activeOrders);

// Get single order by ID
router.get('/:id', getOrder);

// Update order status
router.put('/:id/status', updateStatus);

// Rate completed order
router.put('/:id/rating', rateOrder);

module.exports = router;
