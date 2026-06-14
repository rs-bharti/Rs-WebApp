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
    ['Date', 'Name', 'Voucher Type', 'Voucher No.', 'Payment Method', 'DR ₹', 'CR ₹', 'Balance ₹', 'Dr/Cr'],
  ];

  // Customer Ledger: Sales/OB = type 'CR' → DR column (customer owes us)
  //                  Receipt/Return = type 'DR' → CR column (customer paid/returned)
  for (const r of periodRows) {
    const particulars = r.particularName
      ? `${r.particularName}${r.particularType ? ` (${r.particularType})` : ''}`
      : srcLabel(r.source);
    aoa.push([
      fmtD(r.date),
      particulars,
      srcLabel(r.source),
      r.voucherNo || '—',
      r.meta?.paymentMethod || '',
      r.type === 'CR' ? n2(r.amount) : '',   // DR col = Sales / Opening Balance
      r.type === 'DR' ? n2(r.amount) : '',   // CR col = Receipt / Sales Return
      n2(Math.abs(r.balance)),
      r.balance > 0 ? 'Dr' : r.balance < 0 ? 'Cr' : '',
    ]);
  }

  // totalDR = Sales + Opening Balance (type 'CR'), totalCR = Receipt + Returns (type 'DR')
  const totalDR = n2(periodRows.reduce((s, r) => s + (r.type === 'CR' ? r.amount : 0), 0));
  const totalCR = n2(periodRows.reduce((s, r) => s + (r.type === 'DR' ? r.amount : 0), 0));
  aoa.push([]);
  aoa.push([`Grand Total (${periodRows.length} entries)`, '', '', '', '', totalDR, totalCR, n2(Math.abs(closing)), closing > 0 ? 'Dr' : closing < 0 ? 'Cr' : '']);
  aoa.push([]);
  aoa.push(['SUMMARY']);
  aoa.push(['Total Sales',         '', '', '', '', n2(summary.totalSales),         '']);
  aoa.push(['Total Sales Returns', '', '', '', '', '', n2(summary.totalSalesReturns)]);
  aoa.push(['Total Receipts',      '', '', '', '', '', n2(summary.totalReceipts)]);
  aoa.push(['Closing Balance',     '', '', '', '', '', '', n2(Math.abs(closing)), closing > 0 ? 'Dr' : closing < 0 ? 'Cr' : 'Nil']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [14, 36, 18, 16, 18, 14, 14, 14, 6]);
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
    ['Date', 'Name', 'Voucher Type', 'Voucher No.', 'Payment Method', 'DR ₹', 'CR ₹', 'Balance ₹', 'Dr/Cr'],
  ];

  for (const r of periodRows) {
    const particulars = r.particularName
      ? `${r.particularName}${r.particularType ? ` (${r.particularType})` : ''}`
      : srcLabel(r.source);
    aoa.push([
      fmtD(r.date),
      particulars,
      srcLabel(r.source),
      r.voucherNo || '—',
      r.meta?.paymentMethod || '',
      r.type === 'DR' ? n2(r.amount) : '',   // DR col = Payment / Purchase Return
      r.type === 'CR' ? n2(r.amount) : '',   // CR col = Purchase (we owe them)
      n2(Math.abs(r.balance)),
      supDrCr(r.balance),
    ]);
  }

  const totalDR = n2(periodRows.reduce((s, r) => s + (r.type === 'DR' ? r.amount : 0), 0));
  const totalCR = n2(periodRows.reduce((s, r) => s + (r.type === 'CR' ? r.amount : 0), 0));
  aoa.push([]);
  aoa.push([`Grand Total (${periodRows.length} entries)`, '', '', '', '', totalDR, totalCR, n2(Math.abs(closing)), supDrCr(closing)]);
  aoa.push([]);
  aoa.push(['SUMMARY']);
  aoa.push(['Total Purchases',        '', '', '', '', '', n2(summary.totalPurchases)]);
  aoa.push(['Total Purchase Returns', '', '', '', '', n2(summary.totalPurchaseReturns)]);
  aoa.push(['Total Payments',         '', '', '', '', n2(summary.totalPayments)]);
  aoa.push(['Closing Balance',        '', '', '', '', '', '', n2(Math.abs(closing)), supDrCr(closing) || 'Nil']);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [14, 36, 18, 16, 18, 14, 14, 14, 6]);
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

// ── 4. Tally Import ───────────────────────────────────────────────────────────
export function exportTally({ date, data }) {
  const wb = XLSX.utils.book_new();
  const displayDate = date ? fmtD(date + 'T00:00:00') : '';

  const headers = [
    'Voucher Date', 'Voucher Type Name', 'Voucher Number',
    'Buyer/Supplier - Address', 'Buyer/Supplier - Pincode',
    'Ledger Name', 'Ledger Amount', 'Ledger Amount Dr/Cr',
    'Item Name', 'Billed Quantity', 'Item Rate', 'Item Rate per',
    'Item Amount', 'Change Mode',
  ];

  const rows = [headers];

  const addVoucher = (v, voucherType, partyLedger, partyDrCr, counterLedger, counterDrCr) => {
    const vNo  = v.voucherNo || '';
    const amt  = n2(v.amount);
    const base = [displayDate, voucherType, vNo, '', ''];

    // Party ledger row
    rows.push([...base, partyLedger || v.party || '', amt, partyDrCr, '', '', '', '', '', '']);

    // Counter ledger row (Sales / Purchase / Cash / Bank)
    rows.push([...base, counterLedger, amt, counterDrCr, '', '', '', '', '', '']);

    // Item rows (inventory vouchers)
    for (const item of (v.items || [])) {
      rows.push([
        ...base,
        '', '', '',                              // ledger cols blank for item rows
        item.productName || '', item.qty ?? '', item.rate ?? '', '',
        n2(item.amount), '',
      ]);
    }
  };

  if (data) {
    for (const v of (data.in.sales          || [])) addVoucher(v, 'Sales',       v.party || '', 'Dr', 'Sales',           'Cr');
    for (const v of (data.out.purchases     || [])) addVoucher(v, 'Purchase',    'Purchase',    'Dr', v.party || '',     'Cr');
    for (const v of (data.in.receipts       || [])) addVoucher(v, 'Receipt',     v.paymentMethod || 'Cash', 'Dr', v.party || '', 'Cr');
    for (const v of (data.out.payments      || [])) addVoucher(v, 'Payment',     v.party || '', 'Dr', v.paymentMethod || 'Cash', 'Cr');
    for (const v of (data.in.contras        || [])) addVoucher(v, 'Contra',      v.paymentMethod || 'Cash', 'Dr', v.party || 'Cash', 'Cr');
    for (const v of (data.out.salesReturns  || [])) addVoucher(v, 'Credit Note', v.party || '', 'Cr', 'Sales Return',    'Dr');
    for (const v of (data.in.purchaseReturns|| [])) addVoucher(v, 'Debit Note',  v.party || '', 'Dr', 'Purchase Return', 'Cr');
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  setWidths(ws, [14, 14, 14, 24, 12, 26, 14, 12, 26, 14, 12, 10, 14, 12]);
  XLSX.utils.book_append_sheet(wb, ws, 'Tally Import');

  XLSX.writeFile(wb, `TallyImport_${date || 'unknown'}.xlsx`);
}

// ── 5. DSR ────────────────────────────────────────────────────────────────────
export function exportDSR({ date, data, totalIn, totalOut }) {
  const wb  = XLSX.utils.book_new();
  const net = n2(totalIn - totalOut);
  const displayDate = date ? fmtD(date + 'T00:00:00') : '—';

  const aoa = [
    ['RS BHARTI – DAILY SALES REPORT (DSR)'],
    [`Date: ${displayDate}`, '', `Generated: ${nowStr()}`],
    [],
    ['Voucher Type', 'Voucher No.', 'Party', 'Payment Method', 'Amount ₹'],
  ];

  // Add one section per voucher type; skip empty sections
  const addSection = (label, rows) => {
    if (!rows?.length) return;
    aoa.push([label]);
    for (const v of rows) {
      aoa.push([v.type, v.voucherNo || '—', v.party || '—', v.paymentMethod || '—', n2(v.amount)]);
    }
    const sub = n2(rows.reduce((s, v) => s + (v.amount || 0), 0));
    aoa.push(['', '', '', 'Subtotal', sub]);
    aoa.push([]);
  };

  if (data) {
    // Sequence as requested: Receipt → Payment → Contra → Sales → Sales Return → Purchase → Purchase Return
    addSection('RECEIPT',          data.in.receipts);
    addSection('PAYMENT',          data.out.payments);
    addSection('CONTRA',           data.in.contras);
    addSection('SALES',            data.in.sales);
    addSection('SALES RETURN',     data.out.salesReturns);
    addSection('PURCHASE',         data.out.purchases);
    addSection('PURCHASE RETURN',  data.in.purchaseReturns);
    addSection('STOCK DATA',       data.out.stockData);
    addSection('STOCK TRANSFER',   data.out.stockTransfers);
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  aoa.push(['SUMMARY']);
  aoa.push(['Total In  (Receipt + Sales + Purchase Return + Contra)', '', '', '', n2(totalIn)]);
  aoa.push(['Total Out (Payment + Expense + Sales Return + Purchase)', '', '', '', n2(totalOut)]);
  aoa.push(['Net (In − Out)', '', '', '', net]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  setWidths(ws, [46, 16, 32, 18, 16]);
  XLSX.utils.book_append_sheet(wb, ws, 'DSR');

  XLSX.writeFile(wb, `DSR_${date || 'unknown'}.xlsx`);
}
