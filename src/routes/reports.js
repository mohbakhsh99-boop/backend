const express = require('express');
const { dashboard, revenue, products, staff } = require('../controllers/reportsController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/reports/dashboard', dashboard);
router.get('/reports/revenue',  revenue);
router.get('/reports/products', products);
router.get('/reports/staff', staff);

module.exports = router;
