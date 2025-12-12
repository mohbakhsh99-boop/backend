const express = require('express');
const {
  listCategories,
  createCategory,
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
router.post('/categories', createCategory); // 👈 أضفناه

/* =========================
   Products
========================= */
router.get('/products', listProducts);
router.get('/products/:id', getProduct);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

module.exports = router;
