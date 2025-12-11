const express = require('express');
const { listTables, updateTable } = require('../controllers/tablesController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/tables', listTables);
router.put('/tables/:id', updateTable);

module.exports = router;
