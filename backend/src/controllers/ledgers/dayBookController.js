const prisma = require('../../utils/prisma');
const { getBranchId } = require('../vouchers/voucherHelpers');

// ── Dashboard (day-book style summary) ────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const branchFilter = branchId ? { branchId } : {};
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [salesAgg, purchaseAgg, recentSales, customers, suppliers, products] = await Promise.all([
      prisma.salesVoucher.aggregate({ where: { ...branchFilter, date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.purchaseVoucher.aggregate({ where: { ...branchFilter, date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.salesVoucher.findMany({
        where: { ...branchFilter },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { voucherNo: true, totalAmount: true, date: true, customer: { select: { name: true } } },
      }),
      prisma.customer.count({ where: branchFilter }),
      prisma.supplier.count({ where: branchFilter }),
      prisma.product.count({ where: branchFilter }),
    ]);

    res.json({
      totalSalesThisMonth:     salesAgg._sum.totalAmount    || 0,
      totalPurchasesThisMonth: purchaseAgg._sum.totalAmount || 0,
      recentVouchers:          recentSales,
      totalCustomers:          customers,
      totalSuppliers:          suppliers,
      totalProducts:           products,
    });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Day Book ───────────────────────────────────────────────────────────────────
const getDayBook = async (req, res) => {
  try {
    const { date } = req.query;
    const branchId = getBranchId(req);
    if (!date) return res.status(400).json({ message: 'date is required (YYYY-MM-DD)' });

    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd   = new Date(date + 'T23:59:59.999');
    const dw = { date: { gte: dayStart, lte: dayEnd } };
    const bw = branchId ? { branchId, ...dw } : dw;

    const [
      receipts, payments, sales, purchases,
      salesReturns, purchaseReturns, contras,
      stockData, stockTransfers,
    ] = await Promise.all([
      prisma.receiptVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, amount: true, narration: true, date: true,
          particularType: true, particularName: true,
          customer:      { select: { name: true } },
          supplier:      { select: { name: true } },
          paymentMethod: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.paymentVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, amount: true, narration: true, date: true,
          particularType: true, particularName: true,
          supplier:      { select: { name: true } },
          customer:      { select: { name: true } },
          paymentMethod: { select: { name: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.salesVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, totalAmount: true, narration: true, date: true, customerName: true,
          customer: { select: { name: true } },
          items:    { select: { productName: true, qty: true, rate: true, amount: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.purchaseVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, totalAmount: true, narration: true, date: true, supplierName: true,
          supplier: { select: { name: true } },
          items:    { select: { productName: true, qty: true, rate: true, amount: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.salesReturnVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, totalAmount: true, narration: true, date: true, customerName: true,
          customer: { select: { name: true } },
          items:    { select: { productName: true, qty: true, rate: true, amount: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.purchaseReturnVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, totalAmount: true, narration: true, date: true, supplierName: true,
          supplier: { select: { name: true } },
          items:    { select: { productName: true, qty: true, rate: true, amount: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.contraVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, amount: true, narration: true, date: true,
          fromPaymentMethodName: true, toPaymentMethodName: true,
        },
        orderBy: { date: 'asc' },
      }),
      prisma.stockDataVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, narration: true, date: true, warehouseName: true,
          items: { select: { productName: true, qty: true, rate: true } },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.stockTransferVoucher.findMany({
        where: bw,
        select: { id: true, voucherNo: true, narration: true, date: true,
          fromWarehouseName: true, toWarehouseName: true,
          items: { select: { productName: true, qty: true } },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    res.json({
      date,
      in: {
        receipts:        receipts.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Receipt', party: v.particularName || v.customer?.name || v.supplier?.name, amount: v.amount, narration: v.narration, paymentMethod: v.paymentMethod?.name, date: v.date })),
        sales:           sales.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Sales', party: v.customer?.name || v.customerName, amount: v.totalAmount, narration: v.narration, items: v.items, date: v.date })),
        purchaseReturns: purchaseReturns.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Purchase Return', party: v.supplier?.name || v.supplierName, amount: v.totalAmount, narration: v.narration, items: v.items, date: v.date })),
        contras:         contras.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Contra', party: `${v.fromPaymentMethodName} → ${v.toPaymentMethodName}`, amount: v.amount, narration: v.narration, date: v.date })),
      },
      out: {
        payments:       payments.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Payment', party: v.particularName || v.supplier?.name || v.customer?.name, amount: v.amount, narration: v.narration, paymentMethod: v.paymentMethod?.name, date: v.date })),
        salesReturns:   salesReturns.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Sales Return', party: v.customer?.name || v.customerName, amount: v.totalAmount, narration: v.narration, items: v.items, date: v.date })),
        purchases:      purchases.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Purchase', party: v.supplier?.name || v.supplierName, amount: v.totalAmount, narration: v.narration, items: v.items, date: v.date })),
        stockData:      stockData.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Stock Data', party: v.warehouseName, amount: 0, narration: v.narration, items: v.items, date: v.date })),
        stockTransfers: stockTransfers.map(v => ({ id: v.id, voucherNo: v.voucherNo, type: 'Stock Transfer', party: `${v.fromWarehouseName} → ${v.toWarehouseName}`, amount: 0, narration: v.narration, items: v.items, date: v.date })),
      },
    });
  } catch (err) {
    console.error('getDayBook error:', err);
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

module.exports = { getDashboard, getDayBook };
