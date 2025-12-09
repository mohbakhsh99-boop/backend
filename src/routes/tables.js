const express = require('express');
const { listTables, updateTable } = require('../controllers/tablesController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/tables', authMiddleware, roleMiddleware(['employee', 'admin']), listTables);
router.put('/tables/:id', authMiddleware, roleMiddleware(['employee', 'admin']), updateTable);

module.exports = router;
