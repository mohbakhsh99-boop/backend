const express = require('express');
const { dashboard, revenue, products, staff } = require('../controllers/reportsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/reports/dashboard', authMiddleware, roleMiddleware(['admin']), dashboard);
router.get('/reports/revenue', authMiddleware, roleMiddleware(['admin']), revenue);
router.get('/reports/products', authMiddleware, roleMiddleware(['admin']), products);
router.get('/reports/staff', authMiddleware, roleMiddleware(['admin']), staff);

module.exports = router;
