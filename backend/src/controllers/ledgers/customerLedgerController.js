const prisma = require('../../utils/prisma');
const { getBranchId } = require('../vouchers/voucherHelpers');

// ── Customer Ledger ────────────────────────────────────────────────────────────
const getCustomerLedger = async (req, res) => {
  try {
    const customerId = Number(req.params.customerId);
    if (!customerId) return res.status(400).json({ message: 'customerId is required' });

    const branchId = getBranchId(req);

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: {
        id: true, name: true, phone: true, email: true, address: true,
        area: true, gstNo: true, cityName: true, stateName: true, countryName: true,
        contacts: { select: { id: true, name: true, phone: true, designation: true } },
      },
    });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const txRows = await prisma.customerTransaction.findMany({
      where: { customerId },
      orderBy: { date: 'asc' },
    });

    const receiptRows = await prisma.receiptVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const salesRows = await prisma.salesVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        items:     { include: { product: { select: { id: true, name: true } } } },
        warehouse: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const salesReturnRows = await prisma.salesReturnVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        items:     { include: { product: { select: { id: true, name: true } } } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const paymentToCustomerRows = await prisma.paymentVoucher.findMany({
      where: { customerId, ...(branchId ? { branchId } : {}) },
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const salesVoucherNos = new Set(salesRows.map(s => s.voucherNo));
    const entries = [];

    for (const tx of txRows) {
      if (tx.source === 'sales' && tx.refVoucherNo && salesVoucherNos.has(tx.refVoucherNo)) continue;
      entries.push({
        _date:     new Date(tx.date),
        type:      tx.type,
        amount:    tx.amount,
        voucherNo: tx.refVoucherNo || null,
        narration: tx.note || null,
        source:    tx.source === 'opening_balance' ? 'opening_balance' : (tx.source || 'manual'),
        items:     [],
        meta:      {},
      });
    }

    for (const rv of receiptRows) {
      entries.push({
        _date:          new Date(rv.date),
        type:           'DR',
        amount:         rv.amount,
        voucherNo:      rv.voucherNo,
        source:         'receipt',
        particularName: rv.particularName || customer.name,
        particularType: rv.particularType || 'customer',
        items:          [],
        meta: {
          paymentMethod: rv.paymentMethod?.name || null,
          branch:        rv.branch?.name || null,
          createdBy:     rv.createdBy?.name || null,
        },
      });
    }

    for (const pv of paymentToCustomerRows) {
      entries.push({
        _date:          new Date(pv.date),
        type:           'DR',
        amount:         pv.amount,
        voucherNo:      pv.voucherNo,
        source:         'payment_to_customer',
        particularName: pv.particularName || customer.name,
        particularType: pv.particularType || 'customer',
        items:          [],
        meta: {
          paymentMethod: pv.paymentMethod?.name || null,
          branch:        pv.branch?.name || null,
          createdBy:     pv.createdBy?.name || null,
        },
      });
    }

    for (const sv of salesRows) {
      entries.push({
        _date:          new Date(sv.date),
        type:           'CR',
        amount:         sv.totalAmount,
        voucherNo:      sv.voucherNo,
        source:         'sales',
        particularName: sv.customerName || customer.name,
        particularType: 'customer',
        items:     sv.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.product?.name,
          qty:         i.qty,
          rate:        i.rate,
          subTotal:    i.subTotal,
          taxRate:     i.taxRate,
          taxAmount:   i.taxAmount,
          discount:    i.discountAmount,
          amount:      i.amount,
        })),
        meta: {
          warehouseName:  sv.warehouseName || sv.warehouse?.name || null,
          paymentTerms:   sv.paymentTerms || null,
          subTotal:       sv.subTotal,
          taxAmount:      sv.taxAmount,
          discountAmount: sv.discountAmount,
          branch:         sv.branch?.name || null,
          createdBy:      sv.createdBy?.name || null,
        },
      });
    }

    for (const srv of salesReturnRows) {
      entries.push({
        _date:          new Date(srv.date),
        type:           'DR',
        amount:         srv.totalAmount,
        voucherNo:      srv.voucherNo,
        source:         'sales_return',
        particularName: srv.customerName || customer.name,
        particularType: 'customer',
        items:     srv.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.product?.name,
          qty:         i.qty,
          rate:        i.rate,
          subTotal:    i.subTotal,
          taxRate:     i.taxRate,
          taxAmount:   i.taxAmount,
          discount:    i.discountAmount,
          amount:      i.amount,
        })),
        meta: {
          subTotal:       srv.subTotal,
          taxAmount:      srv.taxAmount,
          discountAmount: srv.discountAmount,
          branch:         srv.branch?.name || null,
          createdBy:      srv.createdBy?.name || null,
        },
      });
    }

    entries.sort((a, b) => a._date - b._date);

    // Compute running balance — receipt is stored as DR but goes in CR column (add)
    let balance = 0;
    const ledger = entries.map((e, idx) => {
      const inCR = e.type === 'CR' || e.source === 'receipt';
      balance += inCR ? e.amount : -e.amount;
      const { _date, ...rest } = e;
      return { id: idx + 1, date: _date.toISOString(), balance: Math.round(balance * 100) / 100, ...rest };
    });

    res.json({
      customer,
      ledger,
      summary: {
        totalSales:              Math.round(salesRows.reduce((s, v) => s + v.totalAmount, 0)          * 100) / 100,
        totalSalesReturns:       Math.round(salesReturnRows.reduce((s, v) => s + v.totalAmount, 0)    * 100) / 100,
        totalReceipts:           Math.round(receiptRows.reduce((s, v) => s + v.amount, 0)             * 100) / 100,
        totalPaymentsToCustomer: Math.round(paymentToCustomerRows.reduce((s, v) => s + v.amount, 0)  * 100) / 100,
        closingBalance:          Math.round((ledger.length ? ledger[ledger.length - 1].balance : 0)   * 100) / 100,
        totalEntries:            ledger.length,
      },
    });
  } catch (err) {
    console.error('getCustomerLedger error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getCustomerLedger };
