const { query } = require('../db');

async function listTables(req, res) {
  const result = await query('SELECT * FROM tables ORDER BY id');
  return res.json(result.rows);
}

async function updateTable(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  const result = await query('UPDATE tables SET status=$1 WHERE id=$2 RETURNING *', [status, id]);
  if (!result.rows.length) return res.status(404).json({ message: 'Table not found' });
  return res.json(result.rows[0]);
}

module.exports = { listTables, updateTable };
