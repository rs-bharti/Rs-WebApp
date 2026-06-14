import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Landmark, TrendingUp, TrendingDown, X, Search, Users } from 'lucide-react';
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
  CASH: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' },
  BANK: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500'    },
};

const MethodSection = ({ data, fromDate, toDate, search, currencySymbol }) => {
  const { method, entries } = data;
  const style = CATEGORY_STYLE[method.category] || { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-200', dot: 'bg-stone-400' };

  // Date filter
  const dateFiltered = (fromDate || toDate)
    ? entries.filter(r => {
        const d = new Date(r.date);
        if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
        if (toDate   && d > new Date(toDate   + 'T23:59:59')) return false;
        return true;
      })
    : entries;

  // Compute running balance starting from opening
  let runBal = method.openingBalance;
  const withBalance = dateFiltered.map(r => {
    if (r.type === 'receipt') runBal += r.amount;
    else                      runBal -= r.amount;
    return { ...r, balance: Math.round(runBal * 100) / 100 };
  });

  // Search filter
  const filtered = search.trim()
    ? withBalance.filter(r =>
        (r.voucherNo || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.particular || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.narration  || '').toLowerCase().includes(search.toLowerCase())
      )
    : withBalance;

  const closing     = withBalance.length ? withBalance[withBalance.length - 1].balance : method.openingBalance;
  const totalIn     = dateFiltered.filter(r => r.type === 'receipt').reduce((s, r) => s + r.amount, 0);
  const totalOut    = dateFiltered.filter(r => r.type === 'payment').reduce((s, r) => s + r.amount, 0);

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm ${style.border}`}>
      {/* Method header */}
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

      {/* Table */}
      <div className="bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-24">Date</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400 w-28">Voucher No</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">Particular</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-wider text-stone-400">Narration</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-emerald-600 w-28">In (CR)</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-rose-500 w-28">Out (DR)</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-bold uppercase tracking-wider text-stone-500 w-32">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {/* Opening row */}
            <tr className="bg-blue-50/40">
              <td className="px-4 py-2.5 text-xs text-stone-400" colSpan={4}>
                <span className="font-semibold text-blue-700">Opening Balance</span>
              </td>
              <td className="px-4 py-2.5" />
              <td className="px-4 py-2.5" />
              <td className="px-4 py-2.5 text-right font-bold tabular-nums text-blue-700 text-xs">
                {currencySymbol} {fmt(method.openingBalance)}
              </td>
            </tr>

            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-stone-300 text-xs italic">
                  {dateFiltered.length === 0 ? 'No transactions yet.' : `No entries match "${search}"`}
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
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
                  <td className="px-4 py-2.5 text-xs text-stone-400 italic">{row.narration || '—'}</td>
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
          {filtered.length > 0 && (
            <tfoot>
              <tr className="border-t-2 border-stone-200 bg-stone-50">
                <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-stone-500 uppercase tracking-wider">
                  Closing Balance ({filtered.length} entries)
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-emerald-700 tabular-nums text-xs">
                  {currencySymbol} {fmt(dateFiltered.filter(r => r.type === 'receipt').reduce((s, r) => s + r.amount, 0))}
                </td>
                <td className="px-4 py-2.5 text-right font-bold text-rose-600 tabular-nums text-xs">
                  {currencySymbol} {fmt(dateFiltered.filter(r => r.type === 'payment').reduce((s, r) => s + r.amount, 0))}
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

const MoneyLedgerPage = () => {
  const navigate = useNavigate();
  const { currencySymbol } = useAuth();
  const [data,      setData]      = useState([]);
  const [balance,   setBalance]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [search,    setSearch]    = useState('');
  const [filterCat, setFilterCat] = useState('ALL'); // ALL | CASH | BANK

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, bal] = await Promise.all([
        fetch(`${API_URL}/api/vouchers/money-ledger`, { headers: authHeaders() }),
        getDashboardBalance().catch(() => null),
      ]);
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to load');
      setData(json);
      setBalance(bal);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const displayed = filterCat === 'ALL' ? data : data.filter(d => d.method.category === filterCat);

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
        <div className="ml-auto">
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

      {/* Total Receivables */}
      {!loading && balance && (
        <div className="bg-white border border-indigo-100 rounded-xl p-5 shadow-sm mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-indigo-500" />
            <p className="text-sm font-semibold text-stone-700 uppercase tracking-wider">Total Receivables</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Opening Receivables</p>
              <p className="text-lg font-bold text-stone-700 tabular-nums">{currencySymbol} {fmt(balance.openingReceivables)}</p>
            </div>
            <div>
              {(() => {
                const change = (balance.totalReceivables || 0) - (balance.openingReceivables || 0);
                return (
                  <>
                    <p className={`text-[10px] uppercase tracking-wider mb-1 flex items-center gap-1 ${change >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} Net Change
                    </p>
                    <p className={`text-lg font-bold tabular-nums ${change >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                      {change < 0 ? '-' : '+'}{currencySymbol} {fmt(change)}
                    </p>
                  </>
                );
              })()}
            </div>
            <div className={`col-span-2 md:col-span-1 rounded-lg p-3 ${(balance.totalReceivables || 0) >= 0 ? 'bg-indigo-50' : 'bg-rose-50'}`}>
              <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Net Receivables</p>
              <p className={`text-xl font-bold tabular-nums ${(balance.totalReceivables || 0) >= 0 ? 'text-indigo-700' : 'text-rose-700'}`}>
                {(balance.totalReceivables || 0) < 0 ? '-' : ''}{currencySymbol} {fmt(balance.totalReceivables)}
              </p>
            </div>
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
              onClick={() => setFilterCat(cat)}
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

        {/* Search */}
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search particular, voucher…"
            className="pl-8 pr-8 py-1.5 text-sm border border-stone-200 rounded-lg outline-none focus:border-stone-400 bg-stone-50 w-56"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-24 flex items-center justify-center gap-2 text-stone-400 text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-500" /> Loading money ledger…
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-24 bg-white border border-dashed border-stone-200 rounded-xl flex flex-col items-center gap-3 text-stone-400">
          <Landmark className="w-12 h-12 text-stone-200" />
          <p className="text-sm">No payment methods found for this branch.</p>
          <p className="text-xs text-stone-300">Add payment methods in Payment Method Master to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {displayed.map(d => (
            <MethodSection
              key={d.method.id}
              data={d}
              fromDate={fromDate}
              toDate={toDate}
              search={search}
              currencySymbol={currencySymbol}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MoneyLedgerPage;
