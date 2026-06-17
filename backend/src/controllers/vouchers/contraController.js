const prisma = require('../../utils/prisma');
const { prismaErr, nextNo, withVoucherRetry, getBranchId } = require('./voucherHelpers');

// ── Contra Voucher ─────────────────────────────────────────────────────────────
const getContraNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('contraVoucher', 'CV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getContras = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.contraVoucher.findMany({
      where,
      include: {
        fromPaymentMethod: { select: { id: true, name: true } },
        toPaymentMethod:   { select: { id: true, name: true } },
        createdBy:         { select: { name: true } },
        branch:            { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createContra = async (req, res) => {
  try {
    const { fromPaymentMethodId, toPaymentMethodId, amount, narration, date } = req.body;
    if (!fromPaymentMethodId || !toPaymentMethodId || amount == null)
      return res.status(400).json({ message: 'fromPaymentMethodId, toPaymentMethodId, and amount are required' });
    if (Number(fromPaymentMethodId) === Number(toPaymentMethodId))
      return res.status(400).json({ message: 'From and To accounts must be different' });

    const branchId = getBranchId(req);
    const [fromRecord, toRecord] = await Promise.all([
      prisma.paymentMethodMaster.findUnique({ where: { id: Number(fromPaymentMethodId) }, select: { name: true } }),
      prisma.paymentMethodMaster.findUnique({ where: { id: Number(toPaymentMethodId) },   select: { name: true } }),
    ]);

    const voucher = await withVoucherRetry(async () => prisma.contraVoucher.create({
      data: {
        voucherNo:              await nextNo('contraVoucher', 'CV'),
        fromPaymentMethodId:    Number(fromPaymentMethodId),
        fromPaymentMethodName:  fromRecord?.name || null,
        toPaymentMethodId:      Number(toPaymentMethodId),
        toPaymentMethodName:    toRecord?.name || null,
        amount:                 Number(amount),
        narration:              narration || null,
        date:                   date ? new Date(date) : new Date(),
        createdById:            req.user.id,
        branchId:               branchId || null,
      },
    }));
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const updateContra = async (req, res) => {
  try {
    const { date, amount, narration, fromPaymentMethodId, fromPaymentMethodName, toPaymentMethodId, toPaymentMethodName } = req.body;
    if (fromPaymentMethodId && toPaymentMethodId && Number(fromPaymentMethodId) === Number(toPaymentMethodId))
      return res.status(400).json({ message: 'From and To accounts must be different' });
    const updated = await prisma.contraVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date                 !== undefined && { date: new Date(date) }),
        ...(amount               != null       && { amount: Number(amount) }),
        ...(narration            !== undefined && { narration: narration || null }),
        ...(fromPaymentMethodId  != null       && { fromPaymentMethodId: parseInt(fromPaymentMethodId) }),
        ...(fromPaymentMethodName !== undefined && { fromPaymentMethodName: fromPaymentMethodName || null }),
        ...(toPaymentMethodId    != null       && { toPaymentMethodId: parseInt(toPaymentMethodId) }),
        ...(toPaymentMethodName  !== undefined && { toPaymentMethodName: toPaymentMethodName || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteContra = async (req, res) => {
  try {
    await prisma.contraVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

module.exports = { getContraNextNo, getContras, createContra, updateContra, deleteContra };
