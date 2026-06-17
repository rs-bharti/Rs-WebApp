const prisma = require('../../utils/prisma');
const { prismaErr, nextNo, withVoucherRetry, getBranchId } = require('./voucherHelpers');

// ── Payment Voucher ────────────────────────────────────────────────────────────
const getPaymentNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('paymentVoucher', 'PV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getPayments = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.paymentVoucher.findMany({
      where,
      include: {
        supplier:      { select: { id: true, name: true } },
        customer:      { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createPayment = async (req, res) => {
  try {
    const { particularType, particularId, particularName, paymentMethodId, amount, narration, date } = req.body;
    if (!particularType || !particularId || !paymentMethodId || amount == null)
      return res.status(400).json({ message: 'particularType, particularId, paymentMethodId, and amount are required' });

    const branchId = getBranchId(req);
    const data = {
      voucherNo:       await nextNo('paymentVoucher', 'PV'),
      paymentMethodId: Number(paymentMethodId),
      amount:          Number(amount),
      narration:       narration || null,
      date:            date ? new Date(date) : new Date(),
      createdById:     req.user.id,
      branchId:        branchId || null,
      particularType,
      particularName:  particularName || null,
    };
    if (particularType === 'supplier') data.supplierId = Number(particularId);
    if (particularType === 'customer') data.customerId = Number(particularId);

    const voucher = await withVoucherRetry(async () => prisma.paymentVoucher.create({ data }));
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const updatePayment = async (req, res) => {
  try {
    const { date, amount, narration, particularType, particularId, particularName, paymentMethodId } = req.body;
    const updated = await prisma.paymentVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date            !== undefined && { date: new Date(date) }),
        ...(amount          != null       && { amount: Number(amount) }),
        ...(narration       !== undefined && { narration: narration || null }),
        ...(particularType  !== undefined && { particularType: particularType || null }),
        ...(particularId    != null       && { particularId: parseInt(particularId) }),
        ...(particularName  !== undefined && { particularName: particularName || null }),
        ...(paymentMethodId != null       && { paymentMethodId: parseInt(paymentMethodId) }),
        ...(particularType === 'customer' && particularId != null && { customerId: parseInt(particularId), supplierId: null }),
        ...(particularType === 'supplier' && particularId != null && { supplierId: parseInt(particularId), customerId: null }),
        ...(particularType === 'branch'   && particularId != null && { customerId: null, supplierId: null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deletePayment = async (req, res) => {
  try {
    await prisma.paymentVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

module.exports = { getPaymentNextNo, getPayments, createPayment, updatePayment, deletePayment };
