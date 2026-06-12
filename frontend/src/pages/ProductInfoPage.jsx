import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ClipboardList, TrendingUp, TrendingDown, Package, X, Download } from 'lucide-react';
import { getWarehouses, getProducts } from '../api/masters';
import { getProductLedger } from '../api/vouchers';
import SelectSearch from '../components/ui/SelectSearch';
import { exportStockLedger } from '../utils/exportLedger';

const ProductInfoPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryWarehouseId = searchParams.get('warehouseId') || '';
  const queryProductId   = searchParams.get('productId')   || '';

  const [warehouses,         setWarehouses]        = useState([]);
  const [products,           setProducts]          = useState([]);
  const [selectedWarehouse,  setSelectedWarehouse] = useState(queryWarehouseId);
  const [selectedProduct,    setSelectedProduct]   = useState(queryProductId);
  const [ledgerData,         setLedgerData]        = useState(null);
  const [loading,            setLoading]           = useState(false);
  const [error,              setError]             = useState('');
  const [fromDate,           setFromDate]          = useState('');
  const [toDate,             setToDate]            = useState('');

  useEffect(() => { setSelectedWarehouse(queryWarehouseId); }, [queryWarehouseId]);
  useEffect(() => { setSelectedProduct(queryProductId); },   [queryProductId]);

  useEffect(() => {
    let active = true;
    Promise.all([getWarehouses(), getProducts()])
      .then(([whs, prods]) => { if (active) { setWarehouses(whs); setProducts(prods); } })
      .catch(() => { if (active) setError('Failed to load warehouses/products'); });
    return () => { active = false; };
  }, []);

  const fetchLedger = useCallback((wId, pId) => {
    if (!wId || !pId) { setLedgerData(null); return; }
    setLoading(true);
    setError('');
    setFromDate('');
    setToDate('');
    getProductLedger(pId, wId)
      .then(setLedgerData)
      .catch(err => { setError(err.message || 'Failed to load product ledger'); setLedgerData(null); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLedger(selectedWarehouse, selectedProduct); }, [selectedWarehouse, selectedProduct, fetchLedger]);

  const handleWarehouseChange = (id) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); id ? n.set('warehouseId', id) : n.delete('warehouseId'); return n; });
  };
  const handleProductChange = (id) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); id ? n.set('productId', id) : n.delete('productId'); return n; });
  };

  const allLedgerRows = ledgerData?.ledger || [];
  const periodRows = (fromDate || toDate)
    ? allLedgerRows.filter(r => {
        const d = new Date(r.date);
        if (fromDate && d < new Date(fromDate + 'T00:00:00')) return false;
        if (toDate   && d > new Date(toDate   + 'T23:59:59')) return false;
        return true;
      })
    : allLedgerRows;

  // Recompute running balance for the filtered period from zero
  let runBal = 0;
  const periodRowsWithBalance = periodRows.map(r => {
    runBal += (r.qtyIn || 0) - (r.qtyOut || 0);
    return { ...r, balance: runBal };
  });

  const totalQtyIn   = periodRowsWithBalance.reduce((a, r) => a + (r.qtyIn  || 0), 0);
  const totalQtyOut  = periodRowsWithBalance.reduce((a, r) => a + (r.qtyOut || 0), 0);
  const finalBalance = periodRowsWithBalance.length > 0 ? periodRowsWithBalance[periodRowsWithBalance.length - 1].balance : 0;

  const typeBadge = (type) => {
    const map = {
      'Purchase':      'bg-amber-50 text-amber-700 border-amber-200',
      'Sales':         'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Stock Data':    'bg-blue-50 text-blue-700 border-blue-200',
      'Transfer In':   'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Transfer Out':  'bg-purple-50 text-purple-700 border-purple-200',
      'Sales Return':  'bg-teal-50 text-teal-700 border-teal-200',
      'Purchase Return':'bg-orange-50 text-orange-700 border-orange-200',
    };
    return map[type] || 'bg-stone-50 text-stone-600 border-stone-200';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/dashboard/other/stock-quantity')}
          className="p-2 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all cursor-pointer"
          title="Back to Stock Ledger"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rs-text-primary/10 rounded-xl">
            <Package className="w-5 h-5 text-rs-text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-rs-text-primary font-user-serif tracking-tight">Stock Ledger</h1>
            <p className="text-sm text-rs-text-muted mt-0.5">Detailed inventory transactions per product</p>
          </div>
        </div>
        {selectedWarehouse && selectedProduct && (
          <div className="ml-auto flex items-center gap-2">
            {periodRowsWithBalance.length > 0 && (
              <button
                onClick={() => exportStockLedger({
                  product: ledgerData?.product,
                  warehouse: ledgerData?.warehouse,
                  periodRowsWithBalance,
                  fromDate,
                  toDate,
                  totalQtyIn,
                  totalQtyOut,
                  finalBalance,
                })}
                title="Download Excel"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm font-medium cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Excel
              </button>
            )}
            <button
              onClick={() => fetchLedger(selectedWarehouse, selectedProduct)}
              disabled={loading}
              title="Refresh"
              className="p-2.5 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all disabled:opacity-40 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-white border border-stone-100 rounded-2xl p-5 mb-6 shadow-sm">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-rs-text-muted mb-2">Warehouse</label>
          <SelectSearch value={selectedWarehouse} onChange={handleWarehouseChange} options={warehouses} placeholder="Select Warehouse…" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-rs-text-muted mb-2">Product</label>
          <SelectSearch value={selectedProduct} onChange={handleProductChange} options={products} placeholder="Select Product…" />
        </div>
      </div>

      {/* Date Filter */}
      {selectedWarehouse && selectedProduct && (
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
                {periodRowsWithBalance.length} of {allLedgerRows.length} entries in period
              </span>
            </>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* Empty / loading states */}
      {!selectedWarehouse || !selectedProduct ? (
        <div className="text-center py-24 bg-white border border-dashed border-stone-200 rounded-2xl text-stone-400 text-sm flex flex-col items-center gap-3">
          <ClipboardList className="w-10 h-10 text-stone-200" />
          <span>Select both warehouse and product to view the ledger</span>
        </div>
      ) : loading ? (
        <div className="text-center py-24 flex items-center justify-center gap-2 text-rs-text-muted text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : ledgerData ? (
        <div className="space-y-5">

          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Total In</p>
                <p className="text-2xl font-bold text-rs-text-primary mt-0.5 tabular-nums">
                  {totalQtyIn.toLocaleString()} <span className="text-xs text-rs-text-muted font-medium">{ledgerData.product.unit}</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-red-50 rounded-xl">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Total Out</p>
                <p className="text-2xl font-bold text-rs-text-primary mt-0.5 tabular-nums">
                  {totalQtyOut.toLocaleString()} <span className="text-xs text-rs-text-muted font-medium">{ledgerData.product.unit}</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-stone-100 rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-rs-text-primary/10 rounded-xl">
                <Package className="w-5 h-5 text-rs-text-primary" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Closing Balance</p>
                <p className={`text-2xl font-bold mt-0.5 tabular-nums ${finalBalance === 0 ? 'text-stone-300' : finalBalance < 0 ? 'text-red-500' : 'text-rs-text-primary'}`}>
                  {finalBalance.toLocaleString()} <span className="text-xs text-rs-text-muted font-medium">{ledgerData.product.unit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ledger table */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted bg-rs-cream/60 px-2.5 py-1 rounded-lg border border-rs-accent-bg">
                  {ledgerData.warehouse.name}
                </span>
                <span className="text-stone-300 text-xs">|</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-rs-text-primary bg-rs-text-primary/10 px-2.5 py-1 rounded-lg">
                  {ledgerData.product.name}
                </span>
              </div>
              <p className="text-xs text-rs-text-muted">
                {(fromDate || toDate) ? `${periodRowsWithBalance.length} of ${allLedgerRows.length}` : allLedgerRows.length} transactions
              </p>
            </div>

            <div className="border border-stone-100 rounded-2xl bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-rs-cream/30 border-b border-stone-100">
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-24">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-32">Voucher No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-32">Type</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Party / Narration</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-20">In</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-20">Out</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-24">Rate</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-28">Amount</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-24">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {periodRowsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-16 text-center text-stone-300 text-sm italic">
                        {(fromDate || toDate) ? 'No transactions found in the selected date range.' : 'No transactions found for this product in the selected warehouse.'}
                      </td>
                    </tr>
                  ) : (
                    periodRowsWithBalance.map((row) => (
                      <tr key={row.id} className="hover:bg-rs-cream/10 transition-colors">
                        <td className="px-4 py-3 text-rs-text-muted tabular-nums text-xs">
                          {new Date(row.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-rs-text-primary font-mono text-xs">{row.voucherNo}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${typeBadge(row.type)}`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-rs-text-muted truncate max-w-[180px] text-xs" title={row.party}>
                          {row.party || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-600 tabular-nums">
                          {row.qtyIn > 0 ? `+${row.qtyIn}` : <span className="text-stone-200">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-red-500 tabular-nums">
                          {row.qtyOut > 0 ? `-${row.qtyOut}` : <span className="text-stone-200">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right text-rs-text-muted tabular-nums text-xs">
                          {row.rate > 0 ? row.rate.toFixed(2) : <span className="text-stone-200">—</span>}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-rs-text-primary tabular-nums">
                          {row.amount > 0 ? row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : <span className="text-stone-200">—</span>}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold tabular-nums ${row.balance < 0 ? 'text-red-500' : row.balance === 0 ? 'text-stone-300' : 'text-rs-text-primary'}`}>
                          {row.balance.toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductInfoPage;
