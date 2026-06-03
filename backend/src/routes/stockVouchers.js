const express = require('express');
const prisma   = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

// ── Helper: auto voucher number ───────────────────────────────
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

// ── Stock Data Voucher ────────────────────────────────────────
router.get('/data/next-number', async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('stockDataVoucher', 'SDV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/data', async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const vouchers = await prisma.stockDataVoucher.findMany({
      where,
      include: { warehouse: true, product: true, createdBy: { select: { name: true } }, branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/data', async (req, res) => {
  const { date, warehouseId, productId, qty, narration } = req.body;
  if (!warehouseId) return res.status(400).json({ message: 'Warehouse is required' });
  if (!productId)   return res.status(400).json({ message: 'Product is required' });
  if (!qty || qty <= 0) return res.status(400).json({ message: 'Qty must be > 0' });
  try {
    const branchId = getBranchId(req);
    const voucher = await prisma.stockDataVoucher.create({
      data: {
        voucherNo:   await nextNo('stockDataVoucher', 'SDV'),
        date:        date ? new Date(date) : new Date(),
        narration,
        warehouseId: parseInt(warehouseId),
        productId:   parseInt(productId),
        qty:         parseFloat(qty),
        createdById: req.user.id,
        branchId:    branchId || null,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Stock Transfer Voucher ────────────────────────────────────
router.get('/transfer/next-number', async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('stockTransferVoucher', 'STV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/transfer', async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const vouchers = await prisma.stockTransferVoucher.findMany({
      where,
      include: { fromWarehouse: true, toWarehouse: true, product: true, createdBy: { select: { name: true } }, branch: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/transfer', async (req, res) => {
  const { date, fromWarehouseId, toWarehouseId, productId, qty, narration } = req.body;
  if (!fromWarehouseId || !toWarehouseId)
    return res.status(400).json({ message: 'Both warehouses are required' });
  if (parseInt(fromWarehouseId) === parseInt(toWarehouseId))
    return res.status(400).json({ message: 'Source and destination must be different' });
  if (!productId) return res.status(400).json({ message: 'Product is required' });
  if (!qty || qty <= 0) return res.status(400).json({ message: 'Qty must be > 0' });
  try {
    const branchId = getBranchId(req);
    const [fromWH, toWH] = await Promise.all([
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(fromWarehouseId) }, select: { name: true } }),
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(toWarehouseId) },   select: { name: true } }),
    ]);
    const voucher = await prisma.stockTransferVoucher.create({
      data: {
        voucherNo:         await nextNo('stockTransferVoucher', 'STV'),
        date:              date ? new Date(date) : new Date(),
        narration,
        fromWarehouseId:   parseInt(fromWarehouseId),
        toWarehouseId:     parseInt(toWarehouseId),
        fromWarehouseName: fromWH?.name ?? null,
        toWarehouseName:   toWH?.name   ?? null,
        productId:         parseInt(productId),
        qty:               parseFloat(qty),
        createdById:       req.user.id,
        branchId:          branchId || null,
      },
    });
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── Products list (for dropdowns) ────────────────────────────
router.get('/products', async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const products = await prisma.product.findMany({ where, orderBy: { name: 'asc' }, select: { id: true, name: true } });
    res.json(products);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
