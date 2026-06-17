const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

// ── Expense Master ─────────────────────────────────────────────────────────────
const getExpenses = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.expenseMaster.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createExpense = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Expense name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.expenseMaster.create({
      data: { name: name.trim(), branchId: branchId || null },
      select: { id: true, name: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'Expense type already exists' });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.expenseMaster.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteExpense = async (req, res) => {
  try {
    await prisma.expenseMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense };
