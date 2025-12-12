const express = require('express');
const {
  createOrder,
  myHistory,
  getOrder,
  activeOrders,
  updateStatus,
  rateOrder
} = require('../controllers/ordersController');

const router = express.Router();

/*
====================================
 ORDERS ROUTES (UNPROTECTED - DEV MODE)
====================================
*/

// Create new order
router.post('/orders', createOrder);

// Get my orders history (frontend يعتمد عليها)
router.get('/orders/my-history', myHistory);

// Get single order by ID
router.get('/orders/:id', getOrder);

// Get active orders (dashboard)
router.get('/orders/active', activeOrders);

// Update order status
router.put('/orders/:id/status', updateStatus);

// Rate order
router.put('/orders/:id/rating', rateOrder);

module.exports = router;
