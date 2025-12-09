const bcrypt = require('bcryptjs');
const { query } = require('../db');

async function listUsers(req, res) {
  const users = await query('SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC');
  return res.json(users.rows);
}

async function createStaff(req, res) {
  const { name, email, password, role = 'employee' } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const result = await query('INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role', [
    name,
    email,
    hash,
    role,
  ]);
  return res.status(201).json(result.rows[0]);
}

async function updateUser(req, res) {
  const { id } = req.params;
  const { is_active, role } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;
  if (is_active !== undefined) { fields.push(`is_active=$${idx++}`); values.push(is_active); }
  if (role) { fields.push(`role=$${idx++}`); values.push(role); }
  if (!fields.length) return res.json({ message: 'Nothing to update' });
  values.push(id);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, name, email, role, is_active`;
  const result = await query(sql, values);
  if (!result.rows.length) return res.status(404).json({ message: 'User not found' });
  return res.json(result.rows[0]);
}

module.exports = { listUsers, createStaff, updateUser };
