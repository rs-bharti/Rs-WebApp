import { useState, useEffect, useCallback } from 'react';
import {
  Bell, RefreshCw, AlertTriangle, CheckCircle2,
  Loader2, Check, ShoppingCart, Repeat, RotateCcw, Package,
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
  return due ? Date.now() > due.getTime() : false;
};

const daysOverdue = (v) => {
  const due = getDueDate(v.date, v.paymentTerms);
  if (!due) return 0;
  return Math.max(0, Math.floor((Date.now() - due.getTime()) / 86400000));
};

// type metadata
const TYPE_META = {
  sales:           { label: 'Sales',          Icon: ShoppingCart, bg: 'bg-green-100',  text: 'text-green-700',  affectsReceivable: true  },
  'purchase-return':{ label: 'Pur. Return',   Icon: Repeat,       bg: 'bg-teal-100',   text: 'text-teal-700',   affectsReceivable: true  },
  'sales-return':  { label: 'Sales Return',   Icon: RotateCcw,    bg: 'bg-orange-100', text: 'text-orange-700', affectsReceivable: false },
  purchase:        { label: 'Purchase',       Icon: Package,      bg: 'bg-amber-100',  text: 'text-amber-700',  affectsReceivable: false },
};

// ── Done button ────────────────────────────────────────────────────────────────
const DoneButton = ({ voucherType, id, onSuccess }) => {
  const [state, setState] = useState('idle');

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
      // If this type affects receivable, notify dashboard to refresh
      if (TYPE_META[voucherType]?.affectsReceivable) {
        window.dispatchEvent(new Event('receivable-paid'));
      }
      setTimeout(onSuccess, 400);
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

// ── Column headers ─────────────────────────────────────────────────────────────
const DATE_COL_LABEL = { overdue: 'Overdue', completed: 'Paid On', pending: 'Due Date' };

const ColHeader = ({ mode }) => (
  <div className="grid grid-cols-[100px_82px_110px_1fr_130px_100px_120px_88px] gap-2 px-4 py-2 border-b border-stone-100 bg-stone-50/80">
    {['Voucher No', 'Date', 'Type', 'Party', 'Terms', DATE_COL_LABEL[mode], 'Amount', ''].map((h, i) => (
      <span key={i} className="text-[9px] font-bold uppercase tracking-widest text-stone-400 truncate">{h}</span>
    ))}
  </div>
);

// ── Single row ─────────────────────────────────────────────────────────────────
const EntryRow = ({ v, mode, onPaid }) => {
  const meta    = TYPE_META[v._type] || TYPE_META.sales;
  const { Icon } = meta;
  const dueDate = getDueDate(v.date, v.paymentTerms);
  const days    = parseDays(v.paymentTerms);
  const over    = mode === 'overdue' ? daysOverdue(v) : 0;

  return (
    <div className={`grid grid-cols-[100px_82px_110px_1fr_130px_100px_120px_88px] gap-2 items-center px-4 py-2.5 border-b border-stone-50 transition-colors ${
      mode === 'overdue' ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-stone-50/50'
    }`}>

      <span className="text-[11px] font-mono text-stone-400 truncate">{v.voucherNo || '—'}</span>

      <span className="text-[11px] text-stone-400">{fmtDate(v.date)}</span>

      <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${meta.bg} ${meta.text}`}>
        <Icon className="w-2.5 h-2.5" />
        {meta.label}
        {!meta.affectsReceivable && (
          <span className="ml-0.5 text-[8px] opacity-60">notify</span>
        )}
      </span>

      <span className="text-sm font-semibold text-stone-700 truncate">{v._party}</span>

      <span className="text-[10px] text-stone-400 truncate">
        {days ? `${days} Days` : (v.paymentTerms || '—')}
      </span>

      {mode === 'overdue' ? (
        <span className="text-[10px] font-bold text-red-500">{over}d overdue</span>
      ) : mode === 'completed' ? (
        <span className="text-[10px] text-emerald-500">{v.paidAt ? fmtDate(v.paidAt) : '—'}</span>
      ) : (
        <span className="text-[10px] text-stone-400">{dueDate ? fmtDate(dueDate) : '—'}</span>
      )}

      <span className={`text-sm font-bold tabular-nums text-right ${
        v.isPaid ? 'line-through text-stone-300'
          : meta.affectsReceivable
            ? (v._type === 'sales' ? 'text-green-600' : 'text-teal-600')
            : 'text-stone-600'
      }`}>
        ₹{fmt(v.totalAmount)}
      </span>

      <div className="flex justify-end">
        {v.isPaid ? (
          <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-0.5">
            <CheckCircle2 className="w-3 h-3" /> Done
          </span>
        ) : (
          <DoneButton voucherType={v._type} id={v.id} onSuccess={onPaid} />
        )}
      </div>
    </div>
  );
};

// ── Section ────────────────────────────────────────────────────────────────────
const Section = ({ title, SectionIcon, iconCls, borderCls, count, total, totalCls, rows, mode, onPaid }) => {
  if (!rows.length) return null;
  return (
    <div className="mb-5">
      <div className={`flex items-center justify-between px-1 pb-2 border-b-2 ${borderCls}`}>
        <div className="flex items-center gap-2">
          <SectionIcon className={`w-4 h-4 ${iconCls}`} />
          <h2 className={`text-sm font-bold uppercase tracking-widest ${iconCls}`}>{title}</h2>
          <span className="text-[10px] text-stone-400">{count} {count === 1 ? 'entry' : 'entries'}</span>
        </div>
        {total > 0 && (
          <span className={`text-base font-bold tabular-nums ${totalCls}`}>₹{fmt(total)}</span>
        )}
      </div>
      <div className="bg-white rounded-b-xl border border-t-0 border-stone-100 overflow-hidden shadow-sm">
        <ColHeader mode={mode} />
        {rows.map((v) => (
          <EntryRow key={`${v._type}-${v.id}`} v={v} mode={mode} onPaid={onPaid} />
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

  // Flatten all 4 types into a unified list with metadata
  const allEntries = data ? [
    ...data.sales.map(v => ({ ...v, _type: 'sales', _party: v.customerName || v.customer?.name || '—' })),
    ...data.purchaseReturns.map(v => ({ ...v, _type: 'purchase-return', _party: v.supplierName || v.supplier?.name || '—' })),
    ...data.salesReturns.map(v => ({ ...v, _type: 'sales-return', _party: v.customerName || v.customer?.name || '—' })),
    ...data.purchases.map(v => ({ ...v, _type: 'purchase', _party: v.supplierName || v.supplier?.name || '—' })),
  ] : [];

  const overdueEntries = allEntries
    .filter(isOverdue)
    .sort((a, b) => daysOverdue(b) - daysOverdue(a));

  const pendingEntries = allEntries
    .filter(v => !v.isPaid && !isOverdue(v))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const completedEntries = allEntries
    .filter(v => v.isPaid)
    .sort((a, b) => new Date(b.paidAt || b.date) - new Date(a.paidAt || a.date));

  const overdueTotal  = overdueEntries
    .filter(v => TYPE_META[v._type]?.affectsReceivable)
    .reduce((s, v) => s + (v.totalAmount || 0), 0);

  const totalPending  = [...overdueEntries, ...pendingEntries]
    .filter(v => TYPE_META[v._type]?.affectsReceivable)
    .reduce((s, v) => s + (v.totalAmount || 0), 0);

  return (
    <div className="w-full py-4 animate-in fade-in duration-300">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-brand-primary" />
          <div>
            <h1 className="text-xl font-bold text-brand-primary font-serif leading-none">Consignment Tracker</h1>
            <p className="text-[11px] text-stone-400 mt-0.5">
              All vouchers with payment terms — click Done when payment is received
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          {data && (
            <>
              {overdueEntries.length > 0 && (
                <>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-red-400">Overdue</p>
                    <p className="text-base font-bold text-red-500 tabular-nums">
                      {overdueEntries.length} entries · ₹{fmt(overdueTotal)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-stone-200" />
                </>
              )}
              <div className="text-right">
                <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Receivable Total</p>
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

      <div className="border-t border-stone-100 mb-5" />

      {/* Legend */}
      {data && (
        <div className="flex items-center gap-4 mb-5 flex-wrap">
          <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Legend:</span>
          {Object.entries(TYPE_META).map(([key, m]) => (
            <span key={key} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold ${m.bg} ${m.text}`}>
              <m.Icon className="w-2.5 h-2.5" />
              {m.label}
              {m.affectsReceivable
                ? <span className="opacity-60">→ affects receivable</span>
                : <span className="opacity-60">→ notify only</span>}
            </span>
          ))}
        </div>
      )}

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
          <Section
            title="Overdue"
            SectionIcon={AlertTriangle}
            iconCls="text-red-500"
            borderCls="border-red-300"
            count={overdueEntries.length}
            total={overdueTotal}
            totalCls="text-red-500"
            rows={overdueEntries}
            mode="overdue"
            onPaid={fetchData}
          />

          <Section
            title="Pending"
            SectionIcon={Bell}
            iconCls="text-brand-primary"
            borderCls="border-brand-primary/30"
            count={pendingEntries.length}
            total={totalPending}
            totalCls="text-brand-primary"
            rows={pendingEntries}
            mode="pending"
            onPaid={fetchData}
          />

          {overdueEntries.length === 0 && pendingEntries.length === 0 && completedEntries.length === 0 && (
            <div className="text-center py-28 border border-dashed border-stone-200 rounded-xl bg-white flex flex-col items-center gap-2">
              <Bell className="w-8 h-8 text-stone-200" />
              <p className="text-sm font-semibold text-stone-400">No pending consignment entries</p>
              <p className="text-xs text-stone-300">Vouchers with consignment payment terms will appear here.</p>
            </div>
          )}

          <Section
            title="Completed"
            SectionIcon={CheckCircle2}
            iconCls="text-emerald-500"
            borderCls="border-emerald-300"
            count={completedEntries.length}
            total={0}
            totalCls="text-emerald-500"
            rows={completedEntries}
            mode="completed"
            onPaid={fetchData}
          />
        </>
      )}
    </div>
  );
};

export default ReceivablesPage;
