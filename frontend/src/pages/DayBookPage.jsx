import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, RefreshCw, TrendingUp, TrendingDown,
  ArrowRightLeft, FileText, CreditCard, Receipt,
  ShoppingCart, RotateCcw, Repeat, Package, ArrowLeftRight,
  ChevronDown, ChevronRight,
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const ab = JSON.parse(sessionStorage.getItem('activeBranch') || 'null');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    ...(ab?.id ? { 'X-Branch-Id': String(ab.id) } : {}),
  };
};

const toLocalDateStr = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => toLocalDateStr(new Date());

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── config for each voucher type ───────────────────────────────────────────────
const TYPE_CONFIG = {
  Receipt:          { icon: FileText,      color: 'emerald', label: 'Receipt Voucher' },
  Sales:            { icon: ShoppingCart,  color: 'green',   label: 'Sales Voucher' },
  'Purchase Return':{ icon: Repeat,        color: 'teal',    label: 'Purchase Return' },
  Contra:           { icon: ArrowRightLeft,color: 'cyan',    label: 'Contra Voucher' },
  Payment:          { icon: CreditCard,    color: 'red',     label: 'Payment Voucher' },
  Expense:          { icon: Receipt,       color: 'rose',    label: 'Expense Voucher' },
  'Sales Return':   { icon: RotateCcw,     color: 'orange',  label: 'Sales Return' },
  Purchase:         { icon: ShoppingCart,  color: 'amber',   label: 'Purchase Voucher' },
  'Stock Data':     { icon: Package,       color: 'purple',  label: 'Stock Data' },
  'Stock Transfer': { icon: ArrowLeftRight,color: 'violet',  label: 'Stock Transfer' },
};

const COLOR_CLASSES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  green:   'bg-green-50   text-green-700   border-green-200',
  teal:    'bg-teal-50    text-teal-700    border-teal-200',
  cyan:    'bg-cyan-50    text-cyan-700    border-cyan-200',
  red:     'bg-red-50     text-red-700     border-red-200',
  rose:    'bg-rose-50    text-rose-700    border-rose-200',
  orange:  'bg-orange-50  text-orange-700  border-orange-200',
  amber:   'bg-amber-50   text-amber-700   border-amber-200',
  purple:  'bg-purple-50  text-purple-700  border-purple-200',
  violet:  'bg-violet-50  text-violet-700  border-violet-200',
};

// ── single voucher card ────────────────────────────────────────────────────────
const VoucherCard = ({ v, side }) => {
  const cfg = TYPE_CONFIG[v.type] || { icon: FileText, color: 'stone', label: v.type };
  const Icon = cfg.icon;
  const colorCls = COLOR_CLASSES[cfg.color] || 'bg-stone-50 text-stone-600 border-stone-200';
  const [expanded, setExpanded] = useState(false);
  const hasItems = v.items?.length > 0;

  return (
    <div className={`rounded-xl border bg-white shadow-sm overflow-hidden ${side === 'in' ? 'border-emerald-100' : 'border-red-100'}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        {/* type badge */}
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border flex-shrink-0 mt-0.5 ${colorCls}`}>
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>

        {/* middle: voucher no + party */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-stone-500">{v.voucherNo}</p>
          {v.party && (
            <p className="text-sm font-semibold text-stone-700 truncate mt-0.5" title={v.party}>
              {v.party}
            </p>
          )}
          {v.paymentMethod && (
            <p className="text-[11px] text-stone-400 mt-0.5">via {v.paymentMethod}</p>
          )}
          {v.narration && (
            <p className="text-[11px] text-stone-400 italic mt-0.5 truncate" title={v.narration}>
              {v.narration}
            </p>
          )}
        </div>

        {/* right: amount + expand */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {v.amount > 0 ? (
            <span className={`text-base font-bold tabular-nums ${side === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
              ₹{fmt(v.amount)}
            </span>
          ) : (
            <span className="text-xs text-stone-300 font-medium">— qty only</span>
          )}
          {hasItems && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="flex items-center gap-0.5 text-[10px] text-stone-400 hover:text-stone-600 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {v.items.length} item{v.items.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* items sub-row */}
      {expanded && hasItems && (
        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-2 space-y-1">
          {v.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-stone-500">
              <span className="truncate max-w-[60%]">{item.productName || '—'}</span>
              <span className="tabular-nums text-right">
                {item.qty} {item.rate ? `× ₹${item.rate}` : ''}{item.amount ? ` = ₹${fmt(item.amount)}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── section within a column ────────────────────────────────────────────────────
const VoucherSection = ({ title, rows, side }) => {
  if (rows.length === 0) return null;
  const total = rows.reduce((s, v) => s + (v.amount || 0), 0);
  return (
    <div className="space-y-2">
      <div className={`flex items-center justify-between px-1 py-0.5 border-b ${side === 'in' ? 'border-emerald-100' : 'border-red-100'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${side === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
          {title} <span className="opacity-60">({rows.length})</span>
        </span>
        {total > 0 && (
          <span className={`text-xs font-bold tabular-nums ${side === 'in' ? 'text-emerald-600' : 'text-red-600'}`}>
            ₹{fmt(total)}
          </span>
        )}
      </div>
      {rows.map(v => <VoucherCard key={v.id + v.type} v={v} side={side} />)}
    </div>
  );
};

// ── main page ──────────────────────────────────────────────────────────────────
const DayBookPage = () => {
  const [date,    setDate]    = useState(todayStr());
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async (d) => {
    if (!d) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/vouchers/day-book?date=${d}`, {
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load day book');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(date); }, [date, fetchData]);

  // Flatten all IN and OUT rows into lists
  const inRows  = data ? [...(data.in.receipts), ...(data.in.sales), ...(data.in.purchaseReturns), ...(data.in.contras)] : [];
  const outRows = data ? [...(data.out.payments), ...(data.out.expenses), ...(data.out.salesReturns), ...(data.out.purchases), ...(data.out.stockData), ...(data.out.stockTransfers)] : [];

  const totalIn  = inRows.reduce((s, v) => s + (v.amount || 0), 0);
  const totalOut = outRows.reduce((s, v) => s + (v.amount || 0), 0);
  const net      = totalIn - totalOut;

  const hasAny = inRows.length + outRows.length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="p-2 bg-rs-text-primary/10 rounded-xl flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-rs-text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-rs-text-primary font-user-serif tracking-tight">DSR</h1>
          <p className="text-sm text-rs-text-muted mt-0.5">Daily Summary Report — all voucher entries for a selected date</p>
        </div>
        <button
          onClick={() => fetchData(date)}
          disabled={loading}
          title="Refresh"
          className="p-2.5 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all disabled:opacity-40 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm">
          <CalendarDays className="w-4 h-4 text-rs-text-muted flex-shrink-0" />
          <label className="text-xs font-bold uppercase tracking-wider text-stone-400 whitespace-nowrap">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="text-sm font-semibold text-rs-text-primary border-none outline-none bg-transparent cursor-pointer"
          />
        </div>
        <button
          onClick={() => setDate(todayStr())}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all cursor-pointer"
        >
          Today
        </button>
        {data && (
          <span className="text-xs text-stone-400">
            {inRows.length + outRows.length} total entr{inRows.length + outRows.length === 1 ? 'y' : 'ies'}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-24 text-rs-text-muted text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {/* Summary cards */}
      {!loading && data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 rounded-xl flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Total In</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums mt-0.5 truncate">₹{fmt(totalIn)}</p>
            </div>
          </div>
          <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-red-50 rounded-xl flex-shrink-0">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Total Out</p>
              <p className="text-xl font-bold text-red-500 tabular-nums mt-0.5 truncate">₹{fmt(totalOut)}</p>
            </div>
          </div>
          <div className={`bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4 ${net >= 0 ? 'border border-emerald-100' : 'border border-red-100'}`}>
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${net >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <ArrowRightLeft className={`w-5 h-5 ${net >= 0 ? 'text-emerald-600' : 'text-red-500'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Net</p>
              <p className={`text-xl font-bold tabular-nums mt-0.5 truncate ${net === 0 ? 'text-stone-300' : net > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {net >= 0 ? '+' : ''}₹{fmt(Math.abs(net))}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      {!loading && data && hasAny && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* ── LEFT: Money IN (Green) ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-emerald-700">Money In</h2>
              <span className="text-xs text-stone-400 ml-1">— what we received</span>
              {inRows.length > 0 && (
                <span className="ml-auto text-sm font-bold text-emerald-600 tabular-nums">₹{fmt(totalIn)}</span>
              )}
            </div>
            <div className="space-y-5">
              <VoucherSection title="Receipt Voucher"   rows={data.in.receipts}        side="in" />
              <VoucherSection title="Sales Voucher"     rows={data.in.sales}           side="in" />
              <VoucherSection title="Purchase Return"   rows={data.in.purchaseReturns} side="in" />
              <VoucherSection title="Contra Voucher"    rows={data.in.contras}         side="in" />
              {inRows.length === 0 && (
                <p className="text-sm text-stone-300 italic text-center py-12 border border-dashed border-stone-200 rounded-xl">
                  No incoming entries for this date
                </p>
              )}
            </div>
          </div>

          {/* ── RIGHT: Money OUT (Red) ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <h2 className="text-base font-bold text-red-600">Money Out</h2>
              <span className="text-xs text-stone-400 ml-1">— what we paid / issued</span>
              {outRows.length > 0 && (
                <span className="ml-auto text-sm font-bold text-red-500 tabular-nums">₹{fmt(totalOut)}</span>
              )}
            </div>
            <div className="space-y-5">
              <VoucherSection title="Payment Voucher"   rows={data.out.payments}       side="out" />
              <VoucherSection title="Expense Voucher"   rows={data.out.expenses}       side="out" />
              <VoucherSection title="Sales Return"      rows={data.out.salesReturns}   side="out" />
              <VoucherSection title="Purchase Voucher"  rows={data.out.purchases}      side="out" />
              <VoucherSection title="Stock Data"        rows={data.out.stockData}      side="out" />
              <VoucherSection title="Stock Transfer"    rows={data.out.stockTransfers} side="out" />
              {outRows.length === 0 && (
                <p className="text-sm text-stone-300 italic text-center py-12 border border-dashed border-stone-200 rounded-xl">
                  No outgoing entries for this date
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && data && !hasAny && (
        <div className="text-center py-24 border border-dashed border-stone-200 rounded-2xl bg-white flex flex-col items-center gap-3">
          <CalendarDays className="w-10 h-10 text-stone-200" />
          <p className="text-sm text-stone-400">No voucher entries found for this date.</p>
          <p className="text-xs text-stone-300">Try selecting a different date.</p>
        </div>
      )}
    </div>
  );
};

export default DayBookPage;
