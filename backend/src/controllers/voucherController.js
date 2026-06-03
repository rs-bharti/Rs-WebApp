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

// Extract active branch from request (header takes priority over JWT)
const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

// ── Payment Methods ────────────────────────────────────────────────────────────
const getPaymentMethods = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.paymentMethodMaster.findMany({
      where,
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
    const voucher = await prisma.contraVoucher.create({
      data: {
        voucherNo:           await nextNo('contraVoucher', 'CV'),
        fromPaymentMethodId: Number(fromPaymentMethodId),
        toPaymentMethodId:   Number(toPaymentMethodId),
        amount:              Number(amount),
        narration:           narration || null,
        date:                date ? new Date(date) : new Date(),
        createdById:         req.user.id,
        branchId:            branchId || null,
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

const getReceipts = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.receiptVoucher.findMany({
      where,
      include: {
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

const createReceipt = async (req, res) => {
  try {
    const { customerId, paymentMethodId, amount, narration, date } = req.body;
    if (!customerId || !paymentMethodId || amount == null)
      return res.status(400).json({ message: 'customerId, paymentMethodId, and amount are required' });

    const branchId = getBranchId(req);
    const voucher = await prisma.receiptVoucher.create({
      data: {
        voucherNo:       await nextNo('receiptVoucher', 'RV'),
        customerId:      Number(customerId),
        paymentMethodId: Number(paymentMethodId),
        amount:          Number(amount),
        narration:       narration || null,
        date:            date ? new Date(date) : new Date(),
        createdById:     req.user.id,
        branchId:        branchId || null,
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

const getPayments = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.paymentVoucher.findMany({
      where,
      include: {
        supplier:      { select: { id: true, name: true } },
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
    const { supplierId, paymentMethodId, amount, narration, date } = req.body;
    if (!supplierId || !paymentMethodId || amount == null)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and amount are required' });

    const branchId = getBranchId(req);
    const voucher = await prisma.paymentVoucher.create({
      data: {
        voucherNo:       await nextNo('paymentVoucher', 'PV'),
        supplierId:      Number(supplierId),
        paymentMethodId: Number(paymentMethodId),
        amount:          Number(amount),
        narration:       narration || null,
        date:            date ? new Date(date) : new Date(),
        createdById:     req.user.id,
        branchId:        branchId || null,
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

const getPurchases = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.purchaseVoucher.findMany({
      where,
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
    const { supplierId, paymentMethodId, date, items, narration } = req.body;
    if (!supplierId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and items are required' });

    const branchId = getBranchId(req);
    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.purchaseVoucher.create({
      data: {
        voucherNo:       await nextNo('purchaseVoucher', 'PUR'),
        supplierId:      Number(supplierId),
        branchId:        branchId,
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

const getSales = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.salesVoucher.findMany({
      where,
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
    const { customerId, paymentMethodId, warehouseId, date, items, narration } = req.body;
    if (!customerId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'customerId, paymentMethodId, and items are required' });

    const branchId = getBranchId(req);

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const lookups = [
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
      prisma.customer.findUnique({ where: { id: Number(customerId) }, select: { name: true } }),
      warehouseId
        ? prisma.warehouseMaster.findUnique({ where: { id: Number(warehouseId) }, select: { name: true } })
        : Promise.resolve(null),
    ];
    const [productRecords, customerRecord, warehouseRecord] = await Promise.all(lookups);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.salesVoucher.create({
      data: {
        voucherNo:       await nextNo('salesVoucher', 'SV'),
        customerId:      Number(customerId),
        customerName:    customerRecord?.name || null,
        branchId:        branchId,
        warehouseId:     warehouseId ? Number(warehouseId) : null,
        warehouseName:   warehouseRecord?.name || null,
        paymentMethodId: Number(paymentMethodId),
        date:            date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:       narration || null,
        createdById:     req.user.id,
        items: {
          create: items.map(i => ({
            productId:      Number(i.productId),
            productName:    productNameMap[Number(i.productId)] || null,
            qty:            Number(i.qty),
            rate:           Number(i.rate),
            subTotal:       Number(i.qty) * Number(i.rate),
            taxRate:        Number(i.taxRate || 0),
            taxAmount:      Number(i.taxAmount || 0),
            discountAmount: Number(i.discountAmount || 0),
            amount:         Number(i.qty) * Number(i.rate) + Number(i.taxAmount || 0) - Number(i.discountAmount || 0),
            remark:         i.remark || null,
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

const getPurchaseReturns = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.purchaseReturnVoucher.findMany({
      where,
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
    const { supplierId, paymentMethodId, date, items, narration } = req.body;
    if (!supplierId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and items are required' });

    const branchId = getBranchId(req);
    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.purchaseReturnVoucher.create({
      data: {
        voucherNo:       await nextNo('purchaseReturnVoucher', 'PRV'),
        supplierId:      Number(supplierId),
        branchId:        branchId,
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

const getSalesReturns = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.salesReturnVoucher.findMany({
      where,
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
    const { customerId, paymentMethodId, date, items, narration } = req.body;
    if (!customerId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'customerId, paymentMethodId, and items are required' });

    const branchId = getBranchId(req);
    const subTotal      = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount     = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount   = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.salesReturnVoucher.create({
      data: {
        voucherNo:       await nextNo('salesReturnVoucher', 'SRV'),
        customerId:      Number(customerId),
        branchId:        branchId,
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
