const express = require('express');
const {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/menuController');

const router = express.Router();

/* =========================
   Categories
========================= */
router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);     // ✅ كان ناقص
router.delete('/categories/:id', deleteCategory);  // ✅ كان ناقص

/* =========================
   Products
========================= */
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
