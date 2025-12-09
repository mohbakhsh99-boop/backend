const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { createOrder, myHistory, getOrder, activeOrders, updateStatus, rateOrder } = require('../controllers/ordersController');

const router = express.Router();

router.post('/orders', authMiddleware, createOrder);
router.get('/orders/my-history', authMiddleware, roleMiddleware(['customer']), myHistory);
router.get('/orders/:id', authMiddleware, getOrder);
router.get('/orders/active', authMiddleware, roleMiddleware(['employee', 'admin']), activeOrders);
router.put('/orders/:id/status', authMiddleware, roleMiddleware(['employee', 'admin']), updateStatus);
router.put('/orders/:id/rating', authMiddleware, roleMiddleware(['customer']), rateOrder);

module.exports = router;
