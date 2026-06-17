const prisma = require('../../utils/prisma');
const { prismaErr, nextNo, withVoucherRetry, getBranchId } = require('./voucherHelpers');

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

const deleteSales = async (req, res) => {
  try {
    await prisma.salesVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

module.exports = { getSalesNextNo, getSales, createSales, updateSales, deleteSales };
