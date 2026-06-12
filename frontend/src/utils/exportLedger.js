import * as XLSX from 'xlsx';

const fmtD  = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const n2    = (v) => Number(Number(v || 0).toFixed(2));
const nowStr = () => new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const srcLabel = (s) => (s || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

function setWidths(ws, widths) {
  ws['!cols'] = widths.map(w => ({ wch: w }));
}

// ── 1. Client Ledger ──────────────────────────────────────────────────────────
export function exportClientLedger({ customer, periodRows, fromDate, toDate, summary, closing }) {
  const wb = XLSX.utils.book_new();
  const period = fromDate || toDate
    ? `${fromDate || 'Beginning'} to ${toDate || 'Today'}`
    : 'Full History';

  const aoa = [
    ['RS BHARTI – CLIENT LEDGER'],
    [`Customer: ${customer?.name || ''}`, '', customer?.gstNo ? `GST No: ${customer.gstNo}` : ''],
    [`Period: ${period}`, '', `Generated: ${nowStr()}`],
    [],
    ['Date', 'Name', 'Voucher Type', 'Voucher No.', 'DR ₹', 'CR ₹', 'Balance ₹', 'Dr/Cr'],
  ];

  for (const r of periodRows) {
    aoa.push([
      fmtD(r.date),
      r.narration || srcLabel(r.source),
      srcLabel(r.source),
      r.voucherNo || '—',
      r.type === 'DR' ? n2(r.amount) : '',
      r.type === 'CR' ? n2(r.amount) : '',
      n2(Math.abs(r.balance)),
      r.balance > 0 ? 'Dr' : r.balance < 0 ? 'Cr' : '',
    ]);
    if (r.items?.length) {
      for (const it of r.items) {
        aoa.push(['', `  → ${it.productName}  Qty: ${it.qty} × ₹${n2(it.rate)}`, '', '', '', '', n2(it.amount), '']);
      }
    }
  }

  const totalDR = n2(periodRows.reduce((s, r) => s + (r.type === 'DR' ? r.amount : 0), 0));
  const totalCR = n2(periodRows.reduce((s, r) => s + (r.type === 'CR' ? r.amount : 0), 0));
  aoa.push([]);
  aoa.push([`Grand Total (${periodRows.length} entries)`, '', '', '', totalDR, totalCR, n2(Math.abs(closing)), closing > 0 ? 'Dr' : closing < 0 ? 'Cr' : '']);
  aoa.push([]);
  aoa.push(['SUMMARY']);
  aoa.push(['Total Sales',         '', '', '', '', n2(summary.totalSales)]);
  aoa.push(['Total Sales Returns', '', '', '', '', n2(summary.totalSalesReturns)]);
  aoa.push(['Total Receipts',      '', '', '', n2(summary.totalReceipts)]);
  aoa.push(['Closing Balance',     '', '', '', '', '', n2(Math.abs(closing)), closing > 0 ? 'Dr' : closing < 0 ? 'Cr' : 'Nil']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [14, 36, 18, 16, 14, 14, 14, 6]);
  XLSX.utils.book_append_sheet(wb, ws, 'Client Ledger');

  const safe = (customer?.name || 'Unknown').replace(/[^a-zA-Z0-9_\- ]/g, '');
  XLSX.writeFile(wb, `ClientLedger_${safe}_${fromDate || 'all'}.xlsx`);
}

// ── 2. Supplier Ledger ────────────────────────────────────────────────────────
export function exportSupplierLedger({ supplier, periodRows, fromDate, toDate, summary, closing }) {
  const wb = XLSX.utils.book_new();
  const period = fromDate || toDate
    ? `${fromDate || 'Beginning'} to ${toDate || 'Today'}`
    : 'Full History';

  // Supplier: positive balance = payable (Cr), negative = advance paid (Dr)
  const supDrCr = (bal) => bal > 0 ? 'Cr' : bal < 0 ? 'Dr' : '';

  const aoa = [
    ['RS BHARTI – SUPPLIER LEDGER'],
    [`Supplier: ${supplier?.name || ''}`, '', supplier?.gstNo ? `GST No: ${supplier.gstNo}` : ''],
    [`Period: ${period}`, '', `Generated: ${nowStr()}`],
    [],
    ['Date', 'Name', 'Voucher Type', 'Voucher No.', 'DR ₹', 'CR ₹', 'Balance ₹', 'Dr/Cr'],
  ];

  for (const r of periodRows) {
    aoa.push([
      fmtD(r.date),
      r.narration || srcLabel(r.source),
      srcLabel(r.source),
      r.voucherNo || '—',
      r.type === 'DR' ? n2(r.amount) : '',
      r.type === 'CR' ? n2(r.amount) : '',
      n2(Math.abs(r.balance)),
      supDrCr(r.balance),
    ]);
    if (r.items?.length) {
      for (const it of r.items) {
        aoa.push(['', `  → ${it.productName}  Qty: ${it.qty} × ₹${n2(it.rate)}`, '', '', '', '', n2(it.amount), '']);
      }
    }
  }

  const totalDR = n2(periodRows.reduce((s, r) => s + (r.type === 'DR' ? r.amount : 0), 0));
  const totalCR = n2(periodRows.reduce((s, r) => s + (r.type === 'CR' ? r.amount : 0), 0));
  aoa.push([]);
  aoa.push([`Grand Total (${periodRows.length} entries)`, '', '', '', totalDR, totalCR, n2(Math.abs(closing)), supDrCr(closing)]);
  aoa.push([]);
  aoa.push(['SUMMARY']);
  aoa.push(['Total Purchases',        '', '', '', '', n2(summary.totalPurchases)]);
  aoa.push(['Total Purchase Returns', '', '', '', n2(summary.totalPurchaseReturns)]);
  aoa.push(['Total Payments',         '', '', '', n2(summary.totalPayments)]);
  aoa.push(['Closing Balance',        '', '', '', '', '', n2(Math.abs(closing)), supDrCr(closing) || 'Nil']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [14, 36, 18, 16, 14, 14, 14, 6]);
  XLSX.utils.book_append_sheet(wb, ws, 'Supplier Ledger');

  const safe = (supplier?.name || 'Unknown').replace(/[^a-zA-Z0-9_\- ]/g, '');
  XLSX.writeFile(wb, `SupplierLedger_${safe}_${fromDate || 'all'}.xlsx`);
}

// ── 3. Stock Ledger ───────────────────────────────────────────────────────────
export function exportStockLedger({ product, warehouse, periodRowsWithBalance, fromDate, toDate, totalQtyIn, totalQtyOut, finalBalance }) {
  const wb = XLSX.utils.book_new();
  const period = fromDate || toDate
    ? `${fromDate || 'Beginning'} to ${toDate || 'Today'}`
    : 'Full History';

  const aoa = [
    ['RS BHARTI – STOCK LEDGER'],
    [`Product: ${product?.name || ''}`, `Unit: ${product?.unit?.unitName || ''}`],
    [`Warehouse: ${warehouse?.name || ''}`, `Period: ${period}`],
    [`Generated: ${nowStr()}`],
    [],
    ['Date', 'Particulars', 'Voucher Type', 'Voucher No.', 'In', 'Out', 'Closing'],
  ];

  for (const r of periodRowsWithBalance) {
    aoa.push([
      fmtD(r.date),
      r.party || r.narration || srcLabel(r.type || r.source || ''),
      srcLabel(r.type || r.source || ''),
      r.voucherNo || '—',
      r.qtyIn  > 0 ? r.qtyIn  : '',
      r.qtyOut > 0 ? r.qtyOut : '',
      r.balance,
    ]);
  }

  aoa.push([]);
  aoa.push([`Grand Total (${periodRowsWithBalance.length} entries)`, '', '', '', totalQtyIn, totalQtyOut, finalBalance]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [14, 30, 18, 16, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, 'Stock Ledger');

  const safeProd = (product?.name || 'Unknown').replace(/[^a-zA-Z0-9_\- ]/g, '');
  const safeWH   = (warehouse?.name || '').replace(/[^a-zA-Z0-9_\- ]/g, '');
  XLSX.writeFile(wb, `StockLedger_${safeProd}_${safeWH}_${fromDate || 'all'}.xlsx`);
}

// ── 4. DSR ────────────────────────────────────────────────────────────────────
export function exportDSR({ date, data, totalIn, totalOut }) {
  const wb   = XLSX.utils.book_new();
  const net  = n2(totalIn - totalOut);
  const displayDate = date ? fmtD(date + 'T00:00:00') : '—';

  const vRow = (v) => [
    v.type,
    v.voucherNo || '—',
    v.party     || '—',
    n2(v.amount),
  ];

  const aoa = [
    ['RS BHARTI – DAILY SALES REPORT (DSR)'],
    [`Date: ${displayDate}`, '', `Generated: ${nowStr()}`],
    [],
    // ── Money IN ──────────────────────────────────────────────────────────────
    ['MONEY IN (Receipts / Sales / Purchase Returns / Contra)'],
    ['Voucher Type', 'Voucher No.', 'Party', 'Amount ₹'],
  ];

  const inRows = data
    ? [
        ...data.in.receipts,
        ...data.in.sales,
        ...data.in.purchaseReturns,
        ...data.in.contras,
      ]
    : [];

  if (inRows.length === 0) {
    aoa.push(['No entries', '', '', '']);
  } else {
    for (const v of inRows) {
      aoa.push(vRow(v));
      if (v.items?.length) {
        for (const it of v.items) {
          aoa.push(['', '', `  → ${it.productName}  Qty: ${it.qty}`, n2(it.amount)]);
        }
      }
    }
  }
  aoa.push(['Total In', '', '', n2(totalIn)]);
  aoa.push([]);

  // ── Money OUT ─────────────────────────────────────────────────────────────
  aoa.push(['MONEY OUT (Payments / Expenses / Sales Returns / Purchases / Stock)']);
  aoa.push(['Voucher Type', 'Voucher No.', 'Party', 'Amount ₹']);

  const outRows = data
    ? [
        ...data.out.payments,
        ...data.out.expenses,
        ...data.out.salesReturns,
        ...data.out.purchases,
        ...data.out.stockData,
        ...data.out.stockTransfers,
      ]
    : [];

  if (outRows.length === 0) {
    aoa.push(['No entries', '', '', '']);
  } else {
    for (const v of outRows) {
      aoa.push(vRow(v));
      if (v.items?.length) {
        for (const it of v.items) {
          aoa.push(['', '', `  → ${it.productName}  Qty: ${it.qty}`, n2(it.amount)]);
        }
      }
    }
  }
  aoa.push(['Total Out', '', '', n2(totalOut)]);
  aoa.push([]);

  // ── Summary ───────────────────────────────────────────────────────────────
  aoa.push(['SUMMARY']);
  aoa.push(['Total Money In',  '', '', n2(totalIn)]);
  aoa.push(['Total Money Out', '', '', n2(totalOut)]);
  aoa.push(['Net (In − Out)',  '', '', net]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [26, 16, 32, 16]);
  XLSX.utils.book_append_sheet(wb, ws, 'DSR');

  XLSX.writeFile(wb, `DSR_${date || 'unknown'}.xlsx`);
}
