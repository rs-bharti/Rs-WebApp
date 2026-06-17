const prisma = require('../../utils/prisma');
const { getBranchId } = require('../vouchers/voucherHelpers');

// ── Money Ledger ───────────────────────────────────────────────────────────────
const getMoneyLedger = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    const methods = await prisma.paymentMethodMaster.findMany({
      where: { branchId },
      select: { id: true, name: true, category: true, openingBalance: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const result = await Promise.all(methods.map(async (method) => {
      const [receipts, payments, contraFrom, contraTo] = await Promise.all([
        prisma.receiptVoucher.findMany({
          where: { branchId, paymentMethodId: method.id },
          select: {
            id: true, voucherNo: true, date: true, amount: true, narration: true,
            particularName: true, particularType: true,
            customer: { select: { name: true } },
            supplier: { select: { name: true } },
          },
          orderBy: { date: 'asc' },
        }),
        prisma.paymentVoucher.findMany({
          where: { branchId, paymentMethodId: method.id },
          select: {
            id: true, voucherNo: true, date: true, amount: true, narration: true,
            particularName: true, particularType: true,
            customer: { select: { name: true } },
            supplier: { select: { name: true } },
          },
          orderBy: { date: 'asc' },
        }),
        // Contra: this method is the source (money going OUT)
        prisma.contraVoucher.findMany({
          where: { branchId, fromPaymentMethodId: method.id },
          select: { id: true, voucherNo: true, date: true, amount: true, narration: true, toPaymentMethodName: true },
          orderBy: { date: 'asc' },
        }),
        // Contra: this method is the destination (money coming IN)
        prisma.contraVoucher.findMany({
          where: { branchId, toPaymentMethodId: method.id },
          select: { id: true, voucherNo: true, date: true, amount: true, narration: true, fromPaymentMethodName: true },
          orderBy: { date: 'asc' },
        }),
      ]);

      const entries = [
        ...receipts.map(r => ({
          id: `rv-${r.id}`, type: 'receipt',
          voucherNo: r.voucherNo, date: r.date, amount: r.amount,
          narration: r.narration || '',
          particular: r.particularName || r.customer?.name || r.supplier?.name || '—',
          particularType: r.particularType || null,
        })),
        ...payments.map(p => ({
          id: `pv-${p.id}`, type: 'payment',
          voucherNo: p.voucherNo, date: p.date, amount: p.amount,
          narration: p.narration || '',
          particular: p.particularName || p.customer?.name || p.supplier?.name || '—',
          particularType: p.particularType || null,
        })),
        // Contra outflow — money leaving this method
        ...contraFrom.map(c => ({
          id: `cv-out-${c.id}`, type: 'payment',
          voucherNo: c.voucherNo, date: c.date, amount: c.amount,
          narration: c.narration || '',
          particular: `Transfer to ${c.toPaymentMethodName || 'Account'}`,
          particularType: 'contra',
        })),
        // Contra inflow — money arriving into this method
        ...contraTo.map(c => ({
          id: `cv-in-${c.id}`, type: 'receipt',
          voucherNo: c.voucherNo, date: c.date, amount: c.amount,
          narration: c.narration || '',
          particular: `Transfer from ${c.fromPaymentMethodName || 'Account'}`,
          particularType: 'contra',
        })),
      ].sort((a, b) => new Date(a.date) - new Date(b.date));

      return {
        method: { id: method.id, name: method.name, category: method.category, openingBalance: method.openingBalance || 0 },
        entries,
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('getMoneyLedger error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getMoneyLedger };
