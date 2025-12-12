const bcrypt = require('bcryptjs');
const { query } = require('../db');

// ---------------------------------------------
// REGISTER (simple)
// ---------------------------------------------
async function register(req, res) {
  try {
    const { name, email, password, language } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const existing = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const result = await query(
      `
      INSERT INTO users (name, email, password_hash, language)
      VALUES ($1,$2,$3,$4)
      RETURNING id, name, email, role, avatar_url, language
      `,
      [name, email, password_hash, language || 'en']
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return res.status(500).json({ message: 'Register failed' });
  }
}

// ---------------------------------------------
// LOGIN (simple, no tokens)
// ---------------------------------------------
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      language: user.language
    });
  } catch (err) {
    console.error('LOGIN ERROR:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
}

// ---------------------------------------------
// REFRESH (not used, kept for compatibility)
// ---------------------------------------------
function refresh(req, res) {
  return res.json({ message: 'Refresh not used in simple auth mode' });
}

// ---------------------------------------------
// UPDATE PROFILE (NO TOKEN – FIXED)
// ---------------------------------------------


module.exports = {
  register,
  login,
  refresh,

};
