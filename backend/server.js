const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('.prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Warehouse Master ─────────────────────────────────────────────────────────

app.get('/api/warehouses', async (_req, res) => {
  try {
    const warehouses = await prisma.warehouseMaster.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  const { name, address, cityId, areaId } = req.body;
  if (!name) return res.status(400).json({ error: 'Warehouse name is required' });
  try {
    const warehouse = await prisma.warehouseMaster.create({
      data: {
        name,
        address,
        cityId: cityId ? parseInt(cityId) : undefined,
        areaId: areaId ? parseInt(areaId) : undefined,
      },
    });
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/warehouses/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.warehouseMaster.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Products (dropdown) ──────────────────────────────────────────────────────

app.get('/api/products', async (_req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stock Data Voucher ───────────────────────────────────────────────────────

async function nextStockDataVoucherNo() {
  const year = new Date().getFullYear();
  const prefix = `SDV-${year}-`;
  const last = await prisma.stockDataVoucher.findFirst({
    where: { voucherNo: { startsWith: prefix } },
    orderBy: { voucherNo: 'desc' },
  });
  const seq = last ? parseInt(last.voucherNo.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

app.get('/api/stock-data-vouchers/next-number', async (_req, res) => {
  try {
    res.json({ voucherNo: await nextStockDataVoucherNo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stock-data-vouchers', async (_req, res) => {
  try {
    const vouchers = await prisma.stockDataVoucher.findMany({
      include: { warehouse: true, product: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-data-vouchers', async (req, res) => {
  const { date, warehouseId, productId, qty, narration, createdById = 1 } = req.body;
  if (!warehouseId) return res.status(400).json({ error: 'Warehouse is required' });
  if (!productId) return res.status(400).json({ error: 'Product is required' });
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
  try {
    const voucherNo = await nextStockDataVoucherNo();
    const voucher = await prisma.stockDataVoucher.create({
      data: {
        voucherNo,
        date: date ? new Date(date) : new Date(),
        narration,
        warehouseId: parseInt(warehouseId),
        productId: parseInt(productId),
        qty: parseFloat(qty),
        createdById: parseInt(createdById),
      },
    });
    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Stock Transfer Voucher ───────────────────────────────────────────────────

async function nextStockTransferVoucherNo() {
  const year = new Date().getFullYear();
  const prefix = `STV-${year}-`;
  const last = await prisma.stockTransferVoucher.findFirst({
    where: { voucherNo: { startsWith: prefix } },
    orderBy: { voucherNo: 'desc' },
  });
  const seq = last ? parseInt(last.voucherNo.split('-')[2]) + 1 : 1;
  return `${prefix}${String(seq).padStart(3, '0')}`;
}

app.get('/api/stock-transfer-vouchers/next-number', async (_req, res) => {
  try {
    res.json({ voucherNo: await nextStockTransferVoucherNo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stock-transfer-vouchers', async (_req, res) => {
  try {
    const vouchers = await prisma.stockTransferVoucher.findMany({
      include: { fromWarehouse: true, toWarehouse: true, product: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-transfer-vouchers', async (req, res) => {
  const { date, fromWarehouseId, toWarehouseId, productId, qty, narration, createdById = 1 } = req.body;
  if (!fromWarehouseId || !toWarehouseId)
    return res.status(400).json({ error: 'Both warehouses are required' });
  if (parseInt(fromWarehouseId) === parseInt(toWarehouseId))
    return res.status(400).json({ error: 'Source and destination warehouses must be different' });
  if (!productId) return res.status(400).json({ error: 'Product is required' });
  if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantity must be greater than 0' });
  try {
    const voucherNo = await nextStockTransferVoucherNo();
    const voucher = await prisma.stockTransferVoucher.create({
      data: {
        voucherNo,
        date: date ? new Date(date) : new Date(),
        narration,
        fromWarehouseId: parseInt(fromWarehouseId),
        toWarehouseId: parseInt(toWarehouseId),
        productId: parseInt(productId),
        qty: parseFloat(qty),
        createdById: parseInt(createdById),
      },
    });
    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
