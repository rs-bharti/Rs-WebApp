import { useState, useEffect } from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
import SelectSearch from '../SelectSearch';
import { Link } from 'react-router-dom';
import { getProducts, getWarehouses } from '../../../api/masters';
import { getStockDataVoucherNextNo, saveStockDataVoucher, getStockQty } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';

const emptyRow = () => ({ id: Date.now() + Math.random(), productId: '', warehouseId: '', qty: 1, stockQty: null });

const StockDataVoucherForm = () => {
  const type = 'Stock Data';
  const { activeBranch } = useAuth();

  const [rows,      setRows]      = useState([emptyRow()]);
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [narration, setNarration] = useState('');
  const [products,  setProducts]  = useState([]);
  const [warehouses,setWarehouses]= useState([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');

  useEffect(() => {
    Promise.all([getProducts(), getWarehouses(), getStockDataVoucherNextNo()])
      .then(([prod, wh, vn]) => { setProducts(prod); setWarehouses(wh); setVoucherNo(vn.voucherNo); })
      .catch(err => setError(err?.message || 'Failed to load form data'));
  }, []);

  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id)); };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'productId' || field === 'warehouseId') updated.stockQty = null;
      return updated;
    }));
    if (field === 'productId' || field === 'warehouseId') {
      const currentRow = rows.find(r => r.id === id);
      if (!currentRow) return;
      const pId = field === 'productId' ? value : currentRow.productId;
      const wId = field === 'warehouseId' ? value : currentRow.warehouseId;
      if (pId && wId) {
        getStockQty(pId, wId)
          .then(data => setRows(curr => curr.map(r => r.id === id ? { ...r, stockQty: data.qty ?? 0 } : r)))
          .catch(() => setRows(curr => curr.map(r => r.id === id ? { ...r, stockQty: 0 } : r)));
      }
    }
  };

  const totalQty = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const validRows = rows.filter(r => r.productId && r.warehouseId && parseFloat(r.qty) > 0);
    if (!validRows.length) return setError('Please add at least one product with warehouse and quantity');
    const missingWh = rows.filter(r => r.productId && !r.warehouseId);
    if (missingWh.length) return setError('Please select a warehouse for each product row');
    setSaving(true);
    try {
      // Send first row's warehouseId at top level for backend compatibility,
      // and also per-item for backends that support it
      const voucher = await saveStockDataVoucher({
        date,
        warehouseId: parseInt(validRows[0].warehouseId),
        narration:   narration || undefined,
        branchId:    activeBranch?.id,
        items:       validRows.map(r => ({ productId: parseInt(r.productId), warehouseId: parseInt(r.warehouseId), qty: parseFloat(r.qty) })),
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved with ${validRows.length} item(s)`);
      setRows([emptyRow()]);
      setNarration('');
      const vn = await getStockDataVoucherNextNo();
      setVoucherNo(vn.voucherNo);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setRows([emptyRow()]); setNarration(''); setError(''); setSuccess('');
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-4 py-4 md:px-8 md:py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New {type} Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: {voucherNo || '…'}
        </span>
      </div>

      <form className="p-4 md:p-8 space-y-6 md:space-y-10" onSubmit={handleSubmit}>
        {error   && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

        {activeBranch && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Branch</span>
            <span className="text-sm font-semibold text-rs-text-primary">{activeBranch.name}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-md">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Date</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <input className="w-full bg-transparent text-sm font-medium outline-none" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Voucher No</label>
            <div className="relative border-b border-stone-100 pb-1">
              <input className="w-full bg-transparent text-sm font-bold text-rs-text-primary outline-none" readOnly value={voucherNo} />
            </div>
          </div>
        </div>

        {/* Product Table — warehouse per row */}
        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Stock Items</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-8">#</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name <Link to="/dashboard/master/product" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Product Master"><ExternalLink className="w-4 h-4" /></Link></th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-44">Warehouse <Link to="/dashboard/master/warehouse" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Warehouse Master"><ExternalLink className="w-4 h-4" /></Link></th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-28">Curr. Stock</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-44">Add Qty</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map((row, index) => (
                    <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">
                      <td className="px-4 py-3 text-rs-text-muted font-bold text-xs">{index + 1}</td>

                      {/* Product */}
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.productId}
                          onChange={v => updateRow(row.id, 'productId', v)}
                          options={products}
                          placeholder="Select Product"
                        />
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.warehouseId}
                          onChange={v => updateRow(row.id, 'warehouseId', v)}
                          options={warehouses}
                          placeholder="Select Warehouse"
                        />
                      </td>

                      {/* Curr. Stock */}
                      <td className="px-4 py-3 text-right">
                        {row.warehouseId && row.productId ? (
                          row.stockQty === null
                            ? <span className="text-[10px] text-stone-400">…</span>
                            : <span className={`font-bold text-sm ${row.stockQty <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>{row.stockQty}</span>
                        ) : <span className="text-stone-300">—</span>}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <input
                          className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none font-bold text-rs-text-primary"
                          type="number" min="0" value={row.qty}
                          onChange={e => updateRow(row.id, 'qty', e.target.value)} />
                        {row.productId && row.warehouseId && (
                          <div className="text-[10px] mt-0.5 text-right">
                            {row.stockQty === null
                              ? <span className="text-stone-400">Loading…</span>
                              : <span className="text-emerald-600 font-semibold">
                                  {row.stockQty} + {parseFloat(row.qty) || 0} = {row.stockQty + (parseFloat(row.qty) || 0)}
                                </span>
                            }
                          </div>
                        )}
                      </td>

                      <td className="px-2 py-3 text-center">
                        <button type="button" onClick={() => removeRow(row.id)}
                          className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addRow}
            className="flex items-center gap-2 text-rs-text-primary font-bold text-[10px] uppercase tracking-widest mt-4 hover:opacity-70 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> Add Product Row
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors"
              placeholder="Enter additional details..." rows="4" value={narration} onChange={e => setNarration(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end">
            <div className="bg-rs-cream/40 rounded-xl p-5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">Total Quantity</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {totalQty.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={handleDiscard}
            className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={saving}
            className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {saving ? 'Saving…' : `Save ${type} Voucher`}
          </button>
        </div>
      </form>
    </section>
  );
};

export default StockDataVoucherForm;
