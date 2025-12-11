const bcrypt = require('bcryptjs');
const { query } = require('../db');

// ---------------------------------------------
// REGISTER (simple)
// ---------------------------------------------
async function register(req, res) {
  const { name, email, password, language } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.rows.length) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const result = await query(
    `INSERT INTO users (name, email, password_hash, language)
     VALUES ($1,$2,$3,$4)
     RETURNING id, name, email, role, language, avatar_url`,
    [name, email, password_hash, language || 'en']
  );

  const user = result.rows[0];

  return res.status(201).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    language: user.language
  });
}

// ---------------------------------------------
// LOGIN (simple, no tokens)
// ---------------------------------------------
async function login(req, res) {
  const { email, password } = req.body;

  const result = await query(
    'SELECT * FROM users WHERE email=$1 AND is_active=true',
    [email]
  );

  const user = result.rows[0];

  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar_url: user.avatar_url,
    language: user.language
  });
}

// ---------------------------------------------
// REFRESH — disabled but must exist for backend
// ---------------------------------------------
function refresh(req, res) {
  return res.json({ message: "Refresh not used in simple auth mode" });
}

// ---------------------------------------------
async function me(req, res) {
  const result = await query(
    'SELECT id, name, email, role, avatar_url, language, is_active FROM users WHERE id=$1',
    [req.user.id]
  );
  return res.json(result.rows[0]);
}

async function updateProfile(req, res) {
  const { name, language, avatar_url, password } = req.body;
  const fields = [];
  const values = [];
  let idx = 1;

  if (name) { fields.push(`name=$${idx++}`); values.push(name); }
  if (language) { fields.push(`language=$${idx++}`); values.push(language); }
  if (avatar_url) { fields.push(`avatar_url=$${idx++}`); values.push(avatar_url); }
  if (password) {
    const hash = await bcrypt.hash(password, 10);
    fields.push(`password_hash=$${idx++}`);
    values.push(hash);
  }

  if (!fields.length) return res.json({ message: 'Nothing to update' });

  values.push(req.user.id);

  const sql = `
    UPDATE users 
    SET ${fields.join(', ')} 
    WHERE id=$${idx} 
    RETURNING id, name, email, role, avatar_url, language`;

  const result = await query(sql, values);
  return res.json(result.rows[0]);
}

module.exports = { register, login, refresh, me, updateProfile };
