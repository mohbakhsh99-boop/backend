const bcrypt = require('bcryptjs');
const { query } = require('../db');

/* =========================
   List Users (Admin)
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
   Create Staff (Admin)
========================= */
async function createStaff(req, res) {
  try {
    const { name, email, password, role = 'employee', is_active = true } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

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
      INSERT INTO users (name, email, password_hash, role, is_active)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id, name, email, role, is_active, created_at
      `,
      [name, email, hash, role, is_active]
    );

    return res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error('CREATE STAFF ERROR:', err);
    return res.status(500).json({ message: 'Failed to create staff' });
  }
}

/* =========================
   Update User (Admin)
========================= */
async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { name, email, password, role, is_active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    const add = (field, value) => {
      fields.push(`${field} = $${idx++}`);
      values.push(value);
    };

    if (name !== undefined) add('name', name);
    if (role !== undefined) add('role', role);
    if (is_active !== undefined) add('is_active', is_active);

    if (email !== undefined && email !== '') {
      const exists = await query(
        'SELECT id FROM users WHERE email = $1 AND id <> $2',
        [email, id]
      );
      if (exists.rows.length) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      add('email', email);
    }

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

    if (!result.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(result.rows[0]);

  } catch (err) {
    console.error('UPDATE USER ERROR:', err);
    return res.status(500).json({ message: 'Failed to update user' });
  }
}

/* =========================
   Update Profile (Customer)
========================= */
async function updateProfile(req, res) {
  try {
    const { userId, name, email, avatarUrl, currentPassword, newPassword, language } = req.body;

    const userRes = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (!userRes.rows.length) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRes.rows[0];

    let passwordChanged = false;

    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(
        currentPassword,
        user.password_hash
      );

      if (!isMatch) {
        return res.status(400).json({ message: 'invalidCurrentPassword' });
      }

      const newHash = await bcrypt.hash(newPassword, 10);

      await query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newHash, userId]
      );

      passwordChanged = true;
    }

    await query(
      `
      UPDATE users
      SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        avatar_url = COALESCE($3, avatar_url),
        language = COALESCE($4, language)
      WHERE id = $5
      `,
      [name, email, avatarUrl, language, userId]
    );

    return res.json({
      success: true,
      passwordChanged
    });

  } catch (err) {
    console.error('UPDATE PROFILE ERROR:', err);
    return res.status(500).json({ message: 'profileUpdateFailed' });
  }
}

module.exports = {
  listUsers,
  createStaff,
  updateUser,
  updateProfile
};
