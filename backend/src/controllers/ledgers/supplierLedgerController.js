const prisma = require('../../utils/prisma');
const { getBranchId } = require('../vouchers/voucherHelpers');

// ── Supplier Ledger ────────────────────────────────────────────────────────────
// Aggregates all supplier-related transactions from:
//  1. SupplierTransaction (opening balance, manual, purchase auto-entries)
//  2. PaymentVoucher  — payment made to supplier (DR — reduces payable)
//  3. PurchaseReturnVoucher — goods returned to supplier (DR — reduces payable)
// Sorts chronologically and computes running balance.
const getSupplierLedger = async (req, res) => {
  try {
    const supplierId = Number(req.params.supplierId);
    if (!supplierId) return res.status(400).json({ message: 'supplierId is required' });

    const branchId = getBranchId(req);

    // Fetch supplier info
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId },
      select: {
        id: true, name: true, phone: true, email: true, address: true,
        area: true, gstNo: true, cityName: true, stateName: true, countryName: true,
        contacts: { select: { id: true, name: true, phone: true, designation: true } },
      },
    });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });

    // 1. SupplierTransaction rows (includes auto-entry from purchase creation)
    const txRows = await prisma.supplierTransaction.findMany({
      where: { supplierId },
      orderBy: { date: 'asc' },
    });

    // 2. Payment Vouchers for this supplier (payment = DR: reduces payable)
    const paymentFilter = { supplierId, ...(branchId ? { branchId } : {}) };
    const paymentRows = await prisma.paymentVoucher.findMany({
      where: paymentFilter,
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // 3. Purchase Vouchers for this supplier (with items)
    const purchaseFilter = { supplierId, ...(branchId ? { branchId } : {}) };
    const purchaseRows = await prisma.purchaseVoucher.findMany({
      where: purchaseFilter,
      include: {
        items:     { include: { product: { select: { id: true, name: true } } } },
        warehouse: { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
        branch:    { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // 4. Purchase Return Vouchers (return = DR: reduces payable)
    const purchaseReturnFilter = { supplierId, ...(branchId ? { branchId } : {}) };
    const purchaseReturnRows = await prisma.purchaseReturnVoucher.findMany({
      where: purchaseReturnFilter,
      include: {
        items:         { include: { product: { select: { id: true, name: true } } } },
        warehouse:     { select: { id: true, name: true } },
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // 5. Receipt Vouchers from this supplier (receipt = DR: reduces payable / supplier returns money)
    const receiptFromSupplierRows = await prisma.receiptVoucher.findMany({
      where: { supplierId, ...(branchId ? { branchId } : {}) },
      include: {
        paymentMethod: { select: { id: true, name: true } },
        createdBy:     { select: { name: true } },
        branch:        { select: { id: true, name: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Build unified ledger entries
    // voucherNo tracking set — skip supplierTransaction rows that came from purchase
    // (they are superseded by the richer purchaseVoucher data)
    const purchaseVoucherNos = new Set(purchaseRows.map(p => p.voucherNo));

    const entries = [];

    // Add supplierTransaction entries (skip those already covered by purchase vouchers)
    for (const tx of txRows) {
      // Skip auto-purchase entries — the purchaseVoucher entry below has richer data
      if (tx.source === 'purchase' && tx.refVoucherNo && purchaseVoucherNos.has(tx.refVoucherNo)) {
        continue;
      }
      entries.push({
        _date:      new Date(tx.date),
        type:       tx.type,
        amount:     tx.amount,
        kind:       tx.source === 'opening_balance' ? 'opening_balance'
                  : tx.source === 'purchase'        ? 'purchase'
                  : 'manual',
        voucherNo:  tx.refVoucherNo || null,
        source:     tx.source || 'manual',
        items:      [],
        meta:       {},
      });
    }

    // Add Purchase Vouchers (DR — increases payable, shown in DR column)
    for (const pv of purchaseRows) {
      entries.push({
        _date:          new Date(pv.date),
        type:           'DR',
        amount:         pv.totalAmount,
        kind:           'purchase',
        voucherNo:      pv.voucherNo,
        source:         'purchase',
        particularName: pv.supplierName || supplier.name,
        particularType: 'supplier',
        items:      pv.items.map(i => ({
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
          warehouseName:  pv.warehouseName || pv.warehouse?.name || null,
          paymentTerms:   pv.paymentTerms || null,
          subTotal:       pv.subTotal,
          taxAmount:      pv.taxAmount,
          discountAmount: pv.discountAmount,
          branch:         pv.branch?.name || null,
          createdBy:      pv.createdBy?.name || null,
        },
      });
    }

    // Add Payment Vouchers (CR — reduces payable, shown in CR column)
    for (const pv of paymentRows) {
      entries.push({
        _date:          new Date(pv.date),
        type:           'CR',
        amount:         pv.amount,
        kind:           'payment',
        voucherNo:      pv.voucherNo,
        source:         'payment',
        particularName: pv.particularName || supplier.name,
        particularType: pv.particularType || 'supplier',
        items:          [],
        meta: {
          paymentMethod: pv.paymentMethod?.name || null,
          branch:        pv.branch?.name || null,
          createdBy:     pv.createdBy?.name || null,
        },
      });
    }

    // Add Receipt Vouchers from supplier (DR — shown in DR column)
    for (const rv of receiptFromSupplierRows) {
      entries.push({
        _date:          new Date(rv.date),
        type:           'DR',
        kind:           'receipt_from_supplier',
        voucherNo:      rv.voucherNo,
        source:         'receipt_from_supplier',
        amount:         rv.amount,
        particularName: rv.particularName || supplier.name,
        particularType: rv.particularType || 'supplier',
        items:          [],
        meta: {
          paymentMethod: rv.paymentMethod?.name || null,
          branch:        rv.branch?.name || null,
          createdBy:     rv.createdBy?.name || null,
        },
      });
    }

    // Add Purchase Return Vouchers (CR — reduces payable, shown in CR column)
    for (const prv of purchaseReturnRows) {
      entries.push({
        _date:          new Date(prv.date),
        type:           'CR',
        amount:         prv.totalAmount,
        kind:           'purchase_return',
        voucherNo:      prv.voucherNo,
        source:         'purchase_return',
        particularName: prv.supplierName || supplier.name,
        particularType: 'supplier',
        items:      prv.items.map(i => ({
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
          warehouseName:  prv.warehouseName || prv.warehouse?.name || null,
          paymentMethod:  prv.paymentMethodName || prv.paymentMethod?.name || null,
          subTotal:       prv.subTotal,
          taxAmount:      prv.taxAmount,
          discountAmount: prv.discountAmount,
          branch:         prv.branch?.name || null,
          createdBy:      prv.createdBy?.name || null,
        },
      });
    }

    // Sort chronologically
    entries.sort((a, b) => a._date - b._date);

    let balance = 0;
    const ledger = entries.map((e, idx) => {
      const inCR = e.type === 'CR';
      balance += inCR ? e.amount : -e.amount;
      const { _date, ...rest } = e;
      return {
        id:      idx + 1,
        date:    _date.toISOString(),
        balance: Math.round(balance * 100) / 100,
        ...rest,
      };
    });

    // Summary stats
    const totalPurchases           = purchaseRows.reduce((s, p) => s + p.totalAmount, 0);
    const totalPurchaseReturns     = purchaseReturnRows.reduce((s, p) => s + p.totalAmount, 0);
    const totalPayments            = paymentRows.reduce((s, p) => s + p.amount, 0);
    const totalReceiptsFromSupplier = receiptFromSupplierRows.reduce((s, r) => s + r.amount, 0);
    const closingBalance           = ledger.length ? ledger[ledger.length - 1].balance : 0;

    res.json({
      supplier,
      ledger,
      summary: {
        totalPurchases:            Math.round(totalPurchases            * 100) / 100,
        totalPurchaseReturns:      Math.round(totalPurchaseReturns      * 100) / 100,
        totalPayments:             Math.round(totalPayments             * 100) / 100,
        totalReceiptsFromSupplier: Math.round(totalReceiptsFromSupplier * 100) / 100,
        closingBalance:            Math.round(closingBalance            * 100) / 100,
        totalEntries:              ledger.length,
      },
    });
  } catch (err) {
    console.error('getSupplierLedger error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getSupplierLedger };
