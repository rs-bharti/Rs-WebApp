const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('.prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ─── Warehouse Master ────────────────────────────────────────────────────────

app.get('/api/warehouses', async (req, res) => {
  try {
    const warehouses = await prisma.warehouseMaster.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/warehouses', async (req, res) => {
  const { name, address, city, area } = req.body;
  if (!name) return res.status(400).json({ error: 'Warehouse name is required' });
  try {
    const warehouse = await prisma.warehouseMaster.create({
      data: { name, address, city, area },
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

// ─── Products (for dropdown in vouchers) ─────────────────────────────────────

app.get('/api/products', async (req, res) => {
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

app.get('/api/stock-data-vouchers/next-number', async (req, res) => {
  try {
    res.json({ voucherNo: await nextStockDataVoucherNo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stock-data-vouchers', async (req, res) => {
  try {
    const vouchers = await prisma.stockDataVoucher.findMany({
      include: { warehouse: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-data-vouchers', async (req, res) => {
  const { date, warehouseId, note, items, branchId = 1, createdById = 1 } = req.body;
  if (!items || items.length === 0)
    return res.status(400).json({ error: 'At least one stock item is required' });

  const validItems = items.filter(i => i.productId && i.qty > 0);
  if (validItems.length === 0)
    return res.status(400).json({ error: 'Each item needs a product and quantity > 0' });

  try {
    const voucherNo = await nextStockDataVoucherNo();
    const voucher = await prisma.stockDataVoucher.create({
      data: {
        voucherNo,
        date: date ? new Date(date) : new Date(),
        note,
        branchId,
        createdById,
        warehouseId: warehouseId || null,
        items: {
          create: validItems.map(i => ({
            productId: parseInt(i.productId),
            qty: parseFloat(i.qty),
          })),
        },
      },
      include: { items: true },
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

app.get('/api/stock-transfer-vouchers/next-number', async (req, res) => {
  try {
    res.json({ voucherNo: await nextStockTransferVoucherNo() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stock-transfer-vouchers', async (req, res) => {
  try {
    const vouchers = await prisma.stockTransferVoucher.findMany({
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stock-transfer-vouchers', async (req, res) => {
  const { date, fromWarehouseId, toWarehouseId, note, items, createdById = 1 } = req.body;
  if (!fromWarehouseId || !toWarehouseId)
    return res.status(400).json({ error: 'Both source and destination warehouses are required' });
  if (fromWarehouseId === toWarehouseId)
    return res.status(400).json({ error: 'Source and destination warehouses must be different' });
  if (!items || items.length === 0)
    return res.status(400).json({ error: 'At least one transfer item is required' });

  const validItems = items.filter(i => i.productId && i.qty > 0);
  if (validItems.length === 0)
    return res.status(400).json({ error: 'Each item needs a product and quantity > 0' });

  try {
    const voucherNo = await nextStockTransferVoucherNo();
    const voucher = await prisma.stockTransferVoucher.create({
      data: {
        voucherNo,
        date: date ? new Date(date) : new Date(),
        note,
        fromWarehouseId: parseInt(fromWarehouseId),
        toWarehouseId: parseInt(toWarehouseId),
        createdById,
        items: {
          create: validItems.map(i => ({
            productId: parseInt(i.productId),
            qty: parseFloat(i.qty),
          })),
        },
      },
      include: { items: true },
    });
    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
