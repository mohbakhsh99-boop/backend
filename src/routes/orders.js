const express = require('express');
const {
  createOrder,
  myHistory,
  getOrder,
  activeOrders,
  updateStatus,
  rateOrder,
  listOrders,
  // استيراد الدوال الجديدة
  getAllOrderItems,
  getAllProductExtras
} = require('../controllers/ordersController');

const router = express.Router();

// CREATE ORDER
router.post('/orders', createOrder);

// LIST ALL ORDERS
router.get('/orders', listOrders);

// ✅ ADD MISSING ROUTES HERE (To fix 404 errors)
router.get('/order_items', getAllOrderItems);       // Fixes: /api/order_items 404
router.get('/product_extras', getAllProductExtras); // Fixes: /api/product_extras 404

// USER HISTORY
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
