import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Landmark, TrendingUp, TrendingDown, X, Users, ChevronDown, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import { getDashboardBalance } from '../api/masters';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const activeBranch = JSON.parse(sessionStorage.getItem('activeBranch') || 'null');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    ...(activeBranch?.id ? { 'X-Branch-Id': String(activeBranch.id) } : {}),
  };
};

const fmt = (n) =>
  Math.abs(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const CATEGORY_STYLE = {
  CASH: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', openingBg: 'bg-emerald-50', openingBorder: 'border-b border-emerald-100' },
  BANK: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',       openingBg: 'bg-blue-50',    openingBorder: 'border-b border-blue-100'    },
};

const MethodPicker = ({ categoryFiltered, selectedMethodId, setSelectedMethodId, hasReceivables }) => {
  const [open,     setOpen]    = useState(false);
  const [dropPos,  setDropPos] = useState({});
  const triggerRef = useRef(null);
  const dropRef    = useRef(null);

  const isReceivables = selectedMethodId === 'receivables';
  const selectedData  = (!isReceivables && selectedMethodId)
    ? categoryFiltered.find(d => String(d.method.id) === selectedMethodId)?.method
    : null;

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 8;
      const openUp     = spaceBelow < 260;
      setDropPos(openUp
        ? { bottom: window.innerHeight - rect.top + 4, left: rect.left, minWidth: Math.max(rect.width, 240) }
        : { top:    rect.bottom + 4,                   left: rect.left, minWidth: Math.max(rect.width, 240) }
      );
    }
    setOpen(o => !o);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler, true);
    return () => document.removeEventListener('mousedown', handler, true);
  }, [open]);

  const catStyle = (cat) => CATEGORY_STYLE[cat] || { dot: 'bg-stone-400', badge: 'bg-stone-100 text-stone-600', text: 'text-stone-600' };

  const clearable = !!selectedMethodId;

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggle}
        className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg border cursor-pointer min-w-[220px] transition-colors ${
          open ? 'border-stone-400 bg-white' : 'border-stone-200 bg-stone-50 hover:border-stone-300'
        }`}
      >
        {isReceivables ? (
          <>
            <span className="w-2 h-2 rounded-full flex-shrink-0 bg-indigo-500" />
            <span className="text-sm text-stone-700 font-medium flex-1 truncate">Total Receivables</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 bg-indigo-100 text-indigo-700">RECV</span>
          </>
        ) : selectedData ? (
          <>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${catStyle(selectedData.category).dot}`} />
            <span className="text-sm text-stone-700 font-medium flex-1 truncate">{selectedData.name}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${catStyle(selectedData.category).badge}`}>
              {selectedData.category}
            </span>
          </>
        ) : (
          <span className="text-sm text-stone-400 flex-1 italic">Select a method…</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-stone-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
        {clearable && (
          <span
            onClick={e => { e.stopPropagation(); setSelectedMethodId(''); setOpen(false); }}
            className="ml-0.5 text-stone-300 hover:text-stone-500 cursor-pointer transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
      </div>

      {open && createPortal(
        <div
          ref={dropRef}
          style={{ position: 'fixed', zIndex: 9999, ...dropPos }}
          className="bg-white border border-stone-200 rounded-xl shadow-2xl overflow-hidden py-1"
        >
          {['CASH', 'BANK'].map(cat => {
            const group = categoryFiltered.filter(d => d.method.category === cat);
            if (!group.length) return null;
            const cs = catStyle(cat);
            return (
              <div key={cat}>
                <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest border-b border-stone-100 ${cs.text} bg-stone-50/60`}>
                  {cat}
                </div>
                {group.map(d => {
                  const isActive = String(d.method.id) === selectedMethodId;
                  return (
                    <div
                      key={d.method.id}
                      onClick={() => { setSelectedMethodId(String(d.method.id)); setOpen(false); }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                        isActive ? `${cs.badge} font-semibold` : `hover:bg-stone-50 text-stone-700`
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cs.dot}`} />
                      <span className="text-sm flex-1 truncate">{d.method.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${cs.badge}`}>{cat}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {hasReceivables && (
            <>
              <div className="px-3 py-1 text-[9px] font-bold uppercase tracking-widest border-t border-stone-100 text-indigo-600 bg-stone-50/60">
                Receivables
              </div>
              <div
                onClick={() => { setSelectedMethodId('receivables'); setOpen(false); }}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors ${
                  isReceivables ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-stone-50 text-stone-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0 bg-indigo-500" />
                <span className="text-sm flex-1">Total Receivables</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 bg-indigo-100 text-indigo-700">RECV</span>
              </div>
            </>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

const EntryTable = ({ entries, openingBal, currencySymbol, fromDate, toDate }) => {
  const dateFiltered = (fromDate || toDate)
    ? entries.filter(r => {
        const d = new Date(r.date);
        if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
        if (toDate   && d > new Date(toDate   + 'T23:59:59')) return false;
        return true;
      })
    : entries;

  let runBal = openingBal;
  const withBalance = dateFiltered.map(r => {
    if (r.type === 'receipt') runBal += r.amount;
    else                      runBal -= r.amount;
    return { ...r, balance: Math.round(runBal * 100) / 100 };
  });

  const totalIn  = dateFiltered.filter(r => r.type === 'receipt').reduce((s, r) => s + r.amount, 0);
  const totalOut = dateFiltered.filter(r => r.type === 'payment').reduce((s, r) => s + r.amount, 0);
  const closing  = withBalance.length ? withBalance[withBalance.length - 1].balance : openingBal;

  return { dateFiltered, withBalance, totalIn, totalOut, closing };
};

const MethodSection = ({ data, fromDate, toDate, currencySymbol }) => {
  const { method, entries } = data;
  const style = CATEGORY_STYLE[method.category] || { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', dot: 'bg-stone-400' };
  const { withBalance, totalIn, totalOut, closing } = EntryTable({ entries, openingBal: method.openingBalance, currencySymbol, fromDate, toDate });

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm ${style.border}`}>
      <div className={`px-5 py-4 flex items-center justify-between flex-wrap gap-3 ${style.bg}`}>
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
          <div>
            <p className={`font-bold text-base ${style.text}`}>{method.name}</p>
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">{method.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-right">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Opening</p>
            <p className="text-sm font-bold text-stone-600 tabular-nums">{currencySymbol} {fmt(method.openingBalance)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Total In</p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">{currencySymbol} {fmt(totalIn)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-rose-500 uppercase tracking-wider">Total Out</p>
            <p className="text-sm font-bold text-rose-600 tabular-nums">{currencySymbol} {fmt(totalOut)}</p>
          </div>
          <div className={`text-right px-3 py-1.5 rounded-lg ${closing >= 0 ? 'bg-emerald-100' : 'bg-rose-100'}`}>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Closing</p>
            <p className={`text-sm font-bold tabular-nums ${closing >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {closing < 0 ? '-' : ''}{currencySymbol} {fmt(closing)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-24">Date</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-28">Voucher No</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">Particular</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 hidden md:table-cell">Narration</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-600 w-28">In (CR)</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-rose-500 w-28">Out (DR)</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-stone-500 w-32">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            <tr className={`${style.openingBg} ${style.openingBorder}`}>
              <td className="px-4 py-3" colSpan={4}>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                  Opening Balance
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
              <td className={`px-4 py-3 text-right font-bold tabular-nums text-sm ${style.text}`}>
                {currencySymbol} {fmt(method.openingBalance)}
              </td>
            </tr>
            {withBalance.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-300 text-xs italic">No transactions yet.</td>
              </tr>
            ) : (
              withBalance.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-stone-500 whitespace-nowrap tabular-nums">{fmtDate(row.date)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{row.voucherNo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-700 font-medium">
                    {row.particular}
                    {row.particularType && (
                      <span className="ml-1 text-[10px] text-stone-400 uppercase font-semibold">({row.particularType})</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-400 italic hidden md:table-cell">{row.narration || '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-xs">
                    {row.type === 'receipt'
                      ? <span className="text-emerald-700">{currencySymbol} {fmt(row.amount)}</span>
                      : <span className="text-stone-200">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-xs">
                    {row.type === 'payment'
                      ? <span className="text-rose-600">{currencySymbol} {fmt(row.amount)}</span>
                      : <span className="text-stone-200">—</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-bold text-xs ${
                    row.balance > 0 ? 'text-emerald-700' : row.balance < 0 ? 'text-rose-600' : 'text-stone-300'
                  }`}>
                    {row.balance < 0 ? '-' : ''}{currencySymbol} {fmt(row.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {withBalance.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-stone-200 bg-stone-50">
                <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Closing Balance ({withBalance.length} entries)
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-700 tabular-nums text-xs">
                  {currencySymbol} {fmt(totalIn)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-rose-600 tabular-nums text-xs">
                  {currencySymbol} {fmt(totalOut)}
                </td>
                <td className={`px-4 py-2.5 text-right font-bold tabular-nums text-xs ${
                  closing > 0 ? 'text-emerald-700' : closing < 0 ? 'text-rose-600' : 'text-stone-300'
                }`}>
                  {closing < 0 ? '-' : ''}{currencySymbol} {fmt(closing)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const ReceivablesSection = ({ entries, openingReceivables, fromDate, toDate, currencySymbol }) => {
  const dateFiltered = (fromDate || toDate)
    ? entries.filter(r => {
        const d = new Date(r.date);
        if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
        if (toDate   && d > new Date(toDate   + 'T23:59:59')) return false;
        return true;
      })
    : entries;

  let runBal = openingReceivables;
  const withBalance = dateFiltered.map(r => {
    if (r.type === 'receipt') runBal += r.amount;
    else                      runBal -= r.amount;
    return { ...r, balance: Math.round(runBal * 100) / 100 };
  });

  const totalIn  = dateFiltered.filter(r => r.type === 'receipt').reduce((s, r) => s + r.amount, 0);
  const totalOut = dateFiltered.filter(r => r.type === 'payment').reduce((s, r) => s + r.amount, 0);
  const closing  = withBalance.length ? withBalance[withBalance.length - 1].balance : openingReceivables;

  return (
    <div className="border border-indigo-200 rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-3 bg-indigo-50">
        <div className="flex items-center gap-3">
          <Users className="w-4 h-4 text-indigo-500" />
          <div>
            <p className="font-bold text-base text-indigo-700">Total Receivables</p>
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold">Customer Ledger</p>
          </div>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-right">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Opening</p>
            <p className="text-sm font-bold text-stone-600 tabular-nums">{currencySymbol} {fmt(openingReceivables)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider">Received</p>
            <p className="text-sm font-bold text-emerald-700 tabular-nums">{currencySymbol} {fmt(totalIn)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-rose-500 uppercase tracking-wider">Paid Out</p>
            <p className="text-sm font-bold text-rose-600 tabular-nums">{currencySymbol} {fmt(totalOut)}</p>
          </div>
          <div className={`text-right px-3 py-1.5 rounded-lg ${closing >= 0 ? 'bg-indigo-100' : 'bg-rose-100'}`}>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider">Net Receivable</p>
            <p className={`text-sm font-bold tabular-nums ${closing >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
              {closing < 0 ? '-' : ''}{currencySymbol} {fmt(closing)}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-24">Date</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-28">Voucher No</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">Customer</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 hidden md:table-cell">Narration</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-600 w-28">Received (CR)</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-rose-500 w-28">Paid Out (DR)</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-stone-500 w-32">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            <tr className="bg-indigo-50 border-b border-indigo-100">
              <td className="px-4 py-3" colSpan={4}>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Opening Receivables
                </span>
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right font-bold tabular-nums text-sm text-indigo-700">
                {currencySymbol} {fmt(openingReceivables)}
              </td>
            </tr>
            {withBalance.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-300 text-xs italic">No customer transactions yet.</td>
              </tr>
            ) : (
              withBalance.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                  <td className="px-4 py-2.5 text-xs text-stone-500 whitespace-nowrap tabular-nums">{fmtDate(row.date)}</td>
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">{row.voucherNo}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-700 font-medium">{row.particular}</td>
                  <td className="px-4 py-2.5 text-xs text-stone-400 italic hidden md:table-cell">{row.narration || '—'}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-xs">
                    {row.type === 'receipt'
                      ? <span className="text-emerald-700">{currencySymbol} {fmt(row.amount)}</span>
                      : <span className="text-stone-200">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-xs">
                    {row.type === 'payment'
                      ? <span className="text-rose-600">{currencySymbol} {fmt(row.amount)}</span>
                      : <span className="text-stone-200">—</span>}
                  </td>
                  <td className={`px-4 py-2.5 text-right tabular-nums font-bold text-xs ${
                    row.balance > 0 ? 'text-indigo-700' : row.balance < 0 ? 'text-rose-600' : 'text-stone-300'
                  }`}>
                    {row.balance < 0 ? '-' : ''}{currencySymbol} {fmt(row.balance)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {withBalance.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-indigo-200 bg-indigo-50/40">
                <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Net Receivable ({withBalance.length} entries)
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-700 tabular-nums text-xs">
                  {currencySymbol} {fmt(totalIn)}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-rose-600 tabular-nums text-xs">
                  {currencySymbol} {fmt(totalOut)}
                </td>
                <td className={`px-4 py-2.5 text-right font-bold tabular-nums text-xs ${
                  closing > 0 ? 'text-indigo-700' : closing < 0 ? 'text-rose-600' : 'text-stone-300'
                }`}>
                  {closing < 0 ? '-' : ''}{currencySymbol} {fmt(closing)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

const MoneyLedgerPage = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useAuth();
  const [data,             setData]            = useState([]);
  const [balance,          setBalance]         = useState(null);
  const [receivables,      setReceivables]     = useState(null);
  const [loading,          setLoading]         = useState(true);
  const [error,            setError]           = useState('');
  const [fromDate,         setFromDate]        = useState('');
  const [toDate,           setToDate]          = useState('');
  const [filterCat,        setFilterCat]       = useState('ALL');
  const [selectedMethodId, setSelectedMethodId] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, bal, recRes] = await Promise.all([
        fetch(`${API_URL}/api/vouchers/money-ledger`, { headers: authHeaders() }),
        getDashboardBalance().catch(() => null),
        fetch(`${API_URL}/api/vouchers/receivables-ledger`, { headers: authHeaders() }),
      ]);
      const json    = await res.json();
      const recJson = await recRes.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setData(json);
      setBalance(bal);
      setReceivables(recRes.ok ? recJson : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // When category filter changes, reset method selection if it no longer belongs
  const handleCatFilter = (cat) => {
    setFilterCat(cat);
    if (selectedMethodId) {
      const method = data.find(d => String(d.method.id) === selectedMethodId);
      if (method && cat !== 'ALL' && method.method.category !== cat) setSelectedMethodId('');
    }
  };

  const categoryFiltered = filterCat === 'ALL' ? data : data.filter(d => d.method.category === filterCat);
  const hasReceivables   = !!(balance && receivables);

  const selectedData     = (selectedMethodId && selectedMethodId !== 'receivables')
    ? categoryFiltered.find(d => String(d.method.id) === selectedMethodId)
    : null;

  const downloadExcel = () => {
    const wb = XLSX.utils.book_new();

    if (selectedMethodId === 'receivables' && receivables) {
      // --- Receivables sheet ---
      const opening = balance?.openingReceivables || 0;
      const rows = [
        ['Total Receivables Ledger'],
        fromDate || toDate ? [`Period: ${fromDate || '—'} to ${toDate || '—'}`] : [],
        [],
        ['Date', 'Voucher No', 'Particular', 'Narration', 'In (CR)', 'Out (DR)', 'Balance'],
        ['Opening Balance', '', '', '', '', '', fmt(opening)],
      ];
      let runBal = opening;
      const filtered = receivables.entries.filter(e => {
        if (fromDate && e.date < fromDate) return false;
        if (toDate   && e.date > toDate)   return false;
        return true;
      });
      filtered.forEach(e => {
        const cr = e.type === 'receipt'  ? e.amount : 0;
        const dr = e.type === 'payment'  ? e.amount : 0;
        runBal += cr - dr;
        rows.push([fmtDate(e.date), e.voucherNo || '', e.particular || '', e.narration || '', cr || '', dr || '', runBal]);
      });
      rows.push([]);
      const totalCr = filtered.filter(e => e.type === 'receipt').reduce((s, e) => s + e.amount, 0);
      const totalDr = filtered.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
      rows.push(['Closing Balance', '', '', '', fmt(totalCr), fmt(totalDr), fmt(runBal)]);

      const ws = XLSX.utils.aoa_to_sheet(rows.filter(r => r.length > 0 || rows.indexOf(r) !== 1 || (fromDate || toDate)));
      ws['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Total Receivables');
    } else if (selectedData) {
      // --- Payment method sheet ---
      const { method, entries } = selectedData;
      const filtered = entries.filter(e => {
        if (fromDate && e.date < fromDate) return false;
        if (toDate   && e.date > toDate)   return false;
        return true;
      });
      const rows = [
        [`${method.name} Ledger`],
        [`Category: ${method.category}`],
        fromDate || toDate ? [`Period: ${fromDate || '—'} to ${toDate || '—'}`] : [],
        [],
        ['Date', 'Voucher No', 'Particular', 'Narration', 'In (CR)', 'Out (DR)', 'Balance'],
        ['Opening Balance', '', '', '', '', '', fmt(method.openingBalance)],
      ];
      let runBal = method.openingBalance;
      filtered.forEach(e => {
        const cr = e.type === 'receipt'  ? e.amount : 0;
        const dr = e.type === 'payment'  ? e.amount : 0;
        runBal += cr - dr;
        rows.push([fmtDate(e.date), e.voucherNo || '', e.particular || '', e.narration || '', cr || '', dr || '', runBal]);
      });
      rows.push([]);
      const totalCr = filtered.filter(e => e.type === 'receipt').reduce((s, e) => s + e.amount, 0);
      const totalDr = filtered.filter(e => e.type === 'payment').reduce((s, e) => s + e.amount, 0);
      rows.push(['Closing Balance', '', '', '', fmt(totalCr), fmt(totalDr), fmt(runBal)]);

      const ws = XLSX.utils.aoa_to_sheet(rows.filter(r => r.length > 0 || rows.indexOf(r) > 1));
      ws['!cols'] = [{ wch: 15 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(wb, ws, method.name.slice(0, 31));
    }

    XLSX.writeFile(wb, `money-ledger-${selectedMethodId === 'receivables' ? 'receivables' : selectedData?.method.name || 'export'}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const grandTotalIn  = data.reduce((s, d) => s + d.entries.filter(e => e.type === 'receipt').reduce((a, e) => a + e.amount, 0), 0);
  const grandTotalOut = data.reduce((s, d) => s + d.entries.filter(e => e.type === 'payment').reduce((a, e) => a + e.amount, 0), 0);
  const grandOpening  = data.reduce((s, d) => s + d.method.openingBalance, 0);
  const grandClosing  = grandOpening + grandTotalIn - grandTotalOut;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><Landmark className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Money Ledger</h1>
            <p className="text-sm text-stone-400 mt-0.5">Cash & Bank position — Receipt · Payment per method</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {selectedMethodId && (
            <button
              onClick={downloadExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Download Excel</span>
            </button>
          )}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary cards */}
      {!loading && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Total Opening</p>
            <p className="text-xl font-bold text-stone-700 tabular-nums">{currencySymbol} {fmt(grandOpening)}</p>
          </div>
          <div className="bg-white border border-emerald-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Total In</p>
            <p className="text-xl font-bold text-emerald-700 tabular-nums">{currencySymbol} {fmt(grandTotalIn)}</p>
          </div>
          <div className="bg-white border border-rose-100 rounded-xl p-4 shadow-sm">
            <p className="text-[10px] text-rose-500 uppercase tracking-wider mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Total Out</p>
            <p className="text-xl font-bold text-rose-600 tabular-nums">{currencySymbol} {fmt(grandTotalOut)}</p>
          </div>
          <div className={`bg-white rounded-xl p-4 shadow-sm border ${grandClosing >= 0 ? 'border-emerald-200' : 'border-rose-200'}`}>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Net Closing</p>
            <p className={`text-xl font-bold tabular-nums ${grandClosing >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {grandClosing < 0 ? '-' : ''}{currencySymbol} {fmt(grandClosing)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-stone-200 rounded-xl px-5 py-3.5 mb-5 shadow-sm flex items-center gap-4 flex-wrap">
        {/* Category filter */}
        <div className="flex items-center gap-1.5">
          {['ALL', 'CASH', 'BANK'].map(cat => (
            <button
              key={cat}
              onClick={() => handleCatFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterCat === cat
                  ? cat === 'CASH' ? 'bg-emerald-600 text-white'
                    : cat === 'BANK' ? 'bg-blue-600 text-white'
                    : 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <span className="h-5 w-px bg-stone-200" />

        {/* Date range */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">From</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-stone-400 bg-stone-50 cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-400">To</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-stone-400 bg-stone-50 cursor-pointer" />
        </div>
        {(fromDate || toDate) && (
          <button onClick={() => { setFromDate(''); setToDate(''); }}
            className="flex items-center gap-1 text-xs text-stone-400 hover:text-stone-600 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        )}

        {/* Payment method selector */}
        <div className="ml-auto">
          <MethodPicker
            categoryFiltered={categoryFiltered}
            selectedMethodId={selectedMethodId}
            setSelectedMethodId={setSelectedMethodId}
            hasReceivables={hasReceivables}
          />
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-24 flex items-center justify-center gap-2 text-stone-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> Loading money ledger…
        </div>
      ) : data.length === 0 && !hasReceivables ? (
        <div className="text-center py-24 bg-white border border-dashed border-stone-200 rounded-xl flex flex-col items-center gap-3 text-stone-400">
          <Landmark className="w-12 h-12 text-stone-200" />
          <p className="text-sm">No payment methods found for this branch.</p>
          <p className="text-xs text-stone-300">Add payment methods in Payment Method Master to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {selectedData ? (
            /* Specific method selected from dropdown */
            <MethodSection
              key={selectedData.method.id}
              data={selectedData}
              fromDate={fromDate}
              toDate={toDate}
              currencySymbol={currencySymbol}
            />
          ) : selectedMethodId === 'receivables' ? null : (
            /* No specific method — show all methods in current category */
            categoryFiltered.length > 0
              ? categoryFiltered.map(d => (
                  <MethodSection
                    key={d.method.id}
                    data={d}
                    fromDate={fromDate}
                    toDate={toDate}
                    currencySymbol={currencySymbol}
                  />
                ))
              : (
                <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-xl flex flex-col items-center gap-3 text-stone-400">
                  <Landmark className="w-12 h-12 text-stone-200" />
                  <p className="text-sm">No {filterCat !== 'ALL' ? filterCat.toLowerCase() : ''} payment methods found.</p>
                </div>
              )
          )}
          {selectedMethodId === 'receivables' && hasReceivables && (
            <ReceivablesSection
              entries={receivables.entries}
              openingReceivables={balance.openingReceivables || 0}
              fromDate={fromDate}
              toDate={toDate}
              currencySymbol={currencySymbol}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default MoneyLedgerPage;
