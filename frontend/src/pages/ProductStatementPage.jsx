import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, ClipboardList, TrendingUp, TrendingDown, Package, Warehouse, Calendar, ArrowRightLeft } from 'lucide-react';
import { getWarehouses, getProducts } from '../api/masters';
import { getProductLedger } from '../api/vouchers';
import SelectSearch from '../components/ui/SelectSearch';

const ProductStatementPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryWarehouseId = searchParams.get('warehouseId') || '';
  const queryProductId = searchParams.get('productId') || '';

  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  
  const [selectedWarehouse, setSelectedWarehouse] = useState(queryWarehouseId);
  const [selectedProduct, setSelectedProduct] = useState(queryProductId);

  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Synchronize URL query parameters with local state
  useEffect(() => {
    setSelectedWarehouse(queryWarehouseId);
  }, [queryWarehouseId]);

  useEffect(() => {
    setSelectedProduct(queryProductId);
  }, [queryProductId]);

  // Load masters on mount
  useEffect(() => {
    let active = true;
    Promise.all([getWarehouses(), getProducts()])
      .then(([whs, prods]) => {
        if (!active) return;
        setWarehouses(whs);
        setProducts(prods);
      })
      .catch(() => {
        if (active) setError('Failed to load warehouses/products master data');
      });
    return () => { active = false; };
  }, []);

  // Fetch product ledger when both selections are available
  const fetchLedger = useCallback((wId, pId) => {
    if (!wId || !pId) {
      setLedgerData(null);
      return;
    }
    setLoading(true);
    setError('');
    getProductLedger(pId, wId)
      .then(data => {
        setLedgerData(data);
      })
      .catch(err => {
        setError(err.message || 'Failed to load product ledger');
        setLedgerData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchLedger(selectedWarehouse, selectedProduct);
  }, [selectedWarehouse, selectedProduct, fetchLedger]);

  const handleWarehouseChange = (id) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id) next.set('warehouseId', id);
      else next.delete('warehouseId');
      return next;
    });
  };

  const handleProductChange = (id) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id) next.set('productId', id);
      else next.delete('productId');
      return next;
    });
  };

  const handleRefresh = () => {
    fetchLedger(selectedWarehouse, selectedProduct);
  };

  // Calculations for summary cards
  const totalQtyIn = ledgerData?.ledger?.reduce((acc, curr) => acc + (curr.qtyIn || 0), 0) || 0;
  const totalQtyOut = ledgerData?.ledger?.reduce((acc, curr) => acc + (curr.qtyOut || 0), 0) || 0;
  const finalBalance = ledgerData?.ledger?.length > 0 
    ? ledgerData.ledger[ledgerData.ledger.length - 1].balance 
    : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      {/* Back button and title header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/other/stock-quantity')}
          className="p-2 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-all cursor-pointer"
          title="Back to Stock Quantity"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-stone-800 tracking-tight">Product Statement Ledger</h1>
          <p className="text-sm text-stone-400 mt-1">Detailed inventory transactions list</p>
        </div>

        {selectedWarehouse && selectedProduct && (
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh Ledger"
            className="p-2.5 rounded-lg border border-stone-200 bg-white text-stone-500 hover:text-stone-800 hover:border-stone-300 transition-colors disabled:opacity-40 cursor-pointer ml-auto"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Select Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white border border-stone-200 rounded-xl p-5 mb-6 shadow-sm">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Warehouse
          </label>
          <SelectSearch
            value={selectedWarehouse}
            onChange={handleWarehouseChange}
            options={warehouses}
            placeholder="Select Warehouse..."
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
            Product
          </label>
          <SelectSearch
            value={selectedProduct}
            onChange={handleProductChange}
            options={products}
            placeholder="Select Product..."
          />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Select instruction or loading state */}
      {!selectedWarehouse || !selectedProduct ? (
        <div className="text-center py-20 bg-white border border-dashed border-stone-200 rounded-xl text-stone-400 text-sm flex flex-col items-center justify-center gap-3">
          <ClipboardList className="w-10 h-10 text-stone-300" />
          <span>Select both warehouse and product to view the transaction ledger</span>
        </div>
      ) : loading ? (
        <div className="text-center py-20 text-stone-400 text-sm flex items-center justify-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
          <span>Loading ledger data...</span>
        </div>
      ) : ledgerData ? (
        <div className="space-y-6">
          {/* Info and stats cards container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-brand-primary/5 rounded-lg text-brand-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Additions / In</p>
                <p className="text-2xl font-bold text-stone-800 mt-1 tabular-nums">
                  {totalQtyIn.toLocaleString()} <span className="text-xs text-stone-400 font-medium">{ledgerData.product.unit}</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
                <TrendingDown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Deductions / Out</p>
                <p className="text-2xl font-bold text-stone-800 mt-1 tabular-nums">
                  {totalQtyOut.toLocaleString()} <span className="text-xs text-stone-400 font-medium">{ledgerData.product.unit}</span>
                </p>
              </div>
            </div>

            <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Closing Stock Balance</p>
                <p className={`text-2xl font-bold mt-1 tabular-nums ${finalBalance === 0 ? 'text-stone-300' : 'text-stone-800'}`}>
                  {finalBalance.toLocaleString()} <span className="text-xs text-stone-400 font-medium">{ledgerData.product.unit}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Ledger Table */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400 bg-stone-100 px-2 py-1 rounded">
                  {ledgerData.warehouse.name}
                </span>
                <span className="text-stone-300 text-xs">|</span>
                <span className="text-xs font-bold uppercase tracking-widest text-brand-primary bg-brand-primary/5 px-2 py-1 rounded">
                  {ledgerData.product.name}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                {ledgerData.ledger.length} transactions recorded
              </p>
            </div>
            
            <div className="border border-stone-200 rounded-xl bg-white overflow-hidden shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200">
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-24">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-36">Voucher No</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider w-32">Type</th>
                    <th className="px-4 py-3 text-left font-semibold text-stone-500 text-xs uppercase tracking-wider">Party / Narration</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-24">Qty In</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-24">Qty Out</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-28">Rate</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-32">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-stone-500 text-xs uppercase tracking-wider w-28">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {ledgerData.ledger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-stone-300 text-sm italic">
                        No transactions found for this product in the selected warehouse.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.ledger.map((row) => (
                      <tr key={row.id} className="hover:bg-stone-50/50 transition-colors">
                        <td className="px-4 py-3 text-stone-600 tabular-nums">
                          {new Date(row.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="px-4 py-3 text-stone-700 font-mono text-xs">{row.voucherNo}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider ${
                            row.type === 'Purchase' ? 'bg-amber-50 text-amber-800' :
                            row.type === 'Sales' ? 'bg-emerald-50 text-emerald-800' :
                            row.type === 'Stock Data' ? 'bg-blue-50 text-blue-800' :
                            row.type === 'Transfer In' ? 'bg-indigo-50 text-indigo-800' :
                            row.type === 'Transfer Out' ? 'bg-purple-50 text-purple-800' :
                            row.type === 'Sales Return' ? 'bg-teal-50 text-teal-800' :
                            'bg-red-50 text-red-800'
                          }`}>
                            {row.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-stone-600 truncate max-w-[200px]" title={row.party}>
                          {row.party}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-emerald-600 tabular-nums">
                          {row.qtyIn > 0 ? `+${row.qtyIn}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-rose-600 tabular-nums">
                          {row.qtyOut > 0 ? `-${row.qtyOut}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-stone-500 tabular-nums">
                          {row.rate > 0 ? `₹${row.rate.toFixed(2)}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-stone-700 tabular-nums">
                          {row.amount > 0 ? `₹${row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-stone-800 tabular-nums">
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

export default ProductStatementPage;
