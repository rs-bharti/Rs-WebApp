const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

// ── Payment Methods ────────────────────────────────────────────────────────────
const getPaymentMethods = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.paymentMethodMaster.findMany({
      where,
      select: { id: true, name: true, category: true, openingBalance: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createPaymentMethod = async (req, res) => {
  try {
    const { name, category, openingBalance } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.paymentMethodMaster.create({
      data: { name: name.trim(), category: category || null, branchId: branchId || null, openingBalance: Number(openingBalance ?? 0) },
      select: { id: true, name: true, category: true, openingBalance: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: `Payment method "${req.body.name}" already exists.` });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    const { name, category, openingBalance } = req.body;
    const row = await prisma.paymentMethodMaster.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name.trim(),
        ...(category !== undefined && { category: category || null }),
        ...(openingBalance !== undefined && { openingBalance: Number(openingBalance) }),
      },
      select: { id: true, name: true, category: true, openingBalance: true },
    });
    res.json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: `Payment method "${req.body.name}" already exists.` });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    await prisma.paymentMethodMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

const forceDeletePaymentMethod = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.receiptVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.contraVoucher.deleteMany({ where: { OR: [{ fromPaymentMethodId: id }, { toPaymentMethodId: id }] } }),
      prisma.paymentMethodMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Payment method and all linked vouchers deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = {
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, forceDeletePaymentMethod,
};
