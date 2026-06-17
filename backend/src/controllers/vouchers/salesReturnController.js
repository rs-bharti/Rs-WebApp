const prisma = require('../../utils/prisma');
const { prismaErr, nextNo, withVoucherRetry, getBranchId } = require('./voucherHelpers');

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

const deleteSalesReturn = async (req, res) => {
  try {
    await prisma.salesReturnVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

module.exports = { getSalesReturnNextNo, getSalesReturns, createSalesReturn, updateSalesReturn, deleteSalesReturn };
