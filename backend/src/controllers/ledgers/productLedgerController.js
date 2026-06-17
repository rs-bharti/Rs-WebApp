const prisma = require('../../utils/prisma');
const { getBranchId } = require('../vouchers/voucherHelpers');

const getProductLedger = async (req, res) => {
  try {
    const { productId, warehouseId } = req.query;
    if (!productId || !warehouseId) {
      return res.status(400).json({ message: 'productId and warehouseId are required' });
    }

    const pid = Number(productId);
    const wid = Number(warehouseId);

    // Fetch product details
    const product = await prisma.product.findUnique({
      where: { id: pid },
      include: { unit: true }
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Fetch warehouse details
    const warehouse = await prisma.warehouseMaster.findUnique({
      where: { id: wid }
    });
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Fetch all voucher items for this product and warehouse
    const [
      stockDataItems,
      purchaseItems,
      salesItems,
      salesReturnItems,
      purchaseReturnItems,
      transferInItems,
      transferOutItems,
    ] = await Promise.all([
      // Stock Data (Opening)
      prisma.stockDataVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Purchases
      prisma.purchaseVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Sales
      prisma.salesVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Sales Return (warehouseId is directly on item)
      prisma.salesReturnVoucherItem.findMany({
        where: { productId: pid, warehouseId: wid },
        include: { voucher: true },
      }),
      // Purchase Return
      prisma.purchaseReturnVoucherItem.findMany({
        where: { productId: pid, voucher: { warehouseId: wid } },
        include: { voucher: true },
      }),
      // Stock Transfer In
      prisma.stockTransferVoucherItem.findMany({
        where: { productId: pid, voucher: { toWarehouseId: wid } },
        include: { voucher: true },
      }),
      // Stock Transfer Out
      prisma.stockTransferVoucherItem.findMany({
        where: { productId: pid, voucher: { fromWarehouseId: wid } },
        include: { voucher: true },
      }),
    ]);

    const entries = [];

    // 1. Stock Data
    stockDataItems.forEach(item => {
      entries.push({
        id: `sd-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Stock Data',
        party: 'Opening Stock',
        qtyIn: item.qty,
        qtyOut: 0,
        rate: item.rate || 0,
        amount: item.qty * (item.rate || 0),
      });
    });

    // 2. Purchases
    purchaseItems.forEach(item => {
      entries.push({
        id: `pur-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Purchase',
        party: item.voucher.supplierName || `Supplier #${item.voucher.supplierId}`,
        qtyIn: item.qty,
        qtyOut: 0,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 3. Sales
    salesItems.forEach(item => {
      entries.push({
        id: `sal-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Sales',
        party: item.voucher.customerName || `Customer #${item.voucher.customerId}`,
        qtyIn: 0,
        qtyOut: item.qty,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 4. Sales Return
    salesReturnItems.forEach(item => {
      entries.push({
        id: `sr-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Sales Return',
        party: item.voucher.customerName || `Customer #${item.voucher.customerId}`,
        qtyIn: item.qty,
        qtyOut: 0,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 5. Purchase Return
    purchaseReturnItems.forEach(item => {
      entries.push({
        id: `pr-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Purchase Return',
        party: item.voucher.supplierName || `Supplier #${item.voucher.supplierId}`,
        qtyIn: 0,
        qtyOut: item.qty,
        rate: item.rate,
        amount: item.amount || (item.qty * item.rate),
      });
    });

    // 6. Stock Transfer In
    transferInItems.forEach(item => {
      entries.push({
        id: `sti-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Transfer In',
        party: `From WH: ${item.voucher.fromWarehouseName || 'Warehouse ' + item.voucher.fromWarehouseId}`,
        qtyIn: item.qty,
        qtyOut: 0,
        rate: 0,
        amount: 0,
      });
    });

    // 7. Stock Transfer Out
    transferOutItems.forEach(item => {
      entries.push({
        id: `sto-${item.id}`,
        date: item.voucher.date,
        voucherNo: item.voucher.voucherNo,
        type: 'Transfer Out',
        party: `To WH: ${item.voucher.toWarehouseName || 'Warehouse ' + item.voucher.toWarehouseId}`,
        qtyIn: 0,
        qtyOut: item.qty,
        rate: 0,
        amount: 0,
      });
    });

    // Sort entries chronologically
    entries.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate cumulative balance
    let balance = 0;
    const ledger = entries.map(entry => {
      balance += (entry.qtyIn - entry.qtyOut);
      return {
        ...entry,
        balance,
      };
    });

    res.json({
      product: {
        id: product.id,
        name: product.name,
        unit: product.unit?.unitName || '',
      },
      warehouse: {
        id: warehouse.id,
        name: warehouse.name,
      },
      ledger,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getProductLedger };
