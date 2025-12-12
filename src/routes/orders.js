const express = require('express');
const {
  createOrder,
  myHistory,
  getOrder,
  activeOrders,
  updateStatus,
  rateOrder,
  listOrders
} = require('../controllers/ordersController');

const router = express.Router();

// CREATE ORDER
router.post('/orders', createOrder);

// LIST ALL ORDERS (Admin / Staff / Debug)
router.get('/orders', listOrders);

// USER HISTORY (optional)
router.get('/orders/my-history', myHistory);

// SINGLE ORDER
router.get('/orders/:id', getOrder);

// ACTIVE ORDERS
router.get('/orders/active', activeOrders);

// UPDATE STATUS
router.put('/orders/:id/status', updateStatus);

// RATE ORDER
router.put('/orders/:id/rating', rateOrder);

module.exports = router;
