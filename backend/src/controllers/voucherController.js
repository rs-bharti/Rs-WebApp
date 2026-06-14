const prisma = require('../utils/prisma');

const prismaErr = (err) => {
  if (err.code === 'P2025') return 'Voucher not found.';
  if (err.code === 'P2003' || (err.message || '').toLowerCase().includes('foreign key constraint'))
    return 'Cannot delete — this voucher is referenced by other records.';
  return err.message || 'Server error';
};

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

// If two users submit the same voucher type at the same instant, both may get
// the same sequence number. The DB unique constraint will reject one of them.
// This wrapper retries up to 3 times, each time fetching a fresh number.
async function withVoucherRetry(fn) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isDuplicateVoucherNo =
        err.code === 'P2002' &&
        (err.meta?.target || []).some(f => f === 'voucherNo');
      if (isDuplicateVoucherNo && attempt < 2) continue;
      throw err;
    }
  }
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

const createReceipt = async (req, res) => {
  try {
    const { particularType, particularId, particularName, paymentMethodId, amount, narration, date } = req.body;
    if (!particularType || !particularId || !paymentMethodId || amount == null)
      return res.status(400).json({ message: 'particularType, particularId, paymentMethodId, and amount are required' });

    const branchId = getBranchId(req);
    const data = {
      voucherNo:       await nextNo('receiptVoucher', 'RV'),
      paymentMethodId: Number(paymentMethodId),
      amount:          Number(amount),
      narration:       narration || null,
      date:            date ? new Date(date) : new Date(),
      createdById:     req.user.id,
      branchId:        branchId || null,
      particularType,
      particularName:  particularName || null,
    };
    if (particularType === 'customer') data.customerId = Number(particularId);
    if (particularType === 'supplier') data.supplierId = Number(particularId);

    const voucher = await withVoucherRetry(async () => prisma.receiptVoucher.create({ data }));
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
    const { particularType = 'supplier', particularId, particularName, paymentTerms, warehouseId, date, items, narration } = req.body;
    if (!particularId || !items?.length)
      return res.status(400).json({ message: 'Party and items are required' });

    const branchId = getBranchId(req);

    let resolvedSupplierId = null;
    let resolvedSupplierName = particularName || null;
    if (particularType === 'supplier') {
      resolvedSupplierId = Number(particularId);
      if (!resolvedSupplierName) {
        const rec = await prisma.supplier.findUnique({ where: { id: resolvedSupplierId }, select: { name: true } });
        resolvedSupplierName = rec?.name || null;
      }
    }
    // particularType === 'branch': supplierId stays null, supplierName = branch name

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [warehouseRecord, productRecords] = await Promise.all([
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

    const voucher = await withVoucherRetry(async () => prisma.purchaseVoucher.create({
      data: {
        voucherNo:     await nextNo('purchaseVoucher', 'PUR'),
        supplierId:    resolvedSupplierId,
        supplierName:  resolvedSupplierName,
        particularType,
        branchId,
        warehouseId:   warehouseId ? Number(warehouseId) : null,
        warehouseName: warehouseRecord?.name || null,
        paymentTerms:  paymentTerms || null,
        narration:     narration || null,
        date:          date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        createdById:   req.user.id,
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
    }));

    // Only create supplier ledger entry for real supplier transactions
    if (resolvedSupplierId) {
      await prisma.supplierTransaction.create({
        data: {
          supplierId:   resolvedSupplierId,
          type:         'CR',
          amount:       totalAmount,
          note:         `Purchase voucher ${voucher.voucherNo}`,
          source:       'purchase',
          refVoucherNo: voucher.voucherNo,
          date:         voucher.date,
        },
      });
    }

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
    const { particularType = 'customer', particularId, particularName, paymentTerms, warehouseId, date, items, narration } = req.body;
    if (!particularId || !paymentTerms || !items?.length)
      return res.status(400).json({ message: 'Party, paymentTerms, and items are required' });

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

    let resolvedCustomerId = null;
    let resolvedCustomerName = particularName || null;
    if (particularType === 'customer') {
      resolvedCustomerId = Number(particularId);
      if (!resolvedCustomerName) {
        const rec = await prisma.customer.findUnique({ where: { id: resolvedCustomerId }, select: { name: true } });
        resolvedCustomerName = rec?.name || null;
      }
    }
    // particularType === 'branch': customerId stays null, customerName = branch name

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [productRecords, warehouseRecord] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } }),
      warehouseId
        ? prisma.warehouseMaster.findUnique({ where: { id: Number(warehouseId) }, select: { name: true } })
        : Promise.resolve(null),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal       = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount      = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount    = subTotal + taxAmount - discountAmount;

    const voucher = await withVoucherRetry(async () => prisma.salesVoucher.create({
      data: {
        voucherNo:     await nextNo('salesVoucher', 'SV'),
        customerId:    resolvedCustomerId,
        customerName:  resolvedCustomerName,
        particularType,
        branchId,
        warehouseId:   warehouseId ? Number(warehouseId) : null,
        warehouseName: warehouseRecord?.name || null,
        paymentTerms,
        date:          date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:     narration || null,
        createdById:   req.user.id,
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
    }));
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
    const { particularType = 'supplier', particularId, particularName, paymentTerms, warehouseId, date, items, narration } = req.body;
    if (!particularId || !items?.length)
      return res.status(400).json({ message: 'Party and items are required' });

    const branchId = getBranchId(req);

    let resolvedSupplierId = null;
    let resolvedSupplierName = particularName || null;
    if (particularType === 'supplier') {
      resolvedSupplierId = Number(particularId);
      if (!resolvedSupplierName) {
        const rec = await prisma.supplier.findUnique({ where: { id: resolvedSupplierId }, select: { name: true } });
        resolvedSupplierName = rec?.name || null;
      }
    }

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const [warehouseRecord, productRecords] = await Promise.all([
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

    const voucher = await withVoucherRetry(async () => prisma.purchaseReturnVoucher.create({
      data: {
        voucherNo:     await nextNo('purchaseReturnVoucher', 'PRV'),
        supplierId:    resolvedSupplierId,
        supplierName:  resolvedSupplierName,
        particularType,
        branchId,
        warehouseId:   warehouseId ? Number(warehouseId) : null,
        warehouseName: warehouseRecord?.name || null,
        paymentTerms:  paymentTerms || null,
        date:          date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:     narration || null,
        createdById:   req.user.id,
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
    }));
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
    const { particularType = 'customer', particularId, particularName, paymentTerms, date, items, narration } = req.body;
    if (!particularId || !paymentTerms || !items?.length)
      return res.status(400).json({ message: 'Party, paymentTerms, and items are required' });

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

    let resolvedCustomerId = null;
    let resolvedCustomerName = particularName || null;
    if (particularType === 'customer') {
      resolvedCustomerId = Number(particularId);
      if (!resolvedCustomerName) {
        const rec = await prisma.customer.findUnique({ where: { id: resolvedCustomerId }, select: { name: true } });
        resolvedCustomerName = rec?.name || null;
      }
    }

    const productIds = [...new Set(items.map(i => Number(i.productId)))];
    const productRecords = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true, name: true } });
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const subTotal       = items.reduce((s, i) => s + Number(i.qty) * Number(i.rate), 0);
    const taxAmount      = items.reduce((s, i) => s + Number(i.taxAmount || 0), 0);
    const discountAmount = items.reduce((s, i) => s + Number(i.discountAmount || 0), 0);
    const totalAmount    = subTotal + taxAmount - discountAmount;

    const voucher = await withVoucherRetry(async () => prisma.salesReturnVoucher.create({
      data: {
        voucherNo:     await nextNo('salesReturnVoucher', 'SRV'),
        customerId:    resolvedCustomerId,
        customerName:  resolvedCustomerName,
        particularType,
        branchId,
        paymentTerms,
        date:          date ? new Date(date) : new Date(),
        subTotal, taxAmount, discountAmount, totalAmount,
        narration:     narration || null,
        createdById:   req.user.id,
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
    }));
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

    const voucher = await withVoucherRetry(async () => prisma.stockDataVoucher.create({
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
            rate:        i.rate !== undefined && i.rate !== '' ? parseFloat(i.rate) : null,
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        items:     { include: { product: { select: { id: true, name: true } } } },
      },
    }));
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

    const voucher = await withVoucherRetry(async () => prisma.stockTransferVoucher.create({
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
    }));
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

    const [sdItems, purGroups, salGroups, srGroups, prGroups, tiGroups, toGroups] =
      await Promise.all([
        prisma.stockDataVoucherItem.findMany({
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          select: { productId: true, qty: true, rate: true },
        }),
        prisma.purchaseVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true, amount: true },
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
          _sum: { qty: true, amount: true },
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

    // Aggregate stock data qty and amount (qty × rate) per product
    const sdQtyMap = {}, sdAmountMap = {};
    sdItems.forEach(item => {
      sdQtyMap[item.productId]    = (sdQtyMap[item.productId]    || 0) + item.qty;
      sdAmountMap[item.productId] = (sdAmountMap[item.productId] || 0) + item.qty * (item.rate || 0);
    });

    const buildMap    = (groups, field = 'qty') =>
      Object.fromEntries(groups.map(g => [g.productId, g._sum[field] || 0]));

    const pur    = buildMap(purGroups);
    const purAmt = buildMap(purGroups, 'amount');
    const sal    = buildMap(salGroups);
    const sr     = buildMap(srGroups);
    const pr     = buildMap(prGroups);
    const prAmt  = buildMap(prGroups, 'amount');
    const ti     = buildMap(tiGroups);
    const to     = buildMap(toGroups);

    const result = products.map(p => ({
      id:     p.id,
      name:   p.name,
      unit:   p.unit?.unitName || '',
      qty:    Math.max(0,
        (sdQtyMap[p.id] || 0) +
        (pur[p.id]  || 0) +
        (ti[p.id]   || 0) +
        (sr[p.id]   || 0) -
        (sal[p.id]  || 0) -
        (pr[p.id]   || 0) -
        (to[p.id]   || 0)
      ),
      amount: Math.max(0,
        (sdAmountMap[p.id] || 0) +
        (purAmt[p.id]      || 0) -
        (prAmt[p.id]       || 0)
      ),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── DELETE handlers ────────────────────────────────────────────────────────────

const deleteContra = async (req, res) => {
  try {
    await prisma.contraVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteReceipt = async (req, res) => {
  try {
    await prisma.receiptVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deletePayment = async (req, res) => {
  try {
    await prisma.paymentVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
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
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteSales = async (req, res) => {
  try {
    await prisma.salesVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deletePurchaseReturn = async (req, res) => {
  try {
    await prisma.purchaseReturnVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteSalesReturn = async (req, res) => {
  try {
    await prisma.salesReturnVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteStockData = async (req, res) => {
  try {
    await prisma.stockDataVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteStockTransfer = async (req, res) => {
  try {
    await prisma.stockTransferVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

// ── UPDATE handlers ────────────────────────────────────────────────────────────

const updateReceipt = async (req, res) => {
  try {
    const { date, amount, narration, particularType, particularId, particularName, paymentMethodId } = req.body;
    const updated = await prisma.receiptVoucher.update({
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

const updateSales = async (req, res) => {
  try {
    const { date, narration, customerId, customerName, particularType, paymentTerms, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      let subTotal = 0, taxAmount = 0, discountAmount = 0, totalAmount = 0;
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.salesVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty), rate: Number(item.rate), subTotal: Number(item.subTotal || 0), taxAmount: Number(item.taxAmount || 0), discountAmount: Number(item.discountAmount || 0), amount: Number(item.amount) },
          });
          subTotal      += Number(item.subTotal || 0);
          taxAmount     += Number(item.taxAmount || 0);
          discountAmount += Number(item.discountAmount || 0);
          totalAmount   += Number(item.amount);
        }
      }
      return tx.salesVoucher.update({
        where: { id },
        data: {
          ...(date          !== undefined && { date: new Date(date) }),
          ...(narration     !== undefined && { narration: narration || null }),
          ...(paymentTerms  !== undefined && { paymentTerms: paymentTerms || null }),
          ...(particularType !== undefined && { particularType: particularType || null }),
          ...(customerId    != null       && { customerId: parseInt(customerId), customerName: customerName || null }),
          ...(items && items.length > 0  && { subTotal, taxAmount, discountAmount, totalAmount }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updatePurchase = async (req, res) => {
  try {
    const { date, narration, paymentTerms, supplierId, supplierName, particularType, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      let subTotal = 0, taxAmount = 0, discountAmount = 0, totalAmount = 0;
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.purchaseVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty), rate: Number(item.rate), subTotal: Number(item.subTotal || 0), taxAmount: Number(item.taxAmount || 0), discountAmount: Number(item.discountAmount || 0), amount: Number(item.amount) },
          });
          subTotal      += Number(item.subTotal || 0);
          taxAmount     += Number(item.taxAmount || 0);
          discountAmount += Number(item.discountAmount || 0);
          totalAmount   += Number(item.amount);
        }
      }
      return tx.purchaseVoucher.update({
        where: { id },
        data: {
          ...(date          !== undefined && { date: new Date(date) }),
          ...(narration     !== undefined && { narration: narration || null }),
          ...(paymentTerms  !== undefined && { paymentTerms: paymentTerms || null }),
          ...(particularType !== undefined && { particularType: particularType || null }),
          ...(supplierId    != null       && { supplierId: parseInt(supplierId), supplierName: supplierName || null }),
          ...(items && items.length > 0  && { subTotal, taxAmount, discountAmount, totalAmount }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateSalesReturn = async (req, res) => {
  try {
    const { date, narration, customerId, customerName, particularType, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.salesReturnVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty), rate: Number(item.rate), amount: Number(item.amount) },
          });
          totalAmount += Number(item.amount);
        }
      }
      return tx.salesReturnVoucher.update({
        where: { id },
        data: {
          ...(date           !== undefined && { date: new Date(date) }),
          ...(narration      !== undefined && { narration: narration || null }),
          ...(particularType !== undefined && { particularType: particularType || null }),
          ...(customerId     != null       && { customerId: parseInt(customerId), customerName: customerName || null }),
          ...(items && items.length > 0   && { totalAmount }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updatePurchaseReturn = async (req, res) => {
  try {
    const { date, narration, supplierId, supplierName, particularType, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.purchaseReturnVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty), rate: Number(item.rate), amount: Number(item.amount) },
          });
          totalAmount += Number(item.amount);
        }
      }
      return tx.purchaseReturnVoucher.update({
        where: { id },
        data: {
          ...(date           !== undefined && { date: new Date(date) }),
          ...(narration      !== undefined && { narration: narration || null }),
          ...(particularType !== undefined && { particularType: particularType || null }),
          ...(supplierId     != null       && { supplierId: parseInt(supplierId), supplierName: supplierName || null }),
          ...(items && items.length > 0   && { totalAmount }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStockData = async (req, res) => {
  try {
    const { date, narration, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.stockDataVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty), rate: Number(item.rate) },
          });
        }
      }
      return tx.stockDataVoucher.update({
        where: { id },
        data: {
          ...(date      !== undefined && { date: new Date(date) }),
          ...(narration !== undefined && { narration: narration || null }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStockTransfer = async (req, res) => {
  try {
    const { date, narration, fromWarehouseId, fromWarehouseName, toWarehouseId, toWarehouseName, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.stockTransferVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty) },
          });
        }
      }
      return tx.stockTransferVoucher.update({
        where: { id },
        data: {
          ...(date            !== undefined && { date: new Date(date) }),
          ...(narration       !== undefined && { narration: narration || null }),
          ...(fromWarehouseId != null       && { fromWarehouseId: parseInt(fromWarehouseId), fromWarehouseName: fromWarehouseName || null }),
          ...(toWarehouseId   != null       && { toWarehouseId: parseInt(toWarehouseId), toWarehouseName: toWarehouseName || null }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getProductLedger = async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    if (!productId || !warehouseId) {
      return res.status(400).json({ message: 'productId and warehouseId are required' });
    }

    const pid = Number(productId);
    const wid = Number(warehouseId);

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: pid },
      include: { unit: true }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch warehouse details
    const warehouse = await prisma.warehouseMaster.findUnique({
      where: { id: wid }
    });
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Fetch all voucher items for this product and warehouse
    const [
      stockDataItems,
      purchaseItems,
      salesItems,
      salesReturnItems,
      purchaseReturnItems,
      transferInItems,
      transferOutItems,
    ] = await Promise.all([
      // Stock Data (Opening)
      prisma.stockDataVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Purchases
      prisma.purchaseVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Sales
      prisma.salesVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Sales Return (warehouseId is directly on item)
      prisma.salesReturnVoucherItem.findMany({
        where: { productId: pid, warehouseId: wid },
        include: { voucher: true },
      }),
      // Purchase Return
      prisma.purchaseReturnVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Stock Transfer In
      prisma.stockTransferVoucherItem.findMany({
        where: { productId: pid, voucher: { toWarehouseId: wid } },
        include: { voucher: true },
      }),
      // Stock Transfer Out
      prisma.stockTransferVoucherItem.findMany({
        where: { productId: pid, voucher: { fromWarehouseId: wid } },
        include: { voucher: true },
      }),
    ]);

    const entries = [];

    // 1. Stock Data
    stockDataItems.forEach(item => {
      entries.push({
        id: `sd-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Stock Data',
        party: 'Opening Stock',
        qtyIn: item.qty,
        qtyOut: 0,
        rate: item.rate || 0,
        amount: item.qty * (item.rate || 0),
      });
    });

    // 2. Purchases
    purchaseItems.forEach(item => {
      entries.push({
        id: `pur-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Purchase',
        party: item.voucher.supplierName || `Supplier #${item.voucher.supplierId}`,
        qtyIn: item.qty,
        qtyOut: 0,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 3. Sales
    salesItems.forEach(item => {
      entries.push({
        id: `sal-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Sales',
        party: item.voucher.customerName || `Customer #${item.voucher.customerId}`,
        qtyIn: 0,
        qtyOut: item.qty,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 4. Sales Return
    salesReturnItems.forEach(item => {
      entries.push({
        id: `sr-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Sales Return',
        party: item.voucher.customerName || `Customer #${item.voucher.customerId}`,
        qtyIn: item.qty,
        qtyOut: 0,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 5. Purchase Return
    purchaseReturnItems.forEach(item => {
      entries.push({
        id: `pr-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Purchase Return',
        party: item.voucher.supplierName || `Supplier #${item.voucher.supplierId}`,
        qtyIn: 0,
        qtyOut: item.qty,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 6. Stock Transfer In
    transferInItems.forEach(item => {
      entries.push({
        id: `sti-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Transfer In',
        party: `From WH: ${item.voucher.fromWarehouseName || 'Warehouse ' + item.voucher.fromWarehouseId}`,
        qtyIn: item.qty,
        qtyOut: 0,
        rate: 0,
        amount: 0,
      });
    });

    // 7. Stock Transfer Out
    transferOutItems.forEach(item => {
      entries.push({
        id: `sto-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Transfer Out',
        party: `To WH: ${item.voucher.toWarehouseName || 'Warehouse ' + item.voucher.toWarehouseId}`,
        qtyIn: 0,
        qtyOut: item.qty,
        rate: 0,
        amount: 0,
      });
    });

    // Sort entries chronologically
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate cumulative balance
    let balance = 0;
    const ledger = entries.map(entry => {
      balance += (entry.qtyIn - entry.qtyOut);
      return {
        ...entry,
        balance,
      };
    });

    res.json({
      product: {
        id: product.id,
        name: product.name,
        unit: product.unit?.unitName || '',
      },
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
      },
      ledger,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Supplier Ledger ────────────────────────────────────────────────────────────
// Aggregates all supplier-related transactions from:
//  1. SupplierTransaction (opening balance, manual, purchase auto-entries)
//  2. PaymentVoucher  — payment made to supplier (DR — reduces payable)
//  3. PurchaseReturnVoucher — goods returned to supplier (DR — reduces payable)
// Sorts chronologically and computes running balance.
const getSupplierLedger = async (req, res) => {
  try {
    const supplierId = Number(req.params.supplierId);
    if (!supplierId) return res.status(400).json({ message: 'supplierId is required' });

    const branchId = getBranchId(req);

    // Fetch supplier info
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true, name: true, phone: true, email: true, address: true,
        area: true, gstNo: true, cityName: true, stateName: true, countryName: true,
        contacts: { select: { id: true, name: true, phone: true, designation: true } },
      },
    });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // 1. SupplierTransaction rows (includes auto-entry from purchase creation)
    const txRows = await prisma.supplierTransaction.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' },
    });

    // 2. Payment Vouchers for this supplier (payment = DR: reduces payable)
    const paymentFilter = { supplierId, ...(branchId ? { branchId } : {}) };
    const paymentRows = await prisma.paymentVoucher.findMany({
      where: paymentFilter,
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // 3. Purchase Vouchers for this supplier (with items)
    const purchaseFilter = { supplierId, ...(branchId ? { branchId } : {}) };
    const purchaseRows = await prisma.purchaseVoucher.findMany({
      where: purchaseFilter,
      include: {
        items:     { include: { product: { select: { id: true, name: true } } } },
        warehouse: { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // 4. Purchase Return Vouchers (return = DR: reduces payable)
    const purchaseReturnFilter = { supplierId, ...(branchId ? { branchId } : {}) };
    const purchaseReturnRows = await prisma.purchaseReturnVoucher.findMany({
      where: purchaseReturnFilter,
      include: {
        items:         { include: { product: { select: { id: true, name: true } } } },
        warehouse:     { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // 5. Receipt Vouchers from this supplier (receipt = DR: reduces payable / supplier returns money)
    const receiptFromSupplierRows = await prisma.receiptVoucher.findMany({
      where: { supplierId, ...(branchId ? { branchId } : {}) },
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Build unified ledger entries
    // voucherNo tracking set — skip supplierTransaction rows that came from purchase
    // (they are superseded by the richer purchaseVoucher data)
    const purchaseVoucherNos = new Set(purchaseRows.map(p => p.voucherNo));

    const entries = [];

    // Add supplierTransaction entries (skip those already covered by purchase vouchers)
    for (const tx of txRows) {
      // Skip auto-purchase entries — the purchaseVoucher entry below has richer data
      if (tx.source === 'purchase' && tx.refVoucherNo && purchaseVoucherNos.has(tx.refVoucherNo)) {
        continue;
      }
      entries.push({
        _date:      new Date(tx.date),
        type:       tx.type,
        amount:     tx.amount,
        kind:       tx.source === 'opening_balance' ? 'opening_balance'
                  : tx.source === 'purchase'        ? 'purchase'
                  : 'manual',
        voucherNo:  tx.refVoucherNo || null,
        source:     tx.source || 'manual',
        items:      [],
        meta:       {},
      });
    }

    // Add Purchase Vouchers (CR — increases payable)
    for (const pv of purchaseRows) {
      entries.push({
        _date:          new Date(pv.date),
        type:           'CR',
        amount:         pv.totalAmount,
        kind:           'purchase',
        voucherNo:      pv.voucherNo,
        source:         'purchase',
        particularName: pv.supplierName || supplier.name,
        particularType: 'supplier',
        items:      pv.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.product?.name,
          qty:         i.qty,
          rate:        i.rate,
          subTotal:    i.subTotal,
          taxRate:     i.taxRate,
          taxAmount:   i.taxAmount,
          discount:    i.discountAmount,
          amount:      i.amount,
        })),
        meta: {
          warehouseName:  pv.warehouseName || pv.warehouse?.name || null,
          paymentTerms:   pv.paymentTerms || null,
          subTotal:       pv.subTotal,
          taxAmount:      pv.taxAmount,
          discountAmount: pv.discountAmount,
          branch:         pv.branch?.name || null,
          createdBy:      pv.createdBy?.name || null,
        },
      });
    }

    // Add Payment Vouchers (DR — reduces payable)
    for (const pv of paymentRows) {
      entries.push({
        _date:          new Date(pv.date),
        type:           'DR',
        amount:         pv.amount,
        kind:           'payment',
        voucherNo:      pv.voucherNo,
        source:         'payment',
        particularName: pv.particularName || supplier.name,
        particularType: pv.particularType || 'supplier',
        items:          [],
        meta: {
          paymentMethod: pv.paymentMethod?.name || null,
          branch:        pv.branch?.name || null,
          createdBy:     pv.createdBy?.name || null,
        },
      });
    }

    // Add Receipt Vouchers from supplier (DR — reduces payable / supplier refund)
    for (const rv of receiptFromSupplierRows) {
      entries.push({
        _date:          new Date(rv.date),
        type:           'DR',
        kind:           'receipt_from_supplier',
        voucherNo:      rv.voucherNo,
        source:         'receipt_from_supplier',
        amount:         rv.amount,
        particularName: rv.particularName || supplier.name,
        particularType: rv.particularType || 'supplier',
        items:          [],
        meta: {
          paymentMethod: rv.paymentMethod?.name || null,
          branch:        rv.branch?.name || null,
          createdBy:     rv.createdBy?.name || null,
        },
      });
    }

    // Add Purchase Return Vouchers (DR — reduces payable)
    for (const prv of purchaseReturnRows) {
      entries.push({
        _date:          new Date(prv.date),
        type:           'DR',
        amount:         prv.totalAmount,
        kind:           'purchase_return',
        voucherNo:      prv.voucherNo,
        source:         'purchase_return',
        particularName: prv.supplierName || supplier.name,
        particularType: 'supplier',
        items:      prv.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.product?.name,
          qty:         i.qty,
          rate:        i.rate,
          subTotal:    i.subTotal,
          taxRate:     i.taxRate,
          taxAmount:   i.taxAmount,
          discount:    i.discountAmount,
          amount:      i.amount,
        })),
        meta: {
          warehouseName:  prv.warehouseName || prv.warehouse?.name || null,
          paymentMethod:  prv.paymentMethodName || prv.paymentMethod?.name || null,
          subTotal:       prv.subTotal,
          taxAmount:      prv.taxAmount,
          discountAmount: prv.discountAmount,
          branch:         prv.branch?.name || null,
          createdBy:      prv.createdBy?.name || null,
        },
      });
    }

    // Sort chronologically
    entries.sort((a, b) => a._date - b._date);

    // Compute running balance
    let balance = 0;
    const ledger = entries.map((e, idx) => {
      // CR increases amount owed (payable), DR decreases it
      balance += e.type === 'CR' ? e.amount : -e.amount;
      const { _date, ...rest } = e;
      return {
        id:      idx + 1,
        date:    _date.toISOString(),
        balance: Math.round(balance * 100) / 100,
        ...rest,
      };
    });

    // Summary stats
    const totalPurchases           = purchaseRows.reduce((s, p) => s + p.totalAmount, 0);
    const totalPurchaseReturns     = purchaseReturnRows.reduce((s, p) => s + p.totalAmount, 0);
    const totalPayments            = paymentRows.reduce((s, p) => s + p.amount, 0);
    const totalReceiptsFromSupplier = receiptFromSupplierRows.reduce((s, r) => s + r.amount, 0);
    const closingBalance           = ledger.length ? ledger[ledger.length - 1].balance : 0;

    res.json({
      supplier,
      ledger,
      summary: {
        totalPurchases:            Math.round(totalPurchases            * 100) / 100,
        totalPurchaseReturns:      Math.round(totalPurchaseReturns      * 100) / 100,
        totalPayments:             Math.round(totalPayments             * 100) / 100,
        totalReceiptsFromSupplier: Math.round(totalReceiptsFromSupplier * 100) / 100,
        closingBalance:            Math.round(closingBalance            * 100) / 100,
        totalEntries:              ledger.length,
      },
    });
  } catch (err) {
    console.error('getSupplierLedger error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// ── Customer Ledger ────────────────────────────────────────────────────────────
const getCustomerLedger = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) return res.status(400).json({ message: 'customerId is required' });

    const branchId = getBranchId(req);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true, name: true, phone: true, email: true, address: true,
        area: true, gstNo: true, cityName: true, stateName: true, countryName: true,
        contacts: { select: { id: true, name: true, phone: true, designation: true } },
      },
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const txRows = await prisma.customerTransaction.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
    });

    const receiptRows = await prisma.receiptVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const salesRows = await prisma.salesVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        items:     { include: { product: { select: { id: true, name: true } } } },
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const salesReturnRows = await prisma.salesReturnVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        items:     { include: { product: { select: { id: true, name: true } } } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const paymentToCustomerRows = await prisma.paymentVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const salesVoucherNos = new Set(salesRows.map(s => s.voucherNo));
    const entries = [];

    for (const tx of txRows) {
      if (tx.source === 'sales' && tx.refVoucherNo && salesVoucherNos.has(tx.refVoucherNo)) continue;
      entries.push({
        _date:     new Date(tx.date),
        type:      tx.type,
        amount:    tx.amount,
        voucherNo: tx.refVoucherNo || null,
        narration: tx.note || null,
        source:    tx.source === 'opening_balance' ? 'opening_balance' : (tx.source || 'manual'),
        items:     [],
        meta:      {},
      });
    }

    for (const rv of receiptRows) {
      entries.push({
        _date:          new Date(rv.date),
        type:           'DR',
        amount:         rv.amount,
        voucherNo:      rv.voucherNo,
        source:         'receipt',
        particularName: rv.particularName || customer.name,
        particularType: rv.particularType || 'customer',
        items:          [],
        meta: {
          paymentMethod: rv.paymentMethod?.name || null,
          branch:        rv.branch?.name || null,
          createdBy:     rv.createdBy?.name || null,
        },
      });
    }

    for (const pv of paymentToCustomerRows) {
      entries.push({
        _date:          new Date(pv.date),
        type:           'DR',
        amount:         pv.amount,
        voucherNo:      pv.voucherNo,
        source:         'payment_to_customer',
        particularName: pv.particularName || customer.name,
        particularType: pv.particularType || 'customer',
        items:          [],
        meta: {
          paymentMethod: pv.paymentMethod?.name || null,
          branch:        pv.branch?.name || null,
          createdBy:     pv.createdBy?.name || null,
        },
      });
    }

    for (const sv of salesRows) {
      entries.push({
        _date:          new Date(sv.date),
        type:           'CR',
        amount:         sv.totalAmount,
        voucherNo:      sv.voucherNo,
        source:         'sales',
        particularName: sv.customerName || customer.name,
        particularType: 'customer',
        items:     sv.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.product?.name,
          qty:         i.qty,
          rate:        i.rate,
          subTotal:    i.subTotal,
          taxRate:     i.taxRate,
          taxAmount:   i.taxAmount,
          discount:    i.discountAmount,
          amount:      i.amount,
        })),
        meta: {
          warehouseName:  sv.warehouseName || sv.warehouse?.name || null,
          paymentTerms:   sv.paymentTerms || null,
          subTotal:       sv.subTotal,
          taxAmount:      sv.taxAmount,
          discountAmount: sv.discountAmount,
          branch:         sv.branch?.name || null,
          createdBy:      sv.createdBy?.name || null,
        },
      });
    }

    for (const srv of salesReturnRows) {
      entries.push({
        _date:          new Date(srv.date),
        type:           'DR',
        amount:         srv.totalAmount,
        voucherNo:      srv.voucherNo,
        source:         'sales_return',
        particularName: srv.customerName || customer.name,
        particularType: 'customer',
        items:     srv.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.product?.name,
          qty:         i.qty,
          rate:        i.rate,
          subTotal:    i.subTotal,
          taxRate:     i.taxRate,
          taxAmount:   i.taxAmount,
          discount:    i.discountAmount,
          amount:      i.amount,
        })),
        meta: {
          subTotal:       srv.subTotal,
          taxAmount:      srv.taxAmount,
          discountAmount: srv.discountAmount,
          branch:         srv.branch?.name || null,
          createdBy:      srv.createdBy?.name || null,
        },
      });
    }

    entries.sort((a, b) => a._date - b._date);

    let balance = 0;
    const ledger = entries.map((e, idx) => {
      balance += e.type === 'CR' ? e.amount : -e.amount;
      const { _date, ...rest } = e;
      return { id: idx + 1, date: _date.toISOString(), balance: Math.round(balance * 100) / 100, ...rest };
    });

    res.json({
      customer,
      ledger,
      summary: {
        totalSales:              Math.round(salesRows.reduce((s, v) => s + v.totalAmount, 0)          * 100) / 100,
        totalSalesReturns:       Math.round(salesReturnRows.reduce((s, v) => s + v.totalAmount, 0)    * 100) / 100,
        totalReceipts:           Math.round(receiptRows.reduce((s, v) => s + v.amount, 0)             * 100) / 100,
        totalPaymentsToCustomer: Math.round(paymentToCustomerRows.reduce((s, v) => s + v.amount, 0)  * 100) / 100,
        closingBalance:          Math.round((ledger.length ? ledger[ledger.length - 1].balance : 0)   * 100) / 100,
        totalEntries:            ledger.length,
      },
    });
  } catch (err) {
    console.error('getCustomerLedger error:', err);
    res.status(500).json({ message: 'Server error' });
  }
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
  getProductLedger,
  getSupplierLedger,
  getCustomerLedger,
  getDayBook,
  getMoneyLedger,
  getReceivablesLedger,
};
