const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { query } = require('../db');

dotenv.config();

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || '15m';
const REFRESH_TOKEN_TTL = process.env.REFRESH_TOKEN_TTL || '7d';

function signTokens(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
  return { accessToken, refreshToken };
}

async function register(req, res) {
  const { name, email, password, language } = req.body;
  if (!email || !password || !name) return res.status(400).json({ message: 'Missing required fields' });
  const existing = await query('SELECT id FROM users WHERE email=$1', [email]);
  if (existing.rows.length) return res.status(409).json({ message: 'Email already registered' });
  const password_hash = await bcrypt.hash(password, 10);
  const result = await query(
    'INSERT INTO users (name, email, password_hash, language) VALUES ($1,$2,$3,$4) RETURNING id, name, email, role, language, avatar_url',
    [name, email, password_hash, language || 'en']
  );
  const user = result.rows[0];
  const tokens = signTokens(user);
  res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, sameSite: 'lax' });
  return res.status(201).json({ user, accessToken: tokens.accessToken });
}

async function login(req, res) {
  const { email, password } = req.body;
  const result = await query('SELECT * FROM users WHERE email=$1 AND is_active=true', [email]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const tokens = signTokens(user);
  res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, sameSite: 'lax' });
  return res.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_url: user.avatar_url, language: user.language },
    accessToken: tokens.accessToken,
  });
}

function refresh(req, res) {
  const token = req.cookies?.refreshToken || req.body.refreshToken;
  if (!token) return res.status(401).json({ message: 'Missing refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const tokens = signTokens(payload);
    res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true, sameSite: 'lax' });
    return res.json({ accessToken: tokens.accessToken });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

async function me(req, res) {
  const result = await query('SELECT id, name, email, role, avatar_url, language, is_active FROM users WHERE id=$1', [req.user.id]);
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
  if (password) { const hash = await bcrypt.hash(password, 10); fields.push(`password_hash=$${idx++}`); values.push(hash); }
  if (!fields.length) return res.json({ message: 'Nothing to update' });
  values.push(req.user.id);
  const sql = `UPDATE users SET ${fields.join(', ')} WHERE id=$${idx} RETURNING id, name, email, role, avatar_url, language`;
  const result = await query(sql, values);
  return res.json(result.rows[0]);
}

module.exports = { register, login, refresh, me, updateProfile };
