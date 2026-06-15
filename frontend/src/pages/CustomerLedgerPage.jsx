import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw, Users, Search, X, ArrowLeft,
  TrendingUp, Wallet, ShoppingCart,
  RotateCcw, CreditCard, ChevronDown, ChevronRight,
  Phone, Mail, MapPin, User, Package, FileText, Download,
} from 'lucide-react';
import { getCustomers } from '../api/masters';
import SelectSearch from '../components/ui/SelectSearch';
import { exportClientLedger } from '../utils/exportLedger';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const activeBranch = JSON.parse(sessionStorage.getItem('activeBranch') || 'null');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    ...(activeBranch?.id ? { 'X-Branch-Id': String(activeBranch.id) } : {}),
  };
};

const fetchCustomerLedger = async (customerId) => {
  const res = await fetch(`${API_URL}/api/vouchers/customer-ledger/${customerId}`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load ledger');
  return data;
};

const fmt = (n) =>
  (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const SOURCE_CONFIG = {
  sales: {
    label: 'Sales',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
    icon: ShoppingCart,
  },
  receipt: {
    label: 'Receipt',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    icon: CreditCard,
  },
  sales_return: {
    label: 'Sales Return',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
    icon: RotateCcw,
  },
  opening_balance: {
    label: 'Opening Bal.',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
    icon: FileText,
  },
  manual: {
    label: 'Manual',
    className: 'bg-stone-100 text-stone-500 border border-stone-200',
    icon: FileText,
  },
};

const SourceBadge = ({ source }) => {
  const cfg = SOURCE_CONFIG[source] || SOURCE_CONFIG.manual;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${cfg.className}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

const ItemsSubRow = ({ items, meta, source }) => {
  if (!items?.length) {
    if (source === 'receipt' && meta?.paymentMethod) {
      return (
        <tr className="bg-stone-50/70">
          <td colSpan={9} className="px-8 py-2">
            <span className="text-xs text-stone-500">
              <span className="font-medium text-stone-600">Payment Method:</span> {meta.paymentMethod}
              {meta.branch && <span className="ml-4 text-stone-400">Branch: {meta.branch}</span>}
              {meta.createdBy && <span className="ml-4 text-stone-400">By: {meta.createdBy}</span>}
            </span>
          </td>
        </tr>
      );
    }
    return null;
  }
  return (
    <>
      <tr className="bg-stone-50/70">
        <td colSpan={9} className="px-0 pb-0 pt-0">
          <div className="mx-4 mb-3 border border-stone-200 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-200">
                  <th className="px-3 py-2 text-left font-semibold text-stone-500 uppercase tracking-wide">Product</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 uppercase tracking-wide w-16">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 uppercase tracking-wide w-24">Rate</th>
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 uppercase tracking-wide w-24">Sub-Total</th>
                  {items.some(i => i.taxAmount > 0) && (
                    <th className="px-3 py-2 text-right font-semibold text-stone-500 uppercase tracking-wide w-20">Tax</th>
                  )}
                  {items.some(i => i.discount > 0) && (
                    <th className="px-3 py-2 text-right font-semibold text-stone-500 uppercase tracking-wide w-20">Disc.</th>
                  )}
                  <th className="px-3 py-2 text-right font-semibold text-stone-500 uppercase tracking-wide w-24">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {items.map((item, i) => (
                  <tr key={i} className="hover:bg-white/60">
                    <td className="px-3 py-1.5 text-stone-700 font-medium flex items-center gap-1.5">
                      <Package className="w-3 h-3 text-stone-400 flex-shrink-0" />
                      {item.productName}
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-stone-600">{item.qty}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-stone-600">₹{fmt(item.rate)}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-stone-600">₹{fmt(item.subTotal)}</td>
                    {items.some(i2 => i2.taxAmount > 0) && (
                      <td className="px-3 py-1.5 text-right tabular-nums text-amber-600">
                        {item.taxAmount > 0 ? `₹${fmt(item.taxAmount)}` : '—'}
                      </td>
                    )}
                    {items.some(i2 => i2.discount > 0) && (
                      <td className="px-3 py-1.5 text-right tabular-nums text-rose-500">
                        {item.discount > 0 ? `-₹${fmt(item.discount)}` : '—'}
                      </td>
                    )}
                    <td className="px-3 py-1.5 text-right tabular-nums font-semibold text-stone-800">₹{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-stone-100 border-t border-stone-200">
                  <td colSpan={3} className="px-3 py-1.5 text-xs font-bold text-stone-500 uppercase tracking-wide">Total</td>
                  <td className="px-3 py-1.5 text-right tabular-nums font-bold text-stone-700">
                    ₹{fmt(items.reduce((s, i) => s + i.subTotal, 0))}
                  </td>
                  {items.some(i => i.taxAmount > 0) && (
                    <td className="px-3 py-1.5 text-right tabular-nums font-bold text-amber-600">
                      ₹{fmt(items.reduce((s, i) => s + i.taxAmount, 0))}
                    </td>
                  )}
                  {items.some(i => i.discount > 0) && (
                    <td className="px-3 py-1.5 text-right tabular-nums font-bold text-rose-500">
                      -{fmt(items.reduce((s, i) => s + i.discount, 0))}
                    </td>
                  )}
                  <td className="px-3 py-1.5 text-right tabular-nums font-bold text-stone-800">
                    ₹{fmt(items.reduce((s, i) => s + i.amount, 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
            {(meta?.warehouseName || meta?.paymentTerms || meta?.branch || meta?.createdBy) && (
              <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-200 flex flex-wrap gap-4 text-[11px] text-stone-400">
                {meta.warehouseName && <span><span className="font-medium text-stone-500">Warehouse:</span> {meta.warehouseName}</span>}
                {meta.paymentTerms && <span><span className="font-medium text-stone-500">Terms:</span> {meta.paymentTerms}</span>}
                {meta.branch && <span><span className="font-medium text-stone-500">Branch:</span> {meta.branch}</span>}
                {meta.createdBy && <span><span className="font-medium text-stone-500">By:</span> {meta.createdBy}</span>}
              </div>
            )}
          </div>
        </td>
      </tr>
    </>
  );
};

const LedgerRow = ({ row }) => {
  const [expanded, setExpanded] = useState(false);
  const hasItems = row.items?.length > 0;
  const hasDetail = hasItems || (row.source === 'receipt' && row.meta?.paymentMethod);

  return (
    <>
      <tr
        className={`hover:bg-stone-50/60 transition-colors ${expanded ? 'bg-stone-50/40' : ''}`}
        onClick={() => hasDetail && setExpanded(p => !p)}
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
      >
        <td className="px-3 py-3 w-8">
          {hasDetail ? (
            expanded
              ? <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              : <ChevronRight className="w-3.5 h-3.5 text-stone-300" />
          ) : null}
        </td>
        <td className="px-3 py-3 text-stone-600 tabular-nums text-xs whitespace-nowrap">
          {fmtDate(row.date)}
        </td>
        <td className="px-3 py-3">
          {row.voucherNo ? (
            <span className="font-mono text-xs bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded">
              {row.voucherNo}
            </span>
          ) : <span className="text-stone-300">—</span>}
        </td>
        <td className="px-3 py-3 text-xs text-stone-500 hidden md:table-cell">
          <span className="text-stone-200">—</span>
        </td>
        <td className="px-3 py-3 max-w-[220px]">
          <div className="flex items-center gap-2 flex-wrap">
            <SourceBadge source={row.source} />
            {row.particularName && (
              <span className="text-xs text-stone-600 font-medium">
                {row.particularName}
                {row.particularType && (
                  <span className="ml-1 text-[10px] text-stone-400 uppercase font-semibold">({row.particularType})</span>
                )}
              </span>
            )}
            {row.meta?.paymentMethod && (
              <span className="bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded text-[10px] font-medium">{row.meta.paymentMethod}</span>
            )}
            {hasItems && (
              <span className="text-xs text-stone-400 italic">{row.items.length} item{row.items.length !== 1 ? 's' : ''}</span>
            )}
          </div>
        </td>
        {/* DR */}
        <td className="px-3 py-3 text-right font-semibold tabular-nums">
          {(row.type === 'DR' && row.source !== 'receipt') ? (
            <span className="text-emerald-700">-₹{fmt(row.amount)}</span>
          ) : <span className="text-stone-200">—</span>}
        </td>
        {/* CR */}
        <td className="px-3 py-3 text-right font-semibold tabular-nums">
          {(row.type === 'CR' || row.source === 'receipt') ? (
            <span className="text-rose-600">+₹{fmt(row.amount)}</span>
          ) : <span className="text-stone-200">—</span>}
        </td>
        <td className="px-3 py-3 text-right">
          {row.balance !== 0 ? (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
              row.balance > 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              ₹{fmt(Math.abs(row.balance))}
              <span className="text-[9px] font-black">{row.balance > 0 ? 'Dr' : 'Cr'}</span>
            </span>
          ) : (
            <span className="text-stone-300 text-xs">Nil</span>
          )}
        </td>
      </tr>
      {expanded && <ItemsSubRow items={row.items} meta={row.meta} source={row.source} />}
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
const CustomerLedgerPage = () => {
  const navigate = useNavigate();
  const [customers,   setCustomers]   = useState([]);
  const [selectedId,  setSelectedId]  = useState('');
  const [ledgerData,  setLedgerData]  = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [error,       setError]       = useState('');
  const [search,      setSearch]      = useState('');
  const [fromDate,    setFromDate]    = useState('');
  const [toDate,      setToDate]      = useState('');

  useEffect(() => {
    getCustomers()
      .then(list => setCustomers(list.map(c => ({ id: c.id, name: c.name }))))
      .catch(() => setError('Failed to load customers'))
      .finally(() => setLoadingList(false));
  }, []);

  const fetchLedger = useCallback((id) => {
    if (!id) { setLedgerData(null); return; }
    setLoading(true);
    setError('');
    fetchCustomerLedger(id)
      .then(setLedgerData)
      .catch(err => setError(err.message || 'Failed to load ledger'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (id) => {
    setSelectedId(id);
    setSearch('');
    fetchLedger(id);
  };

  const allRows = (ledgerData?.ledger || []).sort((a, b) => {
    if (a.source === 'opening_balance') return -1;
    if (b.source === 'opening_balance') return  1;
    return 0;
  });

  // Date filter → recompute running balance for the period
  const dateFiltered = (fromDate || toDate)
    ? allRows.filter(r => {
        const d = new Date(r.date);
        if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
        if (toDate   && d > new Date(toDate   + 'T23:59:59')) return false;
        return true;
      })
    : allRows;

  let runBal = 0;
  const periodRows = dateFiltered.map(r => {
    // OB: DR = receivable (+), CR = we owe customer (-)
    // Others: CR (sales) adds; DR (receipt/return) subtracts
    runBal += r.source === 'opening_balance'
      ? (r.type === 'DR' ? r.amount : -r.amount)
      : (r.type === 'CR' ? r.amount : -r.amount);
    return { ...r, balance: Math.round(runBal * 100) / 100 };
  });

  // Search filter on top of date filter
  const filtered = search.trim()
    ? periodRows.filter(r =>
        (r.voucherNo || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.narration || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.source || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.items || []).some(i => (i.productName || '').toLowerCase().includes(search.toLowerCase()))
      )
    : periodRows;

  const customer = ledgerData?.customer;
  const closing  = periodRows.length ? periodRows[periodRows.length - 1].balance : 0;

  // Recompute summary from filtered period
  const summary = {
    totalSales:        periodRows.filter(r => r.source === 'sales').reduce((s, r) => s + r.amount, 0),
    totalSalesReturns: periodRows.filter(r => r.source === 'sales_return').reduce((s, r) => s + r.amount, 0),
    totalReceipts:     periodRows.filter(r => r.source === 'receipt').reduce((s, r) => s + r.amount, 0),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-300">

      {/* ── Page Header ── */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Client Ledger</h1>
          <p className="text-sm text-stone-400 mt-0.5">Complete transaction history — Sales · Receipt · Sales Return</p>
        </div>
        {selectedId && (
          <div className="ml-auto flex items-center gap-2">
            {periodRows.length > 0 && (
              <button
                onClick={() => exportClientLedger({ customer, periodRows, fromDate, toDate, summary, closing })}
                title="Download Excel"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            )}
            <button
              onClick={() => fetchLedger(selectedId)}
              disabled={loading}
              className="p-2.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* ── Customer Selector ── */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-5 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" /> Select Customer
        </label>
        {loadingList ? (
          <p className="text-sm text-stone-400">Loading customers…</p>
        ) : (
          <SelectSearch
            value={selectedId}
            onChange={handleSelect}
            options={customers}
            placeholder="Search and select a customer…"
          />
        )}
      </div>

      {/* ── Date Filter ── */}
      {selectedId && (
        <div className="bg-white border border-stone-200 rounded-xl px-5 py-3.5 mb-5 shadow-sm flex items-center gap-4 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">Filter Period</span>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 whitespace-nowrap">From</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-stone-400 bg-stone-50 cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-stone-500 whitespace-nowrap">To</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-stone-400 bg-stone-50 cursor-pointer"
            />
          </div>
          {(fromDate || toDate) && (
            <>
              <button
                onClick={() => { setFromDate(''); setToDate(''); }}
                className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Clear
              </button>
              <span className="text-xs text-stone-400 ml-auto">
                {periodRows.length} of {allRows.length} entries in period
              </span>
            </>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* ── Empty state ── */}
      {!selectedId && !loading && (
        <div className="text-center py-24 bg-white border border-dashed border-stone-200 rounded-xl flex flex-col items-center gap-3 text-stone-400">
          <Users className="w-12 h-12 text-stone-200" />
          <p className="text-sm">Select a customer to view their complete ledger</p>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="text-center py-24 flex items-center justify-center gap-2 text-stone-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-rs-text-primary" />
          Loading ledger…
        </div>
      )}

      {/* ── Content ── */}
      {ledgerData && !loading && (
        <div className="space-y-5">

          {/* Customer Info Card */}
          {customer && (
            <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-rs-text-primary/10 flex items-center justify-center text-rs-text-primary font-bold text-lg flex-shrink-0">
                  {customer.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-stone-800 text-base">{customer.name}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 mt-1.5 text-xs text-stone-500">
                    {customer.phone && (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{customer.phone}</span>
                    )}
                    {customer.email && (
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{customer.email}</span>
                    )}
                    {(customer.cityName || customer.stateName) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[customer.cityName, customer.stateName, customer.countryName].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {customer.gstNo && (
                      <span className="flex items-center gap-1"><FileText className="w-3 h-3" />GST: {customer.gstNo}</span>
                    )}
                  </div>
                  {customer.contacts?.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-2">
                      {customer.contacts.map(c => (
                        <span key={c.id} className="flex items-center gap-1 text-[11px] text-stone-400 bg-stone-50 border border-stone-100 px-2 py-0.5 rounded">
                          <User className="w-3 h-3" />{c.name}{c.designation ? ` · ${c.designation}` : ''}{c.phone ? ` · ${c.phone}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white border border-amber-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <ShoppingCart className="w-4 h-4 text-amber-600" />
                </div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Sales</p>
              </div>
              <p className="text-xl font-bold text-stone-800 tabular-nums">₹{fmt(summary.totalSales)}</p>
            </div>

            <div className="bg-white border border-purple-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <RotateCcw className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Sales Returns</p>
              </div>
              <p className="text-xl font-bold text-stone-800 tabular-nums">₹{fmt(summary.totalSalesReturns)}</p>
            </div>

            <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-emerald-50 rounded-lg">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Receipts</p>
              </div>
              <p className="text-xl font-bold text-stone-800 tabular-nums">₹{fmt(summary.totalReceipts)}</p>
            </div>

            <div className={`bg-white border rounded-xl p-4 shadow-sm ${
              closing > 0 ? 'border-emerald-200' : closing < 0 ? 'border-rose-200' : 'border-stone-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${
                  closing > 0 ? 'bg-emerald-50' : closing < 0 ? 'bg-rose-50' : 'bg-stone-50'
                }`}>
                  <Wallet className={`w-4 h-4 ${
                    closing > 0 ? 'text-emerald-600' : closing < 0 ? 'text-rose-600' : 'text-stone-400'
                  }`} />
                </div>
                <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Balance Due</p>
              </div>
              <p className={`text-xl font-bold tabular-nums ${
                closing > 0 ? 'text-emerald-600' : closing < 0 ? 'text-rose-600' : 'text-stone-300'
              }`}>
                ₹{fmt(Math.abs(closing))}
              </p>
              {closing !== 0 && (
                <p className="text-[10px] font-semibold mt-0.5 text-stone-400">
                  {closing > 0 ? 'Receivable from customer' : 'Advance / Overpaid'}
                </p>
              )}
            </div>
          </div>

          {/* Search */}
          {allRows.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search voucher, product, narration…"
                  className="w-full pl-9 pr-8 py-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-xs text-stone-400">{filtered.length} of {allRows.length} entries</p>
              )}
              <p className="ml-auto text-xs text-stone-400">Click a row to expand details</p>
            </div>
          )}

          {/* Ledger Table */}
          <div className="border border-stone-200 rounded-xl bg-white overflow-x-auto shadow-sm">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="w-8 px-3 py-3"></th>
                  <th className="px-3 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-24">Date</th>
                  <th className="px-3 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-28">Voucher No</th>
                  <th className="px-3 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-28 hidden md:table-cell">Payment Method</th>
                  <th className="px-3 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Particulars</th>
                  <th className="px-3 py-3 text-right font-semibold text-emerald-600 text-xs uppercase tracking-wider w-28">DR</th>
                  <th className="px-3 py-3 text-right font-semibold text-rose-600 text-xs uppercase tracking-wider w-28">CR</th>
                  <th className="px-3 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-32">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-stone-300 text-sm italic">
                      {allRows.length === 0
                        ? 'No transactions recorded for this customer yet.'
                        : `No entries match "${search}"`}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <LedgerRow key={row.id ?? i} row={row} />
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-stone-50 border-t-2 border-stone-200">
                    <td colSpan={5} className="px-3 py-3 text-xs font-bold text-stone-600 uppercase tracking-wider">
                      Grand Total ({filtered.length} entries)
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-emerald-700 tabular-nums">
                      -₹{fmt(filtered.reduce((s, r) => s + (r.type === 'DR' && r.source !== 'receipt' ? r.amount : 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-rose-700 tabular-nums">
                      +₹{fmt(filtered.reduce((s, r) => s + (r.type === 'CR' || r.source === 'receipt' ? r.amount : 0), 0))}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {closing !== 0 ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums ${
                          closing > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-600 border border-rose-200'
                        }`}>
                          ₹{fmt(Math.abs(closing))}
                          <span className="text-[9px] font-black">{closing > 0 ? 'Dr' : 'Cr'}</span>
                        </span>
                      ) : (
                        <span className="text-stone-300 text-xs">Nil</span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[11px] text-stone-400 pb-4">
            <span className="font-semibold text-stone-500">Legend:</span>
            <span><span className="font-semibold text-rose-600">CR (Sales / Receipt)</span> = Goods sold / Amount received</span>
            <span>·</span>
            <span><span className="font-semibold text-emerald-600">DR (Sales Return / Payment)</span> = Goods returned / Paid to customer</span>
            <span>·</span>
            <span><span className="font-semibold text-emerald-700">Balance Dr</span> = Still receivable from customer</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLedgerPage;
