const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

const branchSelect = {
  id: true, name: true, address: true, area: true, createdAt: true,
  city:    { select: { id: true, name: true } },
  state:   { select: { id: true, name: true } },
  country: { select: { id: true, name: true, currency: true, phoneCode: true } },
};

// ── Branches ───────────────────────────────────────────────────────────────────
const getBranches = async (req, res) => {
  try {
    const rows = await prisma.branch.findMany({ orderBy: { name: 'asc' }, select: branchSelect });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createBranch = async (req, res) => {
  try {
    const { name, address, area, cityId, stateId, countryId } = req.body;
    if (!name) return res.status(400).json({ message: 'Branch name is required' });
    const row = await prisma.branch.create({
      data: {
        name: name.trim(),
        ...(address   && { address }),
        ...(area      && { area }),
        ...(cityId    && { cityId:    parseInt(cityId) }),
        ...(stateId   && { stateId:   parseInt(stateId) }),
        ...(countryId && { countryId: parseInt(countryId) }),
      },
      select: branchSelect,
    });
    res.status(201).json(row);
  } catch (err) {
    console.error('createBranch error:', err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'A branch with that name already exists.' });
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { name, address, area, cityId, stateId, countryId } = req.body;
    const data = {};
    if (name)      data.name      = name.trim();
    if (address !== undefined) data.address = address || null;
    if (area    !== undefined) data.area    = area    || null;
    if (cityId    !== undefined) data.cityId    = cityId    ? parseInt(cityId)    : null;
    if (stateId   !== undefined) data.stateId   = stateId   ? parseInt(stateId)   : null;
    if (countryId !== undefined) data.countryId = countryId ? parseInt(countryId) : null;
    const row = await prisma.branch.update({ where: { id: Number(req.params.id) }, data, select: branchSelect });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteBranch = async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Branch Master (voucher dropdowns — branch-specific) ────────────────────────
const getBranchMasters = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const rows = await prisma.branchMaster.findMany({
      where: branchId ? { branchId } : {},
      select: { id: true, name: true, branchId: true, branchName: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ message: prismaErr(err) }); }
};

const createBranchMaster = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    const branchId = getBranchId(req);
    let branchName = null;
    if (branchId) {
      const branchRec = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } });
      branchName = branchRec?.name || null;
    }
    const row = await prisma.branchMaster.create({
      data: { name: name.trim(), ...(branchId && { branchId, branchName }) },
    });
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'A branch master with that name already exists in this branch.' });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updateBranchMaster = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.branchMaster.update({ where: { id: Number(req.params.id) }, data: { name: name.trim() } });
    res.json(row);
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteBranchMaster = async (req, res) => {
  try {
    await prisma.branchMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

// ── Force Delete Branch ────────────────────────────────────────────────────────
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

const forceDeleteBranch = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [custIds, suppIds, prodIds] = await Promise.all([
      prisma.customer.findMany({ where: { branchId: id }, select: { id: true } }),
      prisma.supplier.findMany({ where: { branchId: id }, select: { id: true } }),
      prisma.product.findMany({ where: { branchId: id }, select: { id: true } }),
    ]);
    const cIds = custIds.map(c => c.id);
    const sIds = suppIds.map(s => s.id);
    const pIds = prodIds.map(p => p.id);
    await forceDeleteVouchersForProducts(pIds);
    await prisma.$transaction([
      prisma.receiptVoucher.deleteMany({ where: { branchId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { branchId: id } }),
      prisma.salesVoucher.deleteMany({ where: { branchId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { branchId: id } }),
      prisma.salesReturnVoucher.deleteMany({ where: { branchId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { branchId: id } }),
      prisma.stockDataVoucher.deleteMany({ where: { branchId: id } }),
      prisma.stockTransferVoucher.deleteMany({ where: { branchId: id } }),
      prisma.contraVoucher.deleteMany({ where: { branchId: id } }),
      ...(cIds.length ? [prisma.customer.deleteMany({ where: { id: { in: cIds } } })] : []),
      ...(sIds.length ? [prisma.supplier.deleteMany({ where: { id: { in: sIds } } })] : []),
      ...(pIds.length ? [prisma.product.deleteMany({ where: { id: { in: pIds } } })] : []),
      prisma.warehouseMaster.deleteMany({ where: { branchId: id } }),
      prisma.paymentMethodMaster.deleteMany({ where: { branchId: id } }),
      prisma.expenseMaster.deleteMany({ where: { branchId: id } }),
      prisma.categoryMaster.deleteMany({ where: { branchId: id } }),
      prisma.unitMaster.deleteMany({ where: { branchId: id } }),
      prisma.branchMaster.deleteMany({ where: { branchId: id } }),
      prisma.dashboardBalance.deleteMany({ where: { branchId: id } }),
      prisma.user.deleteMany({ where: { branchId: id } }),
      prisma.branch.delete({ where: { id } }),
    ]);
    res.json({ message: 'Branch and all linked data deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = {
  getBranches, createBranch, updateBranch, deleteBranch,
  getBranchMasters, createBranchMaster, updateBranchMaster, deleteBranchMaster,
  forceDeleteBranch,
};
