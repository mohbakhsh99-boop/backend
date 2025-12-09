const express = require('express');
const { listCategories, listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/menuController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', authMiddleware, roleMiddleware(['admin']), createProduct);
router.put('/products/:id', authMiddleware, roleMiddleware(['admin']), updateProduct);
router.delete('/products/:id', authMiddleware, roleMiddleware(['admin']), deleteProduct);

module.exports = router;
