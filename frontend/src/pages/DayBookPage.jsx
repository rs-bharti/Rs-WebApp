import { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, RefreshCw, TrendingUp, TrendingDown,
  ArrowRightLeft, FileText, CreditCard,
  ShoppingCart, RotateCcw, Repeat, Package, ArrowLeftRight,
  ChevronDown, ChevronRight, ChevronLeft, Download,
} from 'lucide-react';
import { exportDSR } from '../utils/exportLedger';

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
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const todayStr = () => toLocalDateStr(new Date());

const shiftDate = (dateStr, days) => {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalDateStr(d);
};

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDateDisplay = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'short', year: 'numeric',
  });

// Sequential section configs (Receipt → Payment → Contra → Sales → Sales Return → Purchase → Purchase Return → Expense → Stock Data → Stock Transfer)
const SECTIONS = [
  { key: 'receipts',        from: 'in',  label: 'Receipt',         Icon: FileText,       border: 'border-l-emerald-400', headerBg: 'bg-emerald-50',   badge: 'bg-emerald-100 text-emerald-700', amtCls: 'text-emerald-600', inOut: 'IN' },
  { key: 'payments',        from: 'out', label: 'Payment',         Icon: CreditCard,     border: 'border-l-red-400',     headerBg: 'bg-red-50',       badge: 'bg-red-100 text-red-700',       amtCls: 'text-red-600',     inOut: 'OUT' },
  { key: 'contras',         from: 'in',  label: 'Contra',          Icon: ArrowRightLeft, border: 'border-l-cyan-400',    headerBg: 'bg-cyan-50',      badge: 'bg-cyan-100 text-cyan-700',     amtCls: 'text-cyan-600',    inOut: 'IN' },
  { key: 'sales',           from: 'in',  label: 'Sales',           Icon: ShoppingCart,   border: 'border-l-green-400',   headerBg: 'bg-green-50',     badge: 'bg-green-100 text-green-700',   amtCls: 'text-green-600',   inOut: 'IN' },
  { key: 'salesReturns',    from: 'out', label: 'Sales Return',    Icon: RotateCcw,      border: 'border-l-orange-400',  headerBg: 'bg-orange-50',    badge: 'bg-orange-100 text-orange-700', amtCls: 'text-orange-600',  inOut: 'OUT' },
  { key: 'purchases',       from: 'out', label: 'Purchase',        Icon: ShoppingCart,   border: 'border-l-amber-400',   headerBg: 'bg-amber-50',     badge: 'bg-amber-100 text-amber-700',   amtCls: 'text-amber-600',   inOut: 'OUT' },
  { key: 'purchaseReturns', from: 'in',  label: 'Purchase Return', Icon: Repeat,         border: 'border-l-teal-400',    headerBg: 'bg-teal-50',      badge: 'bg-teal-100 text-teal-700',     amtCls: 'text-teal-600',    inOut: 'IN' },
  { key: 'stockData',       from: 'out', label: 'Stock Data',      Icon: Package,        border: 'border-l-purple-400',  headerBg: 'bg-purple-50',    badge: 'bg-purple-100 text-purple-700', amtCls: 'text-purple-600',  inOut: 'OUT' },
  { key: 'stockTransfers',  from: 'out', label: 'Stock Transfer',  Icon: ArrowLeftRight, border: 'border-l-violet-400',  headerBg: 'bg-violet-50',    badge: 'bg-violet-100 text-violet-700', amtCls: 'text-violet-600',  inOut: 'OUT' },
];

// ── Single voucher row ─────────────────────────────────────────────────────────
const VoucherRow = ({ v, isLast, amtCls }) => {
  const [expanded, setExpanded] = useState(false);
  const hasItems = v.items?.length > 0;

  return (
    <>
      <div className={`flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.018] transition-colors group ${!isLast || expanded ? 'border-b border-stone-100' : ''}`}>
        <span className="text-[11px] font-mono text-stone-400 w-[88px] flex-shrink-0 truncate">{v.voucherNo || '—'}</span>

        <div className="flex-1 min-w-0">
          {v.party
            ? <p className="text-sm font-semibold text-stone-700 truncate leading-tight">{v.party}</p>
            : <p className="text-xs text-stone-300 italic">—</p>
          }
          {v.paymentMethod && (
            <p className="text-[10px] text-stone-400 leading-tight">via {v.paymentMethod}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {v.amount > 0
            ? <span className={`text-sm font-bold tabular-nums ${amtCls}`}>₹{fmt(v.amount)}</span>
            : <span className="text-[11px] text-stone-300 italic">qty only</span>
          }
          {hasItems && (
            <button
              onClick={() => setExpanded(p => !p)}
              className="w-5 h-5 flex items-center justify-center text-stone-300 hover:text-stone-500 transition-colors cursor-pointer"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {expanded && hasItems && (
        <div className={`bg-stone-50/80 px-4 py-2 space-y-1 ${!isLast ? 'border-b border-stone-100' : ''}`}>
          <div className="flex items-center gap-2 px-2 pb-1 border-b border-stone-100 mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 flex-1">Product</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Qty × Rate = Amount</span>
          </div>
          {v.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-xs text-stone-500 px-2 py-0.5">
              <span className="truncate max-w-[55%] font-medium">{item.productName || '—'}</span>
              <span className="tabular-nums text-stone-400">
                {item.qty}{item.rate ? ` × ₹${item.rate}` : ''}{item.amount ? ` = ₹${fmt(item.amount)}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ── Section block ──────────────────────────────────────────────────────────────
const SectionBlock = ({ section, rows }) => {
  const [collapsed, setCollapsed] = useState(false);
  if (!rows?.length) return null;

  const { label, Icon, border, headerBg, badge, amtCls, inOut } = section;
  const subtotal = rows.reduce((s, v) => s + (v.amount || 0), 0);
  const isIn = inOut === 'IN';

  return (
    <div className={`rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden border-l-4 ${border}`}>
      <button
        type="button"
        onClick={() => setCollapsed(p => !p)}
        className={`w-full flex items-center gap-3 px-4 py-3 ${headerBg} hover:brightness-[0.97] transition-all cursor-pointer`}
      >
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest flex-shrink-0 ${badge}`}>
          <Icon className="w-3 h-3" />
          {label}
        </span>

        <span className="text-[10px] text-stone-400 font-semibold">
          {rows.length} entr{rows.length === 1 ? 'y' : 'ies'}
        </span>

        <span className={`ml-auto text-sm font-bold tabular-nums ${amtCls}`}>
          ₹{fmt(subtotal)}
        </span>

        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${isIn ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {inOut}
        </span>

        {collapsed
          ? <ChevronRight className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
          : <ChevronDown  className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
        }
      </button>

      {!collapsed && (
        <>
          <div className="flex items-center gap-3 px-4 py-1.5 bg-stone-50/70 border-b border-stone-100">
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 w-[88px] flex-shrink-0">Voucher No</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 flex-1">Party / Details</span>
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Amount</span>
          </div>

          {rows.map((v, i) => (
            <VoucherRow key={`${v.id}-${i}`} v={v} isLast={i === rows.length - 1} amtCls={amtCls} />
          ))}

          <div className={`flex items-center justify-between px-4 py-2 border-t border-stone-100 ${headerBg}`}>
            <span className="text-[9px] font-bold uppercase tracking-widest text-stone-500">Subtotal</span>
            <span className={`text-sm font-bold tabular-nums ${amtCls}`}>₹{fmt(subtotal)}</span>
          </div>
        </>
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
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
      const res  = await fetch(`${API_URL}/api/vouchers/day-book?date=${d}`, { headers: authHeaders() });
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

  const inRows  = data ? [...data.in.receipts, ...data.in.sales, ...data.in.purchaseReturns, ...data.in.contras] : [];
  const outRows = data ? [...data.out.payments, ...data.out.salesReturns, ...data.out.purchases, ...data.out.stockData, ...data.out.stockTransfers] : [];
  const totalIn  = inRows.reduce((s, v)  => s + (v.amount || 0), 0);
  const totalOut = outRows.reduce((s, v) => s + (v.amount || 0), 0);
  const net      = totalIn - totalOut;
  const hasAny   = inRows.length + outRows.length > 0;
  const isToday  = date === todayStr();

  const getRows = (section) => data ? (data[section.from][section.key] ?? []) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-in fade-in duration-300">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-rs-text-primary/10 rounded-xl flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-rs-text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-rs-text-primary font-user-serif tracking-tight">DSR</h1>
          <p className="text-xs text-rs-text-muted mt-0.5 truncate">Daily Sales Report — voucher summary by date</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {data && hasAny && (
            <button
              onClick={() => exportDSR({ date, data, totalIn, totalOut })}
              title="Download Excel"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Excel
            </button>
          )}
          <button
            onClick={() => fetchData(date)}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Date navigator ── */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setDate(d => shiftDate(d, -1))}
          className="p-2.5 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all cursor-pointer flex-shrink-0"
          title="Previous day"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-2.5 bg-white border border-stone-200 rounded-xl px-4 py-2.5 shadow-sm">
          <CalendarDays className="w-4 h-4 text-rs-text-muted flex-shrink-0" />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="flex-1 text-sm font-semibold text-rs-text-primary border-none outline-none bg-transparent cursor-pointer min-w-0"
          />
          <span className="text-xs text-stone-400 hidden sm:block whitespace-nowrap">{fmtDateDisplay(date)}</span>
        </div>

        <button
          onClick={() => setDate(d => shiftDate(d, 1))}
          className="p-2.5 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all cursor-pointer flex-shrink-0"
          title="Next day"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => setDate(todayStr())}
          className={`px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider rounded-xl border transition-all cursor-pointer flex-shrink-0 ${
            isToday
              ? 'bg-rs-text-primary text-white border-rs-text-primary shadow-sm'
              : 'bg-white border-stone-200 text-stone-500 hover:border-rs-text-primary/40 hover:text-rs-text-primary'
          }`}
        >
          Today
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 py-28 text-rs-text-muted text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading…
        </div>
      )}

      {/* ── Summary cards ── */}
      {!loading && data && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500/80">Total In</span>
            </div>
            <p className="text-xl font-bold text-emerald-600 tabular-nums leading-none">₹{fmt(totalIn)}</p>
            <p className="text-[10px] text-stone-400 mt-1.5">{inRows.length} entr{inRows.length === 1 ? 'y' : 'ies'}</p>
          </div>

          <div className="bg-white border border-red-100 rounded-2xl px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-red-500" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-red-500/80">Total Out</span>
            </div>
            <p className="text-xl font-bold text-red-500 tabular-nums leading-none">₹{fmt(totalOut)}</p>
            <p className="text-[10px] text-stone-400 mt-1.5">{outRows.length} entr{outRows.length === 1 ? 'y' : 'ies'}</p>
          </div>

          <div className={`bg-white rounded-2xl px-4 py-3.5 shadow-sm border ${net >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <ArrowRightLeft className={`w-3.5 h-3.5 ${net >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
              <span className={`text-[9px] font-bold uppercase tracking-widest ${net >= 0 ? 'text-emerald-500/80' : 'text-red-500/80'}`}>Net</span>
            </div>
            <p className={`text-xl font-bold tabular-nums leading-none ${net === 0 ? 'text-stone-300' : net > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {net > 0 ? '+' : net < 0 ? '−' : ''}₹{fmt(Math.abs(net))}
            </p>
            <p className="text-[10px] text-stone-400 mt-1.5">{net > 0 ? 'surplus' : net < 0 ? 'deficit' : 'break even'}</p>
          </div>
        </div>
      )}

      {/* ── Sequential voucher sections ── */}
      {!loading && data && hasAny && (
        <div className="space-y-2.5">
          {SECTIONS.map(section => (
            <SectionBlock key={section.key} section={section} rows={getRows(section)} />
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && data && !hasAny && (
        <div className="text-center py-24 border border-dashed border-stone-200 rounded-2xl bg-white flex flex-col items-center gap-3">
          <CalendarDays className="w-10 h-10 text-stone-200" />
          <p className="text-sm font-semibold text-stone-400">{fmtDateDisplay(date)}</p>
          <p className="text-xs text-stone-300">No voucher entries for this date.</p>
        </div>
      )}
    </div>
  );
};

export default DayBookPage;
