const bcrypt = require('bcryptjs');
const { query } = require('../db');

/* =========================
   List Users
========================= */
async function listUsers(req, res) {
  const users = await query(`
    SELECT id, name, email, role, is_active, created_at
    FROM users
    ORDER BY created_at DESC
  `);
  return res.json(users.rows);
}

/* =========================
   Create Staff
========================= */
async function createStaff(req, res) {
  try {
    const { name, email, password, role = 'employee' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // check email exists
    const exists = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (exists.rows.length) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1,$2,$3,$4)
      RETURNING id, name, email, role, is_active, created_at
      `,
      [name, email, hash, role]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('CREATE STAFF ERROR:', err);
    return res.status(500).json({ message: 'Failed to create staff' });
  }
}

/* =========================
   Update User (FIXED)
========================= */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, is_active } = req.body;

    // check user exists
    const user = await query('SELECT * FROM users WHERE id = $1', [id]);
    if (!user.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    // check email uniqueness (exclude current user)
    if (email) {
      const emailCheck = await query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [email, id]
      );
      if (emailCheck.rows.length) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const fields = [];
    const values = [];
    let idx = 1;

    const add = (field, value) => {
      fields.push(`${field}=$${idx++}`);
      values.push(value);
    };

    if (name !== undefined) add('name', name);
    if (email !== undefined) add('email', email);
    if (role !== undefined) add('role', role);
    if (is_active !== undefined) add('is_active', is_active);

    // password optional
    if (password && password.trim() !== '') {
      const hash = await bcrypt.hash(password, 10);
      add('password_hash', hash);
    }

    if (!fields.length) {
      return res.json({ message: 'Nothing to update' });
    }

    values.push(id);

    const sql = `
      UPDATE users
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING id, name, email, role, is_active, created_at
    `;

    const result = await query(sql, values);
    return res.json(result.rows[0]);

  } catch (err) {
    console.error('UPDATE USER ERROR:', err);
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

module.exports = {
  listUsers,
  createStaff,
  updateUser
};
