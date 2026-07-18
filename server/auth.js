/**
 * auth.js — JWT + bcrypt helpers and Express middleware.
 */
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

// In production set THIRST_JWT_SECRET in the environment. For local/dev we
// generate a stable-per-process fallback so tokens work without config.
const JWT_SECRET = process.env.THIRST_JWT_SECRET || 'thirst-dev-secret-' + crypto.randomBytes(8).toString('hex');
const TOKEN_TTL = '7d';

function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}

function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}

function sanitizeUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return {
    id: safe.id,
    name: safe.name,
    email: safe.email,
    phone: safe.phone,
    role: safe.role,
    rewardPoints: safe.reward_points,
    active: !!safe.active,
    createdBy: safe.created_by,
    createdAt: safe.created_at
  };
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Attaches req.user (full DB row) when a valid Bearer token is present.
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub);
    if (!user || !user.active) return res.status(401).json({ error: 'Session invalid or account disabled' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// Restricts a route to the given roles. Admin is implicitly allowed everywhere.
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role === 'admin') return next();          // admin has all permissions
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  };
}

module.exports = { JWT_SECRET, hashPassword, verifyPassword, sanitizeUser, issueToken, authenticate, authorize };
