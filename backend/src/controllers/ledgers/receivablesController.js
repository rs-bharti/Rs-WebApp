const prisma = require('../../utils/prisma');
const { getBranchId } = require('../vouchers/voucherHelpers');

const getReceivablesEntries = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    // Only fetch vouchers that actually have consignment payment terms (not Cash / null)
    const consignmentFilter = {
      paymentTerms: { not: null, notIn: ['Cash'] },
    };

    const [salesVouchers, purchaseReturnVouchers, salesReturnVouchers, purchaseVouchers] = await Promise.all([
      prisma.salesVoucher.findMany({
        where: { branchId, ...consignmentFilter },
        include: {
          customer:  { select: { name: true } },
          items:     { include: { product: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.purchaseReturnVoucher.findMany({
        where: { branchId, ...consignmentFilter },
        include: {
          supplier:  { select: { name: true } },
          items:     { include: { product: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      // Notify-only — does NOT affect total receivable
      prisma.salesReturnVoucher.findMany({
        where: { branchId, ...consignmentFilter },
        include: {
          customer:  { select: { name: true } },
          items:     { include: { product: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
      // Notify-only — does NOT affect total receivable
      prisma.purchaseVoucher.findMany({
        where: { branchId, ...consignmentFilter },
        include: {
          supplier:  { select: { name: true } },
          items:     { include: { product: { select: { name: true } } } },
          createdBy: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const unpaidSales         = salesVouchers.filter(v => !v.isPaid);
    const unpaidPurchaseRet   = purchaseReturnVouchers.filter(v => !v.isPaid);
    const totalSales          = unpaidSales.reduce((s, v) => s + (v.totalAmount || 0), 0);
    const totalPurchaseReturn = unpaidPurchaseRet.reduce((s, v) => s + (v.totalAmount || 0), 0);

    res.json({
      sales:           salesVouchers,
      purchaseReturns: purchaseReturnVouchers,
      salesReturns:    salesReturnVouchers,    // notify-only
      purchases:       purchaseVouchers,        // notify-only
      totalSales,
      totalPurchaseReturn,
      grandTotal: totalSales + totalPurchaseReturn,
    });
  } catch (err) {
    console.error('getReceivablesEntries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const markReceivablePaid = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    const { type, id } = req.params;
    const numId = Number(id);
    const now   = new Date();

    const modelMap = {
      'sales':           { model: prisma.salesVoucher },
      'purchase-return': { model: prisma.purchaseReturnVoucher },
      'sales-return':    { model: prisma.salesReturnVoucher },   // notify-only dismiss
      'purchase':        { model: prisma.purchaseVoucher },       // notify-only dismiss
    };

    const entry = modelMap[type];
    if (!entry) return res.status(400).json({ message: 'Invalid type' });

    const voucher = await entry.model.findFirst({ where: { id: numId, branchId } });
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });

    await entry.model.update({ where: { id: numId }, data: { isPaid: true, paidAt: now } });

    res.json({ message: 'Marked as done' });
  } catch (err) {
    console.error('markReceivablePaid error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReceivablesLedger = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    const customerFilter = { OR: [{ customerId: { not: null } }, { particularType: 'customer' }] };

    const [receipts, payments] = await Promise.all([
      prisma.receiptVoucher.findMany({
        where: { branchId, ...customerFilter },
        select: {
          id: true, voucherNo: true, date: true, amount: true, narration: true,
          particularName: true, particularType: true,
          customer: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.paymentVoucher.findMany({
        where: { branchId, ...customerFilter },
        select: {
          id: true, voucherNo: true, date: true, amount: true, narration: true,
          particularName: true, particularType: true,
          customer: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const entries = [
      ...receipts.map(r => ({
        id: `rv-${r.id}`, type: 'receipt',
        voucherNo: r.voucherNo, date: r.date, amount: r.amount,
        narration: r.narration || '',
        particular: r.particularName || r.customer?.name || '—',
      })),
      ...payments.map(p => ({
        id: `pv-${p.id}`, type: 'payment',
        voucherNo: p.voucherNo, date: p.date, amount: p.amount,
        narration: p.narration || '',
        particular: p.particularName || p.customer?.name || '—',
      })),
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ entries });
  } catch (err) {
    console.error('getReceivablesLedger error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getReceivablesEntries, markReceivablePaid, getReceivablesLedger };
