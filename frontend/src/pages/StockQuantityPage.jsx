import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Warehouse, Search, X, Package, ChevronRight } from 'lucide-react';
import { getWarehouses } from '../api/masters';
import { getStockQtyByWarehouse } from '../api/vouchers';

const StockQuantityPage = () => {
  const navigate = useNavigate();
  const [warehouses,        setWarehouses]        = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [rows,              setRows]              = useState([]);
  const [search,            setSearch]            = useState('');
  const [loading,           setLoading]           = useState(false);
  const [error,             setError]             = useState('');

  useEffect(() => {
    getWarehouses()
      .then(setWarehouses)
      .catch(() => setError('Failed to load warehouses'));
  }, []);

  const fetchStock = useCallback((warehouseId) => {
    if (!warehouseId) return;
    setLoading(true);
    setError('');
    getStockQtyByWarehouse(warehouseId)
      .then(setRows)
      .catch(() => setError('Failed to load stock data'))
      .finally(() => setLoading(false));
  }, []);

  const handleWarehouseChange = (e) => {
    const id = e.target.value;
    setSelectedWarehouse(id);
    setRows([]);
    setSearch('');
    fetchStock(id);
  };

  const handleRefresh = () => fetchStock(selectedWarehouse);

  const selectedName = warehouses.find(w => String(w.id) === String(selectedWarehouse))?.name || '';

  const filtered = search.trim()
    ? rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
    : rows;

  const totalQty    = filtered.reduce((s, r) => s + r.qty, 0);
  const totalAmount = filtered.reduce((s, r) => s + (r.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-rs-text-primary/10 rounded-xl">
            <Package className="w-5 h-5 text-rs-text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-rs-text-primary font-user-serif tracking-tight">Stock Ledger</h1>
        </div>
        <p className="text-sm text-rs-text-muted ml-11">Select a warehouse to view current stock levels. Click any product to see its full ledger.</p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rs-text-muted pointer-events-none" />
          <select
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-rs-text-primary focus:outline-none focus:ring-2 focus:ring-rs-text-primary/20 focus:border-rs-text-primary appearance-none cursor-pointer transition-all"
          >
            <option value="">Select warehouse…</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {selectedWarehouse && (
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rs-text-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product…"
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-stone-200 rounded-xl bg-white text-rs-text-primary placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rs-text-primary/20 focus:border-rs-text-primary transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-300 hover:text-stone-500 transition-colors cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {selectedWarehouse && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
            className="p-2.5 rounded-xl border border-stone-200 bg-white text-rs-text-muted hover:text-rs-text-primary hover:border-rs-text-primary/30 transition-all disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
      )}

      {/* Content */}
      {!selectedWarehouse ? (
        <div className="text-center py-24 border border-dashed border-stone-200 rounded-2xl bg-white flex flex-col items-center gap-3">
          <Warehouse className="w-10 h-10 text-stone-200" />
          <p className="text-sm text-stone-400">Select a warehouse above to view stock</p>
        </div>
      ) : loading ? (
        <div className="text-center py-24 flex items-center justify-center gap-2 text-rs-text-muted text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : (
        <>
          {/* Sub-header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted bg-rs-cream/60 px-2.5 py-1 rounded-lg border border-rs-accent-bg">
                {selectedName}
              </span>
              {search && (
                <span className="text-xs text-stone-400">{filtered.length} of {rows.length} products</span>
              )}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">
              Click row to view ledger
            </span>
          </div>

          <div className="border border-stone-100 rounded-2xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-10">#</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Product Name</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Quantity</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Unit</th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Amount</th>
                  <th className="px-4 py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-stone-300 text-sm">
                      {search ? `No products match "${search}"` : 'No products found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/dashboard/other/product-info?productId=${row.id}&warehouseId=${selectedWarehouse}`)}
                      className="hover:bg-rs-cream/20 active:bg-rs-cream/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 text-stone-400 text-xs font-bold">{i + 1}</td>
                      <td className="px-4 py-3.5 text-rs-text-primary font-semibold group-hover:text-rs-text-primary">{row.name}</td>
                      <td className="px-4 py-3.5 text-right font-bold tabular-nums">
                        <span className={row.qty === 0 ? 'text-stone-300' : row.qty < 0 ? 'text-red-500' : 'text-rs-text-primary'}>
                          {row.qty}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-rs-text-muted text-xs">{row.unit}</td>
                      <td className="px-4 py-3.5 text-right tabular-nums text-rs-text-primary font-semibold">
                        {(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-3 py-3.5 text-stone-300 group-hover:text-rs-text-primary transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-rs-cream/30 border-t border-stone-100">
                    <td colSpan={2} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Total</td>
                    <td className="px-4 py-3 text-right font-bold text-rs-text-primary tabular-nums">{totalQty}</td>
                    <td className="px-4 py-3" />
                    <td className="px-4 py-3 text-right font-bold text-rs-text-primary tabular-nums">
                      {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default StockQuantityPage;
