const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

// ── Products ───────────────────────────────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, lowerLimit: true, upperLimit: true, barcode: true,
        category: { select: { id: true, name: true } },
        unit:     { select: { id: true, unitName: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createProduct = async (req, res) => {
  try {
    const { name, categoryId, unitId, lowerLimit, upperLimit, barcode } = req.body;
    if (!name || !categoryId || !unitId || lowerLimit == null || upperLimit == null) {
      return res.status(400).json({ message: 'name, categoryId, unitId, lowerLimit, and upperLimit are required' });
    }
    const branchId = getBranchId(req);
    const data = {
      name: name.trim(),
      categoryId: Number(categoryId),
      unitId:     Number(unitId),
      lowerLimit: Number(lowerLimit),
      upperLimit: Number(upperLimit),
      branchId:   branchId || null,
    };
    if (barcode) data.barcode = barcode.trim();
    const row = await prisma.product.create({
      data,
      select: { id: true, name: true, lowerLimit: true, upperLimit: true, barcode: true, category: { select: { id: true, name: true } }, unit: { select: { id: true, unitName: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'Barcode already exists' : prismaErr(err) });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, categoryId, unitId, lowerLimit, upperLimit, barcode } = req.body;
    const data = {};
    if (name)                data.name       = name.trim();
    if (categoryId)          data.categoryId = Number(categoryId);
    if (unitId)              data.unitId     = Number(unitId);
    if (lowerLimit != null)  data.lowerLimit = Number(lowerLimit);
    if (upperLimit != null)  data.upperLimit = Number(upperLimit);
    if (barcode !== undefined) data.barcode  = barcode?.trim() || null;
    const row = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, lowerLimit: true, upperLimit: true, barcode: true, category: { select: { id: true, name: true } }, unit: { select: { id: true, unitName: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [purchase, sales, purchaseReturn, salesReturn, stockData, stockTransfer] = await Promise.all([
      prisma.purchaseVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.salesVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.purchaseReturnVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.salesReturnVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.stockDataVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.stockTransferVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
    ]);
    const linked = [
      purchase       && 'Purchase vouchers',
      sales          && 'Sales vouchers',
      purchaseReturn && 'Purchase Return vouchers',
      salesReturn    && 'Sales Return vouchers',
      stockData      && 'Stock Data vouchers',
      stockTransfer  && 'Stock Transfer vouchers',
    ].filter(Boolean);
    if (linked.length) return res.status(400).json({ message: `Cannot delete — this product is linked to: ${linked.join(', ')}.` });
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

const forceDeleteVouchersForProducts = async (productIds) => {
  if (!productIds.length) return;
  const [pvIds, prvIds, svIds, srvIds, sdvIds, stIds] = await Promise.all([
    prisma.purchaseVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.purchaseReturnVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.salesVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.salesReturnVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.stockDataVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.stockTransferVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
  ]);
  const uniq = (arr) => [...new Set(arr.map(i => i.voucherId))];
  const ops = [];
  const pv = uniq(pvIds); if (pv.length) ops.push(prisma.purchaseVoucher.deleteMany({ where: { id: { in: pv } } }));
  const prv = uniq(prvIds); if (prv.length) ops.push(prisma.purchaseReturnVoucher.deleteMany({ where: { id: { in: prv } } }));
  const sv = uniq(svIds); if (sv.length) ops.push(prisma.salesVoucher.deleteMany({ where: { id: { in: sv } } }));
  const srv = uniq(srvIds); if (srv.length) ops.push(prisma.salesReturnVoucher.deleteMany({ where: { id: { in: srv } } }));
  const sdv = uniq(sdvIds); if (sdv.length) ops.push(prisma.stockDataVoucher.deleteMany({ where: { id: { in: sdv } } }));
  const st = uniq(stIds); if (st.length) ops.push(prisma.stockTransferVoucher.deleteMany({ where: { id: { in: st } } }));
  if (ops.length) await prisma.$transaction(ops);
};

const forceDeleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await forceDeleteVouchersForProducts([id]);
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product and all linked vouchers deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, forceDeleteProduct };
