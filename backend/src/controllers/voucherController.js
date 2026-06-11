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

    const voucher = await prisma.contraVoucher.create({
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
        warehouse:     { select: { id: true, name: true } },
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
    const { supplierId, paymentMethodId, warehouseId, date, items, narration } = req.body;
    if (!supplierId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and items are required' });

    const branchId = getBranchId(req);

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [supplierRecord, paymentMethodRecord, warehouseRecord, productRecords] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: Number(supplierId) }, select: { name: true } }),
      prisma.paymentMethodMaster.findUnique({ where: { id: Number(paymentMethodId) }, select: { name: true } }),
      warehouseId
        ? prisma.warehouseMaster.findUnique({ where: { id: Number(warehouseId) }, select: { name: true } })
        : Promise.resolve(null),
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal       = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount      = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount    = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.purchaseVoucher.create({
      data: {
        voucherNo:         await nextNo('purchaseVoucher', 'PUR'),
        supplierId:        Number(supplierId),
        supplierName:      supplierRecord?.name || null,
        branchId:          branchId,
        warehouseId:       warehouseId ? Number(warehouseId) : null,
        warehouseName:     warehouseRecord?.name || null,
        paymentMethodId:   Number(paymentMethodId),
        paymentMethodName: paymentMethodRecord?.name || null,
        date:              date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        createdById:       req.user.id,
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
          })),
        },
      },
      include: {
        items:    { include: { product: { select: { name: true } } } },
        supplier: { select: { name: true } },
        branch:   { select: { name: true } },
        warehouse: { select: { name: true } },
      },
    });

    // Auto-create CR entry: purchase means we owe money to the supplier
    await prisma.supplierTransaction.create({
      data: {
        supplierId:  Number(supplierId),
        type:        'CR',
        amount:      totalAmount,
        note:        `Purchase voucher ${voucher.voucherNo}`,
        source:      'purchase',
        refVoucherNo: voucher.voucherNo,
        date:        voucher.date,
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
        warehouse:     { select: { id: true, name: true } },
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
    const { customerId, paymentTerms, warehouseId, date, items, narration } = req.body;
    if (!customerId || !paymentTerms || !items?.length)
      return res.status(400).json({ message: 'customerId, paymentTerms, and items are required' });

    const validTerms = [
      '60 Days Consignment Basis',
      '45 Days Consignment Basis',
      '30 Days Consignment Basis',
      '15 Days Consignment Basis',
      'Cash',
    ];
    if (!validTerms.includes(paymentTerms)) {
      return res.status(400).json({ message: 'Invalid payment terms' });
    }

    const branchId = getBranchId(req);

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [productRecords, customerRecord, warehouseRecord] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
      prisma.customer.findUnique({ where: { id: Number(customerId) }, select: { name: true } }),
      warehouseId
        ? prisma.warehouseMaster.findUnique({ where: { id: Number(warehouseId) }, select: { name: true } })
        : Promise.resolve(null),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal       = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount      = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount    = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.salesVoucher.create({
      data: {
        voucherNo:         await nextNo('salesVoucher', 'SV'),
        customerId:        Number(customerId),
        customerName:      customerRecord?.name || null,
        branchId:          branchId,
        warehouseId:       warehouseId ? Number(warehouseId) : null,
        warehouseName:     warehouseRecord?.name || null,
        paymentTerms,
        date:              date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:         narration || null,
        createdById:       req.user.id,
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
        warehouse: { select: { name: true } },
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
        warehouse:     { select: { id: true, name: true } },
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
    const { supplierId, paymentMethodId, warehouseId, date, items, narration } = req.body;
    if (!supplierId || !paymentMethodId || !items?.length)
      return res.status(400).json({ message: 'supplierId, paymentMethodId, and items are required' });

    const branchId = getBranchId(req);

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [supplierRecord, paymentMethodRecord, warehouseRecord, productRecords] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: Number(supplierId) }, select: { name: true } }),
      prisma.paymentMethodMaster.findUnique({ where: { id: Number(paymentMethodId) }, select: { name: true } }),
      warehouseId
        ? prisma.warehouseMaster.findUnique({ where: { id: Number(warehouseId) }, select: { name: true } })
        : Promise.resolve(null),
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal       = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount      = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount    = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.purchaseReturnVoucher.create({
      data: {
        voucherNo:         await nextNo('purchaseReturnVoucher', 'PRV'),
        supplierId:        Number(supplierId),
        supplierName:      supplierRecord?.name || null,
        branchId:          branchId,
        warehouseId:       warehouseId ? Number(warehouseId) : null,
        warehouseName:     warehouseRecord?.name || null,
        paymentMethodId:   Number(paymentMethodId),
        paymentMethodName: paymentMethodRecord?.name || null,
        date:              date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:         narration || null,
        createdById:       req.user.id,
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
          })),
        },
      },
      include: {
        items:    { include: { product: { select: { name: true } } } },
        supplier: { select: { name: true } },
        branch:   { select: { name: true } },
        warehouse: { select: { name: true } },
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
    const { customerId, paymentTerms, date, items, narration } = req.body;
    if (!customerId || !paymentTerms || !items?.length)
      return res.status(400).json({ message: 'customerId, paymentTerms, and items are required' });

    const validTerms = [
      '60 Days Consignment Basis',
      '45 Days Consignment Basis',
      '30 Days Consignment Basis',
      '15 Days Consignment Basis',
      'Cash',
    ];
    if (!validTerms.includes(paymentTerms))
      return res.status(400).json({ message: 'Invalid payment terms' });

    const branchId = getBranchId(req);

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [customerRecord, productRecords] = await Promise.all([
      prisma.customer.findUnique({ where: { id: Number(customerId) }, select: { name: true } }),
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal       = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount      = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount    = subTotal + taxAmount - discountAmount;

    const voucher = await prisma.salesReturnVoucher.create({
      data: {
        voucherNo:         await nextNo('salesReturnVoucher', 'SRV'),
        customerId:        Number(customerId),
        customerName:      customerRecord?.name || null,
        branchId:          branchId,
        paymentTerms,
        date:              date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:         narration || null,
        createdById:       req.user.id,
        items: {
          create: items.map(i => ({
            productId:      Number(i.productId),
            productName:    productNameMap[Number(i.productId)] || null,
            warehouseId:    i.warehouseId ? Number(i.warehouseId) : null,
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

// ── Stock Data Voucher ─────────────────────────────────────────────────────────
const getStockDataNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('stockDataVoucher', 'SDV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getStockData = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const vouchers = await prisma.stockDataVoucher.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        items:     { include: { product: { select: { id: true, name: true } } } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStockData = async (req, res) => {
  const { date, warehouseId, items, narration } = req.body;
  if (!warehouseId) return res.status(400).json({ message: 'Warehouse is required' });
  if (!items?.length) return res.status(400).json({ message: 'At least one product item is required' });

  const validItems = items.filter(i => i.productId && parseFloat(i.qty) > 0);
  if (!validItems.length) return res.status(400).json({ message: 'Each item must have a product and qty > 0' });

  try {
    const branchId = getBranchId(req);
    const [warehouseRecord, productRecords] = await Promise.all([
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(warehouseId) }, select: { name: true } }),
      prisma.product.findMany({
        where: { id: { in: validItems.map(i => parseInt(i.productId)) } },
        select: { id: true, name: true },
      }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const voucher = await prisma.stockDataVoucher.create({
      data: {
        voucherNo:     await nextNo('stockDataVoucher', 'SDV'),
        date:          date ? new Date(date) : new Date(),
        narration:     narration || null,
        warehouseId:   parseInt(warehouseId),
        warehouseName: warehouseRecord?.name || null,
        createdById:   req.user.id,
        branchId:      branchId || null,
        items: {
          create: validItems.map(i => ({
            productId:   parseInt(i.productId),
            productName: productNameMap[parseInt(i.productId)] || null,
            qty:         parseFloat(i.qty),
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        items:     { include: { product: { select: { id: true, name: true } } } },
      },
    });
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Stock Transfer Voucher ─────────────────────────────────────────────────────
const getStockTransferNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('stockTransferVoucher', 'STV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getStockTransfers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const vouchers = await prisma.stockTransferVoucher.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse:   { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStockTransfer = async (req, res) => {
  const { date, fromWarehouseId, toWarehouseId, items, narration } = req.body;
  if (!fromWarehouseId || !toWarehouseId)
    return res.status(400).json({ message: 'Both warehouses are required' });
  if (parseInt(fromWarehouseId) === parseInt(toWarehouseId))
    return res.status(400).json({ message: 'Source and destination must be different' });
  if (!items?.length) return res.status(400).json({ message: 'At least one product item is required' });

  const validItems = items.filter(i => i.productId && parseFloat(i.qty) > 0);
  if (!validItems.length) return res.status(400).json({ message: 'Each item must have a product and qty > 0' });

  try {
    const branchId = getBranchId(req);
    const [fromWH, toWH, productRecords] = await Promise.all([
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(fromWarehouseId) }, select: { name: true } }),
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(toWarehouseId) },   select: { name: true } }),
      prisma.product.findMany({
        where: { id: { in: validItems.map(i => parseInt(i.productId)) } },
        select: { id: true, name: true },
      }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const voucher = await prisma.stockTransferVoucher.create({
      data: {
        voucherNo:         await nextNo('stockTransferVoucher', 'STV'),
        date:              date ? new Date(date) : new Date(),
        narration:         narration || null,
        fromWarehouseId:   parseInt(fromWarehouseId),
        toWarehouseId:     parseInt(toWarehouseId),
        fromWarehouseName: fromWH?.name ?? null,
        toWarehouseName:   toWH?.name   ?? null,
        createdById:       req.user.id,
        branchId:          branchId || null,
        items: {
          create: validItems.map(i => ({
            productId:   parseInt(i.productId),
            productName: productNameMap[parseInt(i.productId)] || null,
            qty:         parseFloat(i.qty),
          })),
        },
      },
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse:   { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
      },
    });
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Stock Qty Query ────────────────────────────────────────────────────────────
const getStockQty = async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    if (!productId || !warehouseId)
      return res.status(400).json({ message: 'productId and warehouseId are required' });

    const pid = Number(productId);
    const wid = Number(warehouseId);

    const [
      stockDataSum,
      purchaseSum,
      salesSum,
      salesReturnSum,
      purchaseReturnSum,
      transferInSum,
      transferOutSum,
    ] = await Promise.all([
      // StockData vouchers set the base quantity for that warehouse
      prisma.stockDataVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Purchases add stock to that warehouse
      prisma.purchaseVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Sales remove stock from that warehouse
      prisma.salesVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Sales returns add stock back to that warehouse
      prisma.salesReturnVoucherItem.aggregate({
        where: { productId: pid, warehouseId: wid },
        _sum: { qty: true },
      }),
      // Purchase returns remove stock from that warehouse
      prisma.purchaseReturnVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Stock transferred INTO this warehouse
      prisma.stockTransferVoucherItem.aggregate({
        where: { productId: pid, voucher: { toWarehouseId: wid } },
        _sum: { qty: true },
      }),
      // Stock transferred OUT of this warehouse
      prisma.stockTransferVoucherItem.aggregate({
        where: { productId: pid, voucher: { fromWarehouseId: wid } },
        _sum: { qty: true },
      }),
    ]);

    const qty =
      (stockDataSum._sum.qty      || 0) +
      (purchaseSum._sum.qty       || 0) +
      (transferInSum._sum.qty     || 0) +
      (salesReturnSum._sum.qty    || 0) -
      (salesSum._sum.qty          || 0) -
      (purchaseReturnSum._sum.qty || 0) -
      (transferOutSum._sum.qty    || 0);

    res.json({ qty: Math.max(0, qty) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Stock Qty by Warehouse (all products) ─────────────────────────────────────
const getStockQtyByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    if (!warehouseId) return res.status(400).json({ message: 'warehouseId is required' });

    const branchId = getBranchId(req);
    const wid = Number(warehouseId);

    const products = await prisma.product.findMany({
      where: branchId ? { branchId } : {},
      include: { unit: true },
      orderBy: { name: 'asc' },
    });

    if (products.length === 0) return res.json([]);

    const pids = products.map(p => p.id);

    const [sdGroups, purGroups, salGroups, srGroups, prGroups, tiGroups, toGroups] =
      await Promise.all([
        prisma.stockDataVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.purchaseVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.salesVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.salesReturnVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, warehouseId: wid },
          _sum: { qty: true },
        }),
        prisma.purchaseReturnVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.stockTransferVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { toWarehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.stockTransferVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { fromWarehouseId: wid } },
          _sum: { qty: true },
        }),
      ]);

    const buildMap = (groups) =>
      Object.fromEntries(groups.map(g => [g.productId, g._sum.qty || 0]));

    const sd  = buildMap(sdGroups);
    const pur = buildMap(purGroups);
    const sal = buildMap(salGroups);
    const sr  = buildMap(srGroups);
    const pr  = buildMap(prGroups);
    const ti  = buildMap(tiGroups);
    const to  = buildMap(toGroups);

    const result = products.map(p => ({
      id:   p.id,
      name: p.name,
      unit: p.unit?.unitName || '',
      qty:  Math.max(0,
        (sd[p.id]  || 0) +
        (pur[p.id] || 0) +
        (ti[p.id]  || 0) +
        (sr[p.id]  || 0) -
        (sal[p.id] || 0) -
        (pr[p.id]  || 0) -
        (to[p.id]  || 0)
      ),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Expense Voucher ────────────────────────────────────────────────────────────
const getExpenseNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('expenseVoucher', 'EXP') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getExpenseVouchers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.expenseVoucher.findMany({
      where,
      include: {
        expense:       { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createExpenseVoucher = async (req, res) => {
  try {
    const { expenseId, paymentMethodId, amount, narration, date } = req.body;
    if (!expenseId || amount == null)
      return res.status(400).json({ message: 'expenseId and amount are required' });

    const branchId = getBranchId(req);

    const [expenseRec, pmRec] = await Promise.all([
      prisma.expenseMaster.findUnique({ where: { id: Number(expenseId) }, select: { name: true } }),
      paymentMethodId ? prisma.paymentMethodMaster.findUnique({ where: { id: Number(paymentMethodId) }, select: { name: true } }) : null,
    ]);

    const voucher = await prisma.expenseVoucher.create({
      data: {
        voucherNo:         await nextNo('expenseVoucher', 'EXP'),
        expenseId:         Number(expenseId),
        expenseName:       expenseRec?.name || null,
        paymentMethodId:   paymentMethodId ? Number(paymentMethodId) : null,
        paymentMethodName: pmRec?.name || null,
        amount:            Number(amount),
        narration:         narration || null,
        date:              date ? new Date(date) : new Date(),
        createdById:       req.user.id,
        branchId:          branchId || null,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── DELETE handlers ────────────────────────────────────────────────────────────

const deleteContra = async (req, res) => {
  try {
    await prisma.contraVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteReceipt = async (req, res) => {
  try {
    await prisma.receiptVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deletePayment = async (req, res) => {
  try {
    await prisma.paymentVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deletePurchase = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const v  = await prisma.purchaseVoucher.findUnique({ where: { id }, select: { voucherNo: true } });
    if (v) {
      await prisma.$transaction([
        prisma.supplierTransaction.deleteMany({ where: { refVoucherNo: v.voucherNo } }),
        prisma.purchaseVoucher.delete({ where: { id } }),
      ]);
    }
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteSales = async (req, res) => {
  try {
    await prisma.salesVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deletePurchaseReturn = async (req, res) => {
  try {
    await prisma.purchaseReturnVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteSalesReturn = async (req, res) => {
  try {
    await prisma.salesReturnVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteStockData = async (req, res) => {
  try {
    await prisma.stockDataVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteStockTransfer = async (req, res) => {
  try {
    await prisma.stockTransferVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteExpenseVoucher = async (req, res) => {
  try {
    await prisma.expenseVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── UPDATE handlers ────────────────────────────────────────────────────────────

const updateReceipt = async (req, res) => {
  try {
    const { date, amount, narration } = req.body;
    const updated = await prisma.receiptVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(amount   != null       && { amount: Number(amount) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updatePayment = async (req, res) => {
  try {
    const { date, amount, narration } = req.body;
    const updated = await prisma.paymentVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(amount   != null       && { amount: Number(amount) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateContra = async (req, res) => {
  try {
    const { date, amount, narration } = req.body;
    const updated = await prisma.contraVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(amount   != null       && { amount: Number(amount) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateExpenseVoucher = async (req, res) => {
  try {
    const { date, amount, narration } = req.body;
    const updated = await prisma.expenseVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(amount   != null       && { amount: Number(amount) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateSales = async (req, res) => {
  try {
    const { date, narration } = req.body;
    const updated = await prisma.salesVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updatePurchase = async (req, res) => {
  try {
    const { date, narration } = req.body;
    const updated = await prisma.purchaseVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateSalesReturn = async (req, res) => {
  try {
    const { date, narration } = req.body;
    const updated = await prisma.salesReturnVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updatePurchaseReturn = async (req, res) => {
  try {
    const { date, narration } = req.body;
    const updated = await prisma.purchaseReturnVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStockData = async (req, res) => {
  try {
    const { date, narration } = req.body;
    const updated = await prisma.stockDataVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStockTransfer = async (req, res) => {
  try {
    const { date, narration } = req.body;
    const updated = await prisma.stockTransferVoucher.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(date     !== undefined && { date: new Date(date) }),
        ...(narration !== undefined && { narration: narration || null }),
      },
    });
    res.json(updated);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

module.exports = {
  getContraNextNo,        getContras,        createContra,        deleteContra,        updateContra,
  getReceiptNextNo,       getReceipts,       createReceipt,       deleteReceipt,       updateReceipt,
  getPaymentNextNo,       getPayments,       createPayment,       deletePayment,       updatePayment,
  getPurchaseNextNo,      getPurchases,      createPurchase,      deletePurchase,      updatePurchase,
  getSalesNextNo,         getSales,          createSales,         deleteSales,         updateSales,
  getPurchaseReturnNextNo, getPurchaseReturns, createPurchaseReturn, deletePurchaseReturn, updatePurchaseReturn,
  getSalesReturnNextNo,   getSalesReturns,   createSalesReturn,   deleteSalesReturn,   updateSalesReturn,
  getDashboard,
  getStockDataNextNo,    getStockData,    createStockData,    deleteStockData,    updateStockData,
  getStockTransferNextNo, getStockTransfers, createStockTransfer, deleteStockTransfer, updateStockTransfer,
  getStockQty,
  getStockQtyByWarehouse,
  getExpenseNextNo, getExpenseVouchers, createExpenseVoucher, deleteExpenseVoucher, updateExpenseVoucher,
};
