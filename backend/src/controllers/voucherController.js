const prisma = require('../utils/prisma');

async function nextNo(model, prefix) {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const last = await prisma[model].findFirst({
    where: { voucherNo: { startsWith: fullPrefix } },
    orderBy: { voucherNo: 'desc' },
  });
  const seq = last ? parseInt(last.voucherNo.split('-')[2]) + 1 : 1;
  return `${fullPrefix}${String(seq).padStart(3, '0')}`;
}

// ── Payment Methods ────────────────────────────────────────────────────────────
const getPaymentMethods = async (_req, res) => {
  try {
    const rows = await prisma.paymentMethodMaster.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Contra Voucher ─────────────────────────────────────────────────────────────
const getContraNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('contraVoucher', 'CV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getContras = async (_req, res) => {
  try {
    const rows = await prisma.contraVoucher.findMany({
      include: {
        fromPaymentMethod: { select: { id: true, name: true } },
        toPaymentMethod:   { select: { id: true, name: true } },
        createdBy:         { select: { name: true } },
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

    const voucher = await prisma.contraVoucher.create({
      data: {
        voucherNo:           await nextNo('contraVoucher', 'CV'),
        fromPaymentMethodId: Number(fromPaymentMethodId),
        toPaymentMethodId:   Number(toPaymentMethodId),
        amount:              Number(amount),
        narration:           narration || null,
        date:                date ? new Date(date) : new Date(),
        createdById:         req.user.id,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Receipt Voucher ────────────────────────────────────────────────────────────
const getReceiptNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('receiptVoucher', 'RV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getReceipts = async (_req, res) => {
  try {
    const rows = await prisma.receiptVoucher.findMany({
      include: {
        customer:      { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createReceipt = async (req, res) => {
  try {
    const { customerId, paymentMethodId, amount, narration, date } = req.body;
    if (!customerId || !paymentMethodId || amount == null)
      return res.status(400).json({ message: 'customerId, paymentMethodId, and amount are required' });

    const voucher = await prisma.receiptVoucher.create({
      data: {
        voucherNo:       await nextNo('receiptVoucher', 'RV'),
        customerId:      Number(customerId),
        paymentMethodId: Number(paymentMethodId),
        amount:          Number(amount),
        narration:       narration || null,
        date:            date ? new Date(date) : new Date(),
        createdById:     req.user.id,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Payment Voucher ────────────────────────────────────────────────────────────
const getPaymentNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('paymentVoucher', 'PV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getPayments = async (_req, res) => {
  try {
    const rows = await prisma.paymentVoucher.findMany({
      include: {
        supplier:      { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createPayment = async (req, res) => {
  try {
    const { supplierId, paymentMethodId, amount, narration, date } = req.body;
    if (!supplierId || !paymentMethodId || amount == null)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and amount are required' });

    const voucher = await prisma.paymentVoucher.create({
      data: {
        voucherNo:       await nextNo('paymentVoucher', 'PV'),
        supplierId:      Number(supplierId),
        paymentMethodId: Number(paymentMethodId),
        amount:          Number(amount),
        narration:       narration || null,
        date:            date ? new Date(date) : new Date(),
        createdById:     req.user.id,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Purchase Voucher ───────────────────────────────────────────────────────────
const getPurchaseNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('purchaseVoucher', 'PUR') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getPurchases = async (_req, res) => {
  try {
    const rows = await prisma.purchaseVoucher.findMany({
      include: {
        supplier:      { select: { id: true, name: true } },
        branch:        { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
        createdBy:     { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createPurchase = async (req, res) => {
  try {
    const { supplierId, branchId, paymentMethodId, date, items, narration } = req.body;
    if (!supplierId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and items are required' });

    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.purchaseVoucher.create({
      data: {
        voucherNo:       await nextNo('purchaseVoucher', 'PUR'),
        supplierId:      Number(supplierId),
        branchId:        Number(branchId) || req.user.branchId,
        paymentMethodId: Number(paymentMethodId),
        date:            date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        createdById:     req.user.id,
        items: {
          create: items.map(i => ({
            productId:      Number(i.productId),
            qty:            Number(i.qty),
            rate:           Number(i.rate),
            subTotal:       Number(i.qty) * Number(i.rate),
            taxRate:        Number(i.taxRate || 0),
            taxAmount:      Number(i.taxAmount || 0),
            discountAmount: Number(i.discountAmount || 0),
            amount:         Number(i.qty) * Number(i.rate) + Number(i.taxAmount || 0) - Number(i.discountAmount || 0),
          })),
        },
      },
      include: {
        items:    { include: { product: { select: { name: true } } } },
        supplier: { select: { name: true } },
        branch:   { select: { name: true } },
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Sales Voucher ──────────────────────────────────────────────────────────────
const getSalesNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('salesVoucher', 'SV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getSales = async (_req, res) => {
  try {
    const rows = await prisma.salesVoucher.findMany({
      include: {
        customer:      { select: { id: true, name: true } },
        branch:        { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
        createdBy:     { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createSales = async (req, res) => {
  try {
    const { customerId, branchId, paymentMethodId, date, items, narration } = req.body;
    if (!customerId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'customerId, paymentMethodId, and items are required' });

    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.salesVoucher.create({
      data: {
        voucherNo:       await nextNo('salesVoucher', 'SV'),
        customerId:      Number(customerId),
        branchId:        Number(branchId) || req.user.branchId,
        paymentMethodId: Number(paymentMethodId),
        date:            date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        createdById:     req.user.id,
        items: {
          create: items.map(i => ({
            productId:      Number(i.productId),
            qty:            Number(i.qty),
            rate:           Number(i.rate),
            subTotal:       Number(i.qty) * Number(i.rate),
            taxRate:        Number(i.taxRate || 0),
            taxAmount:      Number(i.taxAmount || 0),
            discountAmount: Number(i.discountAmount || 0),
            amount:         Number(i.qty) * Number(i.rate) + Number(i.taxAmount || 0) - Number(i.discountAmount || 0),
          })),
        },
      },
      include: {
        items:    { include: { product: { select: { name: true } } } },
        customer: { select: { name: true } },
        branch:   { select: { name: true } },
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Purchase Return Voucher ────────────────────────────────────────────────────
const getPurchaseReturnNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('purchaseReturnVoucher', 'PRV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getPurchaseReturns = async (_req, res) => {
  try {
    const rows = await prisma.purchaseReturnVoucher.findMany({
      include: {
        supplier:      { select: { id: true, name: true } },
        branch:        { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
        createdBy:     { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createPurchaseReturn = async (req, res) => {
  try {
    const { supplierId, branchId, paymentMethodId, date, items, narration } = req.body;
    if (!supplierId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and items are required' });

    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.purchaseReturnVoucher.create({
      data: {
        voucherNo:       await nextNo('purchaseReturnVoucher', 'PRV'),
        supplierId:      Number(supplierId),
        branchId:        Number(branchId) || req.user.branchId,
        paymentMethodId: Number(paymentMethodId),
        date:            date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:       narration || null,
        createdById:     req.user.id,
        items: {
          create: items.map(i => ({
            productId:      Number(i.productId),
            qty:            Number(i.qty),
            rate:           Number(i.rate),
            subTotal:       Number(i.qty) * Number(i.rate),
            taxRate:        Number(i.taxRate || 0),
            taxAmount:      Number(i.taxAmount || 0),
            discountAmount: Number(i.discountAmount || 0),
            amount:         Number(i.qty) * Number(i.rate) + Number(i.taxAmount || 0) - Number(i.discountAmount || 0),
          })),
        },
      },
      include: {
        items:    { include: { product: { select: { name: true } } } },
        supplier: { select: { name: true } },
        branch:   { select: { name: true } },
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Sales Return Voucher ───────────────────────────────────────────────────────
const getSalesReturnNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('salesReturnVoucher', 'SRV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getSalesReturns = async (_req, res) => {
  try {
    const rows = await prisma.salesReturnVoucher.findMany({
      include: {
        customer:      { select: { id: true, name: true } },
        branch:        { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
        createdBy:     { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createSalesReturn = async (req, res) => {
  try {
    const { customerId, branchId, paymentMethodId, date, items, narration } = req.body;
    if (!customerId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'customerId, paymentMethodId, and items are required' });

    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.salesReturnVoucher.create({
      data: {
        voucherNo:       await nextNo('salesReturnVoucher', 'SRV'),
        customerId:      Number(customerId),
        branchId:        Number(branchId) || req.user.branchId,
        paymentMethodId: Number(paymentMethodId),
        date:            date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:       narration || null,
        createdById:     req.user.id,
        items: {
          create: items.map(i => ({
            productId:      Number(i.productId),
            qty:            Number(i.qty),
            rate:           Number(i.rate),
            subTotal:       Number(i.qty) * Number(i.rate),
            taxRate:        Number(i.taxRate || 0),
            taxAmount:      Number(i.taxAmount || 0),
            discountAmount: Number(i.discountAmount || 0),
            amount:         Number(i.qty) * Number(i.rate) + Number(i.taxAmount || 0) - Number(i.discountAmount || 0),
          })),
        },
      },
      include: {
        items:    { include: { product: { select: { name: true } } } },
        customer: { select: { name: true } },
        branch:   { select: { name: true } },
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Dashboard ──────────────────────────────────────────────────────────────────
const getDashboard = async (_req, res) => {
  try {
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [salesAgg, purchaseAgg, recentSales, customers, suppliers, products] = await Promise.all([
      prisma.salesVoucher.aggregate({ where: { date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.purchaseVoucher.aggregate({ where: { date: { gte: startOfMonth } }, _sum: { totalAmount: true } }),
      prisma.salesVoucher.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { voucherNo: true, totalAmount: true, date: true, customer: { select: { name: true } } },
      }),
      prisma.customer.count(),
      prisma.supplier.count(),
      prisma.product.count(),
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

module.exports = {
  getPaymentMethods,
  getContraNextNo,        getContras,        createContra,
  getReceiptNextNo,       getReceipts,       createReceipt,
  getPaymentNextNo,       getPayments,       createPayment,
  getPurchaseNextNo,      getPurchases,      createPurchase,
  getSalesNextNo,         getSales,          createSales,
  getPurchaseReturnNextNo, getPurchaseReturns, createPurchaseReturn,
  getSalesReturnNextNo,   getSalesReturns,   createSalesReturn,
  getDashboard,
};
