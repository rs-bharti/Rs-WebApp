const bcrypt = require('bcryptjs');
const prisma  = require('../utils/prisma');

const getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, isActive: true, createdAt: true, permissions: true, plainPassword: true,
        role: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const getOne = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, email: true, isActive: true, permissions: true, plainPassword: true,
        role: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const create = async (req, res) => {
  try {
    const { name, email, password, roleId, branchId, permissions } = req.body;
    if (!name || !email || !password || !roleId || !branchId)
      return res.status(400).json({ message: 'All fields are required' });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(), email: email.toLowerCase().trim(),
        password: hashed, plainPassword: password,
        roleId: Number(roleId), branchId: Number(branchId),
        permissions: JSON.stringify(permissions || {}),
      },
      select: { id: true, name: true, email: true, isActive: true, plainPassword: true,
        role: { select: { id: true, name: true } }, branch: { select: { id: true, name: true } } },
    });
    res.status(201).json(user);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const update = async (req, res) => {
  try {
    const { name, email, password, roleId, branchId, isActive, permissions } = req.body;
    const data = {};
    if (name)    data.name  = name.trim();
    if (email)   data.email = email.toLowerCase().trim();
    if (password) { data.password = await bcrypt.hash(password, 10); data.plainPassword = password; }
    if (roleId   !== undefined) data.roleId   = Number(roleId);
    if (branchId !== undefined) data.branchId = Number(branchId);
    if (typeof isActive === 'boolean') data.isActive = isActive;
    if (permissions !== undefined) data.permissions = JSON.stringify(permissions);

    const user = await prisma.user.update({
      where: { id: Number(req.params.id) }, data,
      select: { id: true, name: true, email: true, isActive: true,
        role: { select: { id: true, name: true } } },
    });
    res.json(user);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const remove = async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'User deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const getBranches = async (req, res) => {
  try {
    const branches = await prisma.branch.findMany({
      select: {
        id: true, name: true,
        country: { select: { id: true, name: true, phoneCode: true, currency: true } },
        state:   { select: { id: true, name: true } },
        city:    { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(branches);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

const getRoles = async (req, res) => {
  try {
    const roles = await prisma.role.findMany({ select: { id: true, name: true } });
    res.json(roles);
  } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

module.exports = { getAll, getOne, create, update, remove, getBranches, getRoles };
