const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { role: true, branch: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Parse stored permissions JSON
    let permissions = {};
    try {
      permissions = JSON.parse(user.permissions || '{}');
    } catch {
      permissions = {};
    }

    // Admin always has full permissions — enforce server-side
    if (user.role.name === 'admin') {
      permissions = { isAdmin: true };
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role.name, branchId: user.branchId },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id:          user.id,
        name:        user.name,
        email:       user.email,
        role:        user.role.name,
        branch:      user.branch.name,
        branchId:    user.branchId,
        permissions,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { login };
