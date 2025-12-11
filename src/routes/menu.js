const express = require('express');
const { listCategories, listProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/menuController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/categories', listCategories);
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id',updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
