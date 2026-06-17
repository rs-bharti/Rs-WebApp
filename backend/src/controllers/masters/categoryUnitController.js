const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

// ── Categories ─────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.categoryMaster.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.categoryMaster.create({
      data: { name: name.trim(), branchId: branchId || null },
      select: { id: true, name: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'Category already exists' });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.categoryMaster.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteCategory = async (req, res) => {
  try {
    await prisma.categoryMaster.delete({ where: { id: Number(req.params.id) } });
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

const forceDeleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const products = await prisma.product.findMany({ where: { categoryId: id }, select: { id: true } });
    await forceDeleteVouchersForProducts(products.map(p => p.id));
    await prisma.$transaction([
      ...(products.length ? [prisma.product.deleteMany({ where: { categoryId: id } })] : []),
      prisma.categoryMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Category and all linked products deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

// ── Units ──────────────────────────────────────────────────────────────────────
const getUnits = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.unitMaster.findMany({
      where,
      select: { id: true, unitName: true, shortName: true },
      orderBy: { unitName: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createUnit = async (req, res) => {
  try {
    const { unitName, shortName } = req.body;
    if (!unitName) return res.status(400).json({ message: 'unitName is required' });
    const branchId = getBranchId(req);
    const row = await prisma.unitMaster.create({
      data: { unitName: unitName.trim(), shortName: shortName?.trim() || null, branchId: branchId || null },
      select: { id: true, unitName: true, shortName: true },
    });
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Unit already exists in this branch' });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { unitName, shortName } = req.body;
    const data = {};
    if (unitName) data.unitName = unitName.trim();
    if (shortName !== undefined) data.shortName = shortName?.trim() || null;
    const row = await prisma.unitMaster.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, unitName: true, shortName: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteUnit = async (req, res) => {
  try {
    await prisma.unitMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

const forceDeleteUnit = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const products = await prisma.product.findMany({ where: { unitId: id }, select: { id: true } });
    await forceDeleteVouchersForProducts(products.map(p => p.id));
    await prisma.$transaction([
      ...(products.length ? [prisma.product.deleteMany({ where: { unitId: id } })] : []),
      prisma.unitMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Unit and all linked products deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = {
  getCategories, createCategory, updateCategory, deleteCategory, forceDeleteCategory,
  getUnits,      createUnit,     updateUnit,     deleteUnit,     forceDeleteUnit,
};
