const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

// ── Warehouses ─────────────────────────────────────────────────────────────────
const getWarehouses = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.warehouseMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createWarehouse = async (req, res) => {
  const { name, address, area, cityId } = req.body;
  if (!name) return res.status(400).json({ message: 'Warehouse name is required' });
  try {
    const branchId = getBranchId(req);
    const row = await prisma.warehouseMaster.create({
      data: {
        name,
        address: address || null,
        area:    area    || null,
        cityId:  cityId  ? parseInt(cityId) : undefined,
        branchId: branchId || null,
      },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const updateWarehouse = async (req, res) => {
  const { name, address, area, cityId } = req.body;
  try {
    const row = await prisma.warehouseMaster.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        address: address || null,
        area:    area    || null,
        cityId:  cityId  ? parseInt(cityId) : undefined,
      },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteWarehouse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [purchase, sales, purchaseReturn, salesReturnItem] = await Promise.all([
      prisma.purchaseVoucher.findFirst({ where: { warehouseId: id }, select: { id: true } }),
      prisma.salesVoucher.findFirst({ where: { warehouseId: id }, select: { id: true } }),
      prisma.purchaseReturnVoucher.findFirst({ where: { warehouseId: id }, select: { id: true } }),
      prisma.salesReturnVoucherItem.findFirst({ where: { warehouseId: id }, select: { id: true } }),
    ]);
    const linked = [
      purchase        && 'Purchase vouchers',
      sales           && 'Sales vouchers',
      purchaseReturn  && 'Purchase Return vouchers',
      salesReturnItem && 'Sales Return vouchers',
    ].filter(Boolean);
    if (linked.length) return res.status(400).json({ message: `Cannot delete — this warehouse is linked to: ${linked.join(', ')}.` });
    await prisma.warehouseMaster.delete({ where: { id } });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

const forceDeleteWarehouse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Find SalesReturnVouchers that have items tied to this warehouse
    const srvItems = await prisma.salesReturnVoucherItem.findMany({ where: { warehouseId: id }, select: { voucherId: true } });
    const srvIds = [...new Set(srvItems.map(i => i.voucherId))];
    await prisma.$transaction([
      prisma.salesVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.stockDataVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.stockTransferVoucher.deleteMany({ where: { OR: [{ fromWarehouseId: id }, { toWarehouseId: id }] } }),
      ...(srvIds.length ? [prisma.salesReturnVoucher.deleteMany({ where: { id: { in: srvIds } } })] : []),
      prisma.warehouseMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Warehouse and all linked vouchers deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, forceDeleteWarehouse };
