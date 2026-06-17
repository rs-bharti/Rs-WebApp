const prisma = require('../../utils/prisma');
const { prismaErr, nextNo, withVoucherRetry, getBranchId } = require('./voucherHelpers');

// ── Stock Data Voucher ─────────────────────────────────────────────────────────
const getStockDataNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('stockDataVoucher', 'SDV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getStockData = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const vouchers = await prisma.stockDataVoucher.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        items:     { include: { product: { select: { id: true, name: true } } } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStockData = async (req, res) => {
  const { date, warehouseId, items, narration } = req.body;
  if (!warehouseId) return res.status(400).json({ message: 'Warehouse is required' });
  if (!items?.length) return res.status(400).json({ message: 'At least one product item is required' });

  const validItems = items.filter(i => i.productId && parseFloat(i.qty) > 0);
  if (!validItems.length) return res.status(400).json({ message: 'Each item must have a product and qty > 0' });

  try {
    const branchId = getBranchId(req);
    const [warehouseRecord, productRecords] = await Promise.all([
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(warehouseId) }, select: { name: true } }),
      prisma.product.findMany({
        where: { id: { in: validItems.map(i => parseInt(i.productId)) } },
        select: { id: true, name: true },
      }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const voucher = await withVoucherRetry(async () => prisma.stockDataVoucher.create({
      data: {
        voucherNo:     await nextNo('stockDataVoucher', 'SDV'),
        date:          date ? new Date(date) : new Date(),
        narration:     narration || null,
        warehouseId:   parseInt(warehouseId),
        warehouseName: warehouseRecord?.name || null,
        createdById:   req.user.id,
        branchId:      branchId || null,
        items: {
          create: validItems.map(i => ({
            productId:   parseInt(i.productId),
            productName: productNameMap[parseInt(i.productId)] || null,
            qty:         parseFloat(i.qty),
            rate:        i.rate !== undefined && i.rate !== '' ? parseFloat(i.rate) : null,
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        items:     { include: { product: { select: { id: true, name: true } } } },
      },
    }));
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStockData = async (req, res) => {
  try {
    const { date, narration, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.stockDataVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty), rate: Number(item.rate) },
          });
        }
      }
      return tx.stockDataVoucher.update({
        where: { id },
        data: {
          ...(date      !== undefined && { date: new Date(date) }),
          ...(narration !== undefined && { narration: narration || null }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteStockData = async (req, res) => {
  try {
    await prisma.stockDataVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

// ── Stock Transfer Voucher ─────────────────────────────────────────────────────
const getStockTransferNextNo = async (_req, res) => {
  try { res.json({ voucherNo: await nextNo('stockTransferVoucher', 'STV') }); }
  catch (err) { res.status(500).json({ message: err.message }); }
};

const getStockTransfers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const vouchers = await prisma.stockTransferVoucher.findMany({
      where,
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse:   { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vouchers);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const createStockTransfer = async (req, res) => {
  const { date, fromWarehouseId, toWarehouseId, items, narration } = req.body;
  if (!fromWarehouseId || !toWarehouseId)
    return res.status(400).json({ message: 'Both warehouses are required' });
  if (parseInt(fromWarehouseId) === parseInt(toWarehouseId))
    return res.status(400).json({ message: 'Source and destination must be different' });
  if (!items?.length) return res.status(400).json({ message: 'At least one product item is required' });

  const validItems = items.filter(i => i.productId && parseFloat(i.qty) > 0);
  if (!validItems.length) return res.status(400).json({ message: 'Each item must have a product and qty > 0' });

  try {
    const branchId = getBranchId(req);
    const [fromWH, toWH, productRecords] = await Promise.all([
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(fromWarehouseId) }, select: { name: true } }),
      prisma.warehouseMaster.findUnique({ where: { id: parseInt(toWarehouseId) },   select: { name: true } }),
      prisma.product.findMany({
        where: { id: { in: validItems.map(i => parseInt(i.productId)) } },
        select: { id: true, name: true },
      }),
    ]);
    const productNameMap = Object.fromEntries(productRecords.map(p => [p.id, p.name]));

    const voucher = await withVoucherRetry(async () => prisma.stockTransferVoucher.create({
      data: {
        voucherNo:         await nextNo('stockTransferVoucher', 'STV'),
        date:              date ? new Date(date) : new Date(),
        narration:         narration || null,
        fromWarehouseId:   parseInt(fromWarehouseId),
        toWarehouseId:     parseInt(toWarehouseId),
        fromWarehouseName: fromWH?.name ?? null,
        toWarehouseName:   toWH?.name   ?? null,
        createdById:       req.user.id,
        branchId:          branchId || null,
        items: {
          create: validItems.map(i => ({
            productId:   parseInt(i.productId),
            productName: productNameMap[parseInt(i.productId)] || null,
            qty:         parseFloat(i.qty),
          })),
        },
      },
      include: {
        fromWarehouse: { select: { id: true, name: true } },
        toWarehouse:   { select: { id: true, name: true } },
        items:         { include: { product: { select: { id: true, name: true } } } },
      },
    }));
    res.status(201).json(voucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const updateStockTransfer = async (req, res) => {
  try {
    const { date, narration, fromWarehouseId, fromWarehouseName, toWarehouseId, toWarehouseName, items } = req.body;
    const id = parseInt(req.params.id);

    const updatedVoucher = await prisma.$transaction(async (tx) => {
      if (items && Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          await tx.stockTransferVoucherItem.update({
            where: { id: item.id },
            data: { qty: Number(item.qty) },
          });
        }
      }
      return tx.stockTransferVoucher.update({
        where: { id },
        data: {
          ...(date            !== undefined && { date: new Date(date) }),
          ...(narration       !== undefined && { narration: narration || null }),
          ...(fromWarehouseId != null       && { fromWarehouseId: parseInt(fromWarehouseId), fromWarehouseName: fromWarehouseName || null }),
          ...(toWarehouseId   != null       && { toWarehouseId: parseInt(toWarehouseId), toWarehouseName: toWarehouseName || null }),
        },
        include: { items: { include: { product: { select: { name: true } } } } },
      });
    });
    res.json(updatedVoucher);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const deleteStockTransfer = async (req, res) => {
  try {
    await prisma.stockTransferVoucher.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

// ── Stock Qty Query ────────────────────────────────────────────────────────────
const getStockQty = async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    if (!productId || !warehouseId)
      return res.status(400).json({ message: 'productId and warehouseId are required' });

    const pid = Number(productId);
    const wid = Number(warehouseId);

    const [
      stockDataSum,
      purchaseSum,
      salesSum,
      salesReturnSum,
      purchaseReturnSum,
      transferInSum,
      transferOutSum,
    ] = await Promise.all([
      // StockData vouchers set the base quantity for that warehouse
      prisma.stockDataVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Purchases add stock to that warehouse
      prisma.purchaseVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Sales remove stock from that warehouse
      prisma.salesVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Sales returns add stock back to that warehouse
      prisma.salesReturnVoucherItem.aggregate({
        where: { productId: pid, warehouseId: wid },
        _sum: { qty: true },
      }),
      // Purchase returns remove stock from that warehouse
      prisma.purchaseReturnVoucherItem.aggregate({
        where: { productId: pid, voucher: { warehouseId: wid } },
        _sum: { qty: true },
      }),
      // Stock transferred INTO this warehouse
      prisma.stockTransferVoucherItem.aggregate({
        where: { productId: pid, voucher: { toWarehouseId: wid } },
        _sum: { qty: true },
      }),
      // Stock transferred OUT of this warehouse
      prisma.stockTransferVoucherItem.aggregate({
        where: { productId: pid, voucher: { fromWarehouseId: wid } },
        _sum: { qty: true },
      }),
    ]);

    const qty =
      (stockDataSum._sum.qty      || 0) +
      (purchaseSum._sum.qty       || 0) +
      (transferInSum._sum.qty     || 0) +
      (salesReturnSum._sum.qty    || 0) -
      (salesSum._sum.qty          || 0) -
      (purchaseReturnSum._sum.qty || 0) -
      (transferOutSum._sum.qty    || 0);

    res.json({ qty: Math.max(0, qty) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Stock Qty by Warehouse (all products) ─────────────────────────────────────
const getStockQtyByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    if (!warehouseId) return res.status(400).json({ message: 'warehouseId is required' });

    const branchId = getBranchId(req);
    const wid = Number(warehouseId);

    const products = await prisma.product.findMany({
      where: branchId ? { branchId } : {},
      include: { unit: true },
      orderBy: { name: 'asc' },
    });

    if (products.length === 0) return res.json([]);

    const pids = products.map(p => p.id);

    const [sdItems, purGroups, salGroups, srGroups, prGroups, tiGroups, toGroups] =
      await Promise.all([
        prisma.stockDataVoucherItem.findMany({
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          select: { productId: true, qty: true, rate: true },
        }),
        prisma.purchaseVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true, amount: true },
        }),
        prisma.salesVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.salesReturnVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, warehouseId: wid },
          _sum: { qty: true },
        }),
        prisma.purchaseReturnVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { warehouseId: wid } },
          _sum: { qty: true, amount: true },
        }),
        prisma.stockTransferVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { toWarehouseId: wid } },
          _sum: { qty: true },
        }),
        prisma.stockTransferVoucherItem.groupBy({
          by: ['productId'],
          where: { productId: { in: pids }, voucher: { fromWarehouseId: wid } },
          _sum: { qty: true },
        }),
      ]);

    // Aggregate stock data qty and amount (qty × rate) per product
    const sdQtyMap = {}, sdAmountMap = {};
    sdItems.forEach(item => {
      sdQtyMap[item.productId]    = (sdQtyMap[item.productId]    || 0) + item.qty;
      sdAmountMap[item.productId] = (sdAmountMap[item.productId] || 0) + item.qty * (item.rate || 0);
    });

    const buildMap    = (groups, field = 'qty') =>
      Object.fromEntries(groups.map(g => [g.productId, g._sum[field] || 0]));

    const pur    = buildMap(purGroups);
    const purAmt = buildMap(purGroups, 'amount');
    const sal    = buildMap(salGroups);
    const sr     = buildMap(srGroups);
    const pr     = buildMap(prGroups);
    const prAmt  = buildMap(prGroups, 'amount');
    const ti     = buildMap(tiGroups);
    const to     = buildMap(toGroups);

    const result = products.map(p => ({
      id:     p.id,
      name:   p.name,
      unit:   p.unit?.unitName || '',
      qty:    Math.max(0,
        (sdQtyMap[p.id] || 0) +
        (pur[p.id]  || 0) +
        (ti[p.id]   || 0) +
        (sr[p.id]   || 0) -
        (sal[p.id]  || 0) -
        (pr[p.id]   || 0) -
        (to[p.id]   || 0)
      ),
      amount: Math.max(0,
        (sdAmountMap[p.id] || 0) +
        (purAmt[p.id]      || 0) -
        (prAmt[p.id]       || 0)
      ),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getStockDataNextNo, getStockData, createStockData, updateStockData, deleteStockData,
  getStockTransferNextNo, getStockTransfers, createStockTransfer, updateStockTransfer, deleteStockTransfer,
  getStockQty, getStockQtyByWarehouse,
};
