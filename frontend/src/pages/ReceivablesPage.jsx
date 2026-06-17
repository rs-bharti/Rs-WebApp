import { useState, useEffect, useCallback } from 'react';
import {
  ReceiptText, RefreshCw, AlertTriangle,
  CheckCircle2, Loader2, Check, ShoppingCart, Repeat,
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

const fmt = (n) =>
  Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const parseDays = (terms) => {
  if (!terms || terms === 'Cash') return 0;
  const m = terms.match(/^(\d+)\s+Days/);
  return m ? parseInt(m[1], 10) : 0;
};

const getDueDate = (date, terms) => {
  const days = parseDays(terms);
  if (!days) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const isOverdue = (v) => {
  if (v.isPaid) return false;
  const due = getDueDate(v.date, v.paymentTerms);
  if (!due) return false;
  return Date.now() > due.getTime();
};

const daysOverdue = (v) => {
  const due = getDueDate(v.date, v.paymentTerms);
  if (!due) return 0;
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000));
};

// ── Done button ────────────────────────────────────────────────────────────────
const DoneButton = ({ voucherType, id, onSuccess }) => {
  const [state, setState] = useState('idle'); // idle | loading | done

  const handleClick = async () => {
    if (state !== 'idle') return;
    setState('loading');
    try {
      const res = await fetch(
        `${API_URL}/api/vouchers/receivables-entries/${voucherType}/${id}/mark-paid`,
        { method: 'PATCH', headers: authHeaders() }
      );
      if (!res.ok) throw new Error();
      setState('done');
      setTimeout(onSuccess, 500);
    } catch {
      setState('idle');
    }
  };

  if (state === 'done')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
        <Check className="w-3 h-3" /> Done!
      </span>
    );

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-stone-200 bg-white text-[10px] font-bold text-stone-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer disabled:opacity-50"
    >
      {state === 'loading' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
      Done
    </button>
  );
};

// ── Column header row ──────────────────────────────────────────────────────────
const ColHeader = ({ overdue }) => (
  <div className="grid grid-cols-[100px_90px_100px_1fr_140px_100px_120px_90px] gap-3 px-4 py-2 border-b border-stone-100 bg-stone-50/80">
    {['Voucher No', 'Date', 'Type', 'Party', 'Terms', overdue ? 'Overdue' : 'Due Date', 'Amount', ''].map((h, i) => (
      <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate">{h}</span>
    ))}
  </div>
);

// ── Single compact row ─────────────────────────────────────────────────────────
const EntryRow = ({ v, voucherType, party, isOverdueRow, onPaid }) => {
  const dueDate = getDueDate(v.date, v.paymentTerms);
  const over    = isOverdueRow ? daysOverdue(v) : 0;
  const days    = parseDays(v.paymentTerms);
  const isSales = voucherType === 'sales';

  return (
    <div className={`grid grid-cols-[100px_90px_100px_1fr_140px_100px_120px_90px] gap-3 items-center px-4 py-2.5 border-b border-stone-50 transition-colors ${
      isOverdueRow ? 'bg-red-50/40 hover:bg-red-50/70' : 'hover:bg-stone-50/60'
    }`}>

      {/* Voucher No */}
      <span className="text-[11px] font-mono text-stone-400 truncate">{v.voucherNo || '—'}</span>

      {/* Date */}
      <span className="text-[11px] text-stone-400 truncate">{fmtDate(v.date)}</span>

      {/* Type badge */}
      <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
        isSales ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'
      }`}>
        {isSales ? <ShoppingCart className="w-2.5 h-2.5" /> : <Repeat className="w-2.5 h-2.5" />}
        {isSales ? 'Sales' : 'Pur. Return'}
      </span>

      {/* Party */}
      <span className="text-sm font-semibold text-stone-700 truncate">{party}</span>

      {/* Terms */}
      <span className="text-[10px] text-stone-400 truncate">
        {days ? `${days} Days` : (v.paymentTerms || '—')}
      </span>

      {/* Due date / overdue */}
      {isOverdueRow ? (
        <span className="text-[10px] font-semibold text-red-500 truncate">{over}d overdue</span>
      ) : (
        <span className="text-[10px] text-stone-400 truncate">
          {dueDate ? fmtDate(dueDate) : '—'}
        </span>
      )}

      {/* Amount */}
      <span className={`text-sm font-bold tabular-nums text-right ${
        v.isPaid ? 'line-through text-stone-300' : isSales ? 'text-green-600' : 'text-teal-600'
      }`}>
        ₹{fmt(v.totalAmount)}
      </span>

      {/* Action */}
      <div className="flex justify-end">
        {v.isPaid ? (
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> Paid
          </span>
        ) : (
          <DoneButton voucherType={voucherType} id={v.id} onSuccess={onPaid} />
        )}
      </div>
    </div>
  );
};

// ── Section ────────────────────────────────────────────────────────────────────
const Section = ({ title, icon: Icon, iconCls, count, total, totalCls, borderCls, rows, overdue, onPaid }) => {
  if (!rows.length) return null;
  return (
    <div className="mb-6">
      {/* Section heading */}
      <div className={`flex items-center justify-between px-1 pb-2 mb-0 border-b-2 ${borderCls}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconCls}`} />
          <h2 className={`text-sm font-bold uppercase tracking-widest ${iconCls}`}>{title}</h2>
          <span className="text-[10px] text-stone-400 font-medium">{count} {count === 1 ? 'entry' : 'entries'}</span>
        </div>
        <span className={`text-base font-bold tabular-nums ${totalCls}`}>₹{fmt(total)}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-xl border border-t-0 border-stone-100 overflow-hidden shadow-sm">
        <ColHeader overdue={overdue} />
        {rows.map((v) => (
          <EntryRow
            key={`${v._type ?? (overdue ? 'od' : 'e')}-${v.id}`}
            v={v}
            voucherType={v._type ?? (v.voucherNo?.startsWith('SV') ? 'sales' : 'purchase-return')}
            party={v._party ?? (v.customerName || v.customer?.name || v.supplierName || v.supplier?.name || '—')}
            isOverdueRow={overdue}
            onPaid={onPaid}
          />
        ))}
      </div>
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────
const ReceivablesPage = () => {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/api/vouchers/receivables-entries`, { headers: authHeaders() });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed');
      setData(json);
    } catch (e) {
      setError(e.message || 'Failed to load');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const overdueEntries = data
    ? [
        ...data.sales.filter(isOverdue).map(v => ({
          ...v, _type: 'sales',
          _party: v.customerName || v.customer?.name || '—',
        })),
        ...data.purchaseReturns.filter(isOverdue).map(v => ({
          ...v, _type: 'purchase-return',
          _party: v.supplierName || v.supplier?.name || '—',
        })),
      ].sort((a, b) => daysOverdue(b) - daysOverdue(a))
    : [];

  const normalEntries = data
    ? [
        ...data.sales.filter(v => !v.isPaid && !isOverdue(v)).map(v => ({
          ...v, _type: 'sales',
          _party: v.customerName || v.customer?.name || '—',
        })),
        ...data.purchaseReturns.filter(v => !v.isPaid && !isOverdue(v)).map(v => ({
          ...v, _type: 'purchase-return',
          _party: v.supplierName || v.supplier?.name || '—',
        })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date))
    : [];

  const totalOverdue = overdueEntries.reduce((s, v) => s + (v.totalAmount || 0), 0);
  const totalNormal  = normalEntries.reduce((s, v) => s + (v.totalAmount || 0), 0);

  return (
    <div className="w-full py-4 animate-in fade-in duration-300">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <ReceiptText className="w-6 h-6 text-brand-primary" />
          <div>
            <h1 className="text-xl font-bold text-brand-primary font-serif leading-none">Receivables</h1>
            <p className="text-[11px] text-stone-400 mt-0.5">Sales &amp; Purchase Return — mark Done when payment is received</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {data && (
            <>
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400">Overdue</p>
                <p className="text-base font-bold text-red-500 tabular-nums">₹{fmt(totalOverdue)}</p>
              </div>
              <div className="w-px h-8 bg-stone-200" />
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Pending</p>
                <p className="text-base font-bold text-stone-700 tabular-nums">₹{fmt(totalNormal)}</p>
              </div>
              <div className="w-px h-8 bg-stone-200" />
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-brand-primary/50">Total</p>
                <p className="text-base font-bold text-brand-primary tabular-nums font-serif">₹{fmt(data.grandTotal)}</p>
              </div>
            </>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-lg border border-stone-200 bg-white text-stone-400 hover:text-brand-primary hover:border-brand-primary/30 transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="border-t border-stone-100 mb-5" />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 py-32 text-stone-400 text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {!loading && data && (
        <>
          {/* ── OVERDUE ── */}
          <Section
            title="Overdue"
            icon={AlertTriangle}
            iconCls="text-red-500"
            borderCls="border-red-300"
            count={overdueEntries.length}
            total={totalOverdue}
            totalCls="text-red-500"
            rows={overdueEntries}
            overdue={true}
            onPaid={fetchData}
          />

          {/* ── NORMAL ENTRIES ── */}
          <Section
            title="Pending Entries"
            icon={ReceiptText}
            iconCls="text-brand-primary"
            borderCls="border-brand-primary/30"
            count={normalEntries.length}
            total={totalNormal}
            totalCls="text-brand-primary"
            rows={normalEntries}
            overdue={false}
            onPaid={fetchData}
          />

          {/* ── Empty ── */}
          {overdueEntries.length === 0 && normalEntries.length === 0 && (
            <div className="text-center py-28 border border-dashed border-stone-200 rounded-xl bg-white flex flex-col items-center gap-2">
              <ReceiptText className="w-8 h-8 text-stone-200" />
              <p className="text-sm font-semibold text-stone-400">No pending receivables</p>
              <p className="text-xs text-stone-300">Sales and Purchase Return entries will appear here.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReceivablesPage;
