import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Truck, Search, X, ArrowLeft, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { getSuppliers, getSupplierLedger } from '../api/masters';
import SelectSearch from '../components/ui/SelectSearch';

const fmt = (n) =>
  (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SupplierLedgerPage = () => {
  const navigate = useNavigate();
  const [suppliers,        setSuppliers]        = useState([]);
  const [selectedId,       setSelectedId]       = useState('');
  const [ledgerData,       setLedgerData]       = useState(null);
  const [loading,          setLoading]          = useState(false);
  const [loadingList,      setLoadingList]      = useState(true);
  const [error,            setError]            = useState('');
  const [search,           setSearch]           = useState('');

  // Load supplier list on mount
  useEffect(() => {
    getSuppliers()
      .then(list => setSuppliers(list.map(s => ({ id: s.id, name: s.name }))))
      .catch(() => setError('Failed to load suppliers'))
      .finally(() => setLoadingList(false));
  }, []);

  const fetchLedger = useCallback((id) => {
    if (!id) { setLedgerData(null); return; }
    setLoading(true);
    setError('');
    getSupplierLedger(id)
      .then(setLedgerData)
      .catch(err => setError(err.message || 'Failed to load supplier ledger'))
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (id) => {
    setSelectedId(id);
    setSearch('');
    fetchLedger(id);
  };

  const handleRefresh = () => fetchLedger(selectedId);

  // Summary calculations
  const totalDebits  = ledgerData?.ledger?.reduce((s, t) => s + (t.type === 'DR' ? t.amount : 0), 0) || 0;
  const totalCredits = ledgerData?.ledger?.reduce((s, t) => s + (t.type === 'CR' ? t.amount : 0), 0) || 0;
  const closing      = ledgerData?.ledger?.length
    ? ledgerData.ledger[ledgerData.ledger.length - 1].balance
    : 0;

  // Filter ledger rows by search
  const filtered = search.trim()
    ? (ledgerData?.ledger || []).filter(r =>
        (r.note || '').toLowerCase().includes(search.toLowerCase()) ||
        (r.source || '').toLowerCase().includes(search.toLowerCase())
      )
    : (ledgerData?.ledger || []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-all cursor-pointer"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Supplier Ledger</h1>
          <p className="text-sm text-stone-400 mt-1">View transaction history & running balance for any supplier</p>
        </div>
        {selectedId && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
            className="ml-auto p-2.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Supplier selector */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 mb-6 shadow-sm">
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
          <Truck className="inline w-3.5 h-3.5 mr-1 -mt-0.5" />
          Select Supplier
        </label>
        {loadingList ? (
          <p className="text-sm text-stone-400">Loading suppliers…</p>
        ) : (
          <SelectSearch
            value={selectedId}
            onChange={handleSelect}
            options={suppliers}
            placeholder="Search and select a supplier…"
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!selectedId && !loading && (
        <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-xl text-stone-400 text-sm flex flex-col items-center justify-center gap-3">
          <Truck className="w-10 h-10 text-stone-300" />
          <span>Select a supplier above to view their ledger</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-stone-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
          <span>Loading ledger…</span>
        </div>
      )}

      {/* Ledger content */}
      {ledgerData && !loading && (
        <div className="space-y-6">
          {/* Supplier info header */}
          <div className="bg-white border border-stone-200 rounded-xl px-5 py-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold text-base flex-shrink-0">
              {ledgerData.supplier?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-stone-800 truncate">{ledgerData.supplier?.name}</p>
              <p className="text-xs text-stone-400 mt-0.5">
                {ledgerData.supplier?.phone && <span className="mr-3">{ledgerData.supplier.phone}</span>}
                {ledgerData.supplier?.email && <span>{ledgerData.supplier.email}</span>}
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Debits (Purchases)</p>
                <p className="text-2xl font-bold text-stone-800 mt-1 tabular-nums">₹{fmt(totalDebits)}</p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Credits (Payments)</p>
                <p className="text-2xl font-bold text-stone-800 mt-1 tabular-nums">₹{fmt(totalCredits)}</p>
              </div>
            </div>

            <div className={`bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow ${
              closing > 0 ? 'border-rose-200' : closing < 0 ? 'border-emerald-200' : 'border-stone-200'
            }`}>
              <div className={`p-3 rounded-lg ${
                closing > 0 ? 'bg-rose-50 text-rose-600' : closing < 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-stone-50 text-stone-400'
              }`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Closing Balance</p>
                <p className={`text-2xl font-bold mt-1 tabular-nums ${
                  closing > 0 ? 'text-rose-600' : closing < 0 ? 'text-emerald-600' : 'text-stone-300'
                }`}>
                  ₹{fmt(Math.abs(closing))}
                  {closing !== 0 && (
                    <span className="text-xs ml-1 font-medium">{closing > 0 ? 'Payable' : 'Advance'}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Search within ledger */}
          {ledgerData.ledger.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by note or source…"
                  className="pl-9 pr-8 py-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300 w-full"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {search && (
                <p className="text-xs text-stone-400">
                  {filtered.length} of {ledgerData.ledger.length} entries
                </p>
              )}
            </div>
          )}

          {/* Ledger Table */}
          <div className="border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-28">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Note / Narration</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-28">Source</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-32">Debit (DR)</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-32">Credit (CR)</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-36">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-stone-300 text-sm italic">
                      {ledgerData.ledger.length === 0
                        ? 'No transactions recorded for this supplier.'
                        : `No entries match "${search}"`}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={row.id ?? i} className="hover:bg-stone-50/50 transition-colors">
                      <td className="px-4 py-3 text-stone-600 tabular-nums text-xs">
                        {new Date(row.date).toLocaleDateString('en-GB')}
                      </td>
                      <td className="px-4 py-3 text-stone-700">
                        {row.note || <span className="text-stone-300 italic">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          row.source === 'opening_balance' ? 'bg-blue-50 text-blue-700' :
                          row.source === 'manual'          ? 'bg-stone-100 text-stone-500' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {row.source === 'opening_balance' ? 'Opening' : row.source || 'Manual'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-rose-600 tabular-nums">
                        {row.type === 'DR' ? `₹${fmt(row.amount)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-emerald-600 tabular-nums">
                        {row.type === 'CR' ? `₹${fmt(row.amount)}` : '—'}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${
                        row.balance > 0 ? 'text-rose-700' : row.balance < 0 ? 'text-emerald-700' : 'text-stone-300'
                      }`}>
                        ₹{fmt(Math.abs(row.balance))}
                        <span className="text-[10px] font-medium ml-1">
                          {row.balance > 0 ? 'Dr' : row.balance < 0 ? 'Cr' : ''}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-stone-50 border-t border-stone-200">
                    <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 tabular-nums">
                      ₹{fmt(filtered.reduce((s, r) => s + (r.type === 'DR' ? r.amount : 0), 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">
                      ₹{fmt(filtered.reduce((s, r) => s + (r.type === 'CR' ? r.amount : 0), 0))}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierLedgerPage;
