const prisma = require('../../utils/prisma');
const { prismaErr, nextNo, withVoucherRetry, getBranchId } = require('./voucherHelpers');

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

module.exports = { getPurchaseNextNo, getPurchases, createPurchase, updatePurchase, deletePurchase };
