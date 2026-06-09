const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// --- In-memory rate limiter ---
// Key: "<ip>:<email>", Value: { attempts, firstAttempt, lockedUntil }
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;   // 15-minute lockout
const WINDOW_MS = 15 * 60 * 1000; // sliding window

// Dummy hash used when user not found — ensures constant-time response (timing protection)
const DUMMY_HASH = bcrypt.hashSync('__timing_protection_dummy__', 10);

function getKey(req, email) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  return `${ip}:${email.toLowerCase().trim()}`;
}

function checkLimit(key) {
  const now = Date.now();
  const e = loginAttempts.get(key);
  if (!e) return { blocked: false, remaining: MAX_ATTEMPTS };

  if (e.lockedUntil && now < e.lockedUntil) {
    return { blocked: true, minutesLeft: Math.ceil((e.lockedUntil - now) / 60000) };
  }

  if (now - e.firstAttempt > WINDOW_MS) {
    loginAttempts.delete(key);
    return { blocked: false, remaining: MAX_ATTEMPTS };
  }

  return { blocked: false, remaining: Math.max(0, MAX_ATTEMPTS - e.attempts) };
}

function recordFail(key) {
  const now = Date.now();
  const e = loginAttempts.get(key);
  let attempts, firstAttempt;

  if (!e || now - e.firstAttempt > WINDOW_MS) {
    attempts = 1;
    firstAttempt = now;
  } else {
    attempts = e.attempts + 1;
    firstAttempt = e.firstAttempt;
  }

  const lockedUntil = attempts >= MAX_ATTEMPTS ? now + LOCK_MS : null;
  loginAttempts.set(key, { attempts, firstAttempt, lockedUntil });
  return Math.max(0, MAX_ATTEMPTS - attempts);
}

function clearLimit(key) {
  loginAttempts.delete(key);
}

// --- Login handler ---
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password are required' });

    const key = getKey(req, email);
    const limit = checkLimit(key);

    if (limit.blocked) {
      return res.status(429).json({
        message: `Too many failed attempts. Please try again in ${limit.minutesLeft} minute${limit.minutesLeft !== 1 ? 's' : ''}.`,
        lockedOut: true,
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, branch: true },
    });

    // Always run bcrypt — prevents timing-based user enumeration
    const hashToCompare = (user && user.isActive) ? user.password : DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!user || !user.isActive || !isValid) {
      const remaining = recordFail(key);
      const message = remaining > 0
        ? `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before lockout.`
        : 'Too many failed attempts. Account locked for 15 minutes.';
      return res.status(401).json({ message, attemptsRemaining: remaining });
    }

    clearLimit(key);

    let permissions = {};
    try { permissions = JSON.parse(user.permissions || '{}'); } catch { permissions = {}; }
    if (user.role.name === 'admin') permissions = { isAdmin: true };

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name, branchId: user.branchId, permissions },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.name,
        branch: user.branch?.name ?? null,
        branchId: user.branchId,
        permissions,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login };
