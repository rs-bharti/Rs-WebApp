import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Warehouse, Search, X } from 'lucide-react';
import { getWarehouses } from '../api/masters';
import { getStockQtyByWarehouse } from '../api/vouchers';

const StockQuantityPage = () => {
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Stock Quantity Ledger</h1>
        <p className="text-sm text-stone-400 mt-1">Current stock levels per warehouse</p>
      </div>

      {/* Filter row */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
          <select
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300 appearance-none cursor-pointer"
          >
            <option value="">Select warehouse…</option>
            {warehouses.map(w => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>

        {selectedWarehouse && (
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search product…"
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-300"
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
        )}

        {selectedWarehouse && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
            className="p-2.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      {!selectedWarehouse ? (
        <div className="text-center py-20 text-stone-300 text-sm">
          Select a warehouse to view stock quantities
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-stone-400 text-sm">Loading…</div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            {selectedName && (
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-400">
                {selectedName}
              </p>
            )}
            {search && (
              <p className="text-xs text-stone-400 ml-auto">
                {filtered.length} of {rows.length} products
              </p>
            )}
          </div>
          <div className="border border-stone-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-10">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Product Name</th>
                  <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider">Quantity</th>
                  <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-stone-300 text-sm">
                      {search ? `No products match "${search}"` : 'No products found'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, i) => (
                    <tr key={row.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-4 py-3 text-stone-400">{i + 1}</td>
                      <td className="px-4 py-3 text-stone-700 font-medium">{row.name}</td>
                      <td className={`px-4 py-3 text-right font-semibold tabular-nums ${row.qty === 0 ? 'text-stone-300' : 'text-stone-800'}`}>
                        {row.qty}
                      </td>
                      <td className="px-4 py-3 text-stone-400">{row.unit}</td>
                    </tr>
                  ))
                )}
              </tbody>
              {filtered.length > 0 && (
                <tfoot>
                  <tr className="bg-stone-50 border-t border-stone-200">
                    <td colSpan={2} className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-stone-800 tabular-nums">
                      {filtered.reduce((s, r) => s + r.qty, 0)}
                    </td>
                    <td className="px-4 py-3" />
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
