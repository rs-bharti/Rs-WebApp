import { useState, useEffect, useCallback } from 'react';
import { useAutoRefresh, emitDataChange } from '../../../hooks/useAutoRefresh';
import { Plus, X, ExternalLink, List } from 'lucide-react';
import SelectSearch from '../SelectSearch';
import { Link } from 'react-router-dom';
import { getProducts, getWarehouses } from '../../../api/masters';
import { getStockDataVoucherNextNo, saveStockDataVoucher, getStockQty, getStockData, updateStockDataVoucher, deleteStockDataVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import VoucherListModal, { fmtDate } from './VoucherListModal';

const emptyRow = () => ({ id: Date.now() + Math.random(), productId: '', warehouseId: '', qty: 1, rate: '', stockQty: null });

const StockDataVoucherForm = () => {
  const type = 'Stock Data';
  const { activeBranch, canAccessMaster } = useAuth();

  const [rows,      setRows]      = useState([emptyRow()]);
  const [date,      setDate]      = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [narration, setNarration] = useState('');
  const [products,  setProducts]  = useState([]);
  const [warehouses,setWarehouses]= useState([]);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const [success,   setSuccess]   = useState('');
  const [vouchers, setVouchers]               = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showList,        setShowList]        = useState(false);

  const refreshVouchers = useCallback(() => { getStockData().then(setVouchers).catch(console.error); }, []);
  useAutoRefresh(refreshVouchers, 15000);

  const COLUMNS = [
    { key: 'voucherNo',  label: 'Voucher No' },
    { key: 'date',       label: 'Date',      render: v => fmtDate(v.date) },
    { key: 'warehouse',  label: 'Warehouse', render: v => v.warehouse?.name || v.warehouseName || '—' },
    { key: 'items',      label: 'Products',  render: v => { const items = v.items || []; if (!items.length) return '—'; const first = items[0].product?.name || items[0].productName || '—'; return items.length > 1 ? `${first} +${items.length - 1}` : first; } },
    { key: '_qty',       label: 'Qty',       render: v => { const items = v.items || []; const t = items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0); return t || '—'; } },
    { key: '_rate',      label: 'Rate',      render: v => { const i = (v.items || [])[0]; return i?.rate != null ? Number(i.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'; } },
    { key: 'narration',  label: 'Narration', render: v => v.narration || '—' },
    { key: 'branch',     label: 'Branch',    render: v => v.branch?.name || '—',    detailOnly: true },
    { key: 'createdBy',  label: 'Created By',render: v => v.createdBy?.name || '—', detailOnly: true },
  ];
  const EDIT_FIELDS = [
    { key: 'date',      label: 'Date',      type: 'date' },
    { key: 'narration', label: 'Narration',  type: 'textarea', placeholder: 'Optional remarks' },
    { key: 'items',     label: 'Products',   type: 'items' },
  ];

  useEffect(() => {
    setLoadingVouchers(true);
    Promise.all([getProducts(), getWarehouses(), getStockDataVoucherNextNo(), getStockData()])
      .then(([prod, wh, vn, vlist]) => { setProducts(prod); setWarehouses(wh); setVoucherNo(vn.voucherNo); setVouchers(vlist); })
      .catch(err => setError(err?.message || 'Failed to load form data'))
      .finally(() => setLoadingVouchers(false));
  }, [activeBranch?.id]);

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

  const totalQty    = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
  const totalAmount = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0) * (parseFloat(r.rate) || 0), 0);

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
        narration:   narration ? narration.toUpperCase() : undefined,
        branchId:    activeBranch?.id,
        items:       validRows.map(r => ({ productId: parseInt(r.productId), warehouseId: parseInt(r.warehouseId), qty: parseFloat(r.qty), rate: r.rate !== '' ? parseFloat(r.rate) : undefined })),
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved with ${validRows.length} item(s)`);
      setRows([emptyRow()]);
      setNarration('');
      const [vn, vlist] = await Promise.all([getStockDataVoucherNextNo(), getStockData()]);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
      emitDataChange();
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
    <>
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-4 py-4 md:px-8 md:py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New {type} Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: {voucherNo || '…'}
        </span>
      </div>

      <form className="p-4 md:p-8 space-y-6 md:space-y-10" onSubmit={handleSubmit} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSubmit(e); } }}>
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
            <table className="w-full text-sm text-left border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-8">#</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name {canAccessMaster('Product') && <Link to="/dashboard/master/product" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Product Master"><ExternalLink className="w-4 h-4" /></Link>}</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-44">Warehouse {canAccessMaster('Warehouse') && <Link to="/dashboard/master/warehouse" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Warehouse Master"><ExternalLink className="w-4 h-4" /></Link>}</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-28">Curr. Stock</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Add Qty</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Rate</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Amount</th>
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
                          type="number" min="0"
                          value={row.qty === '0' || row.qty === 0 ? '' : row.qty}
                          onFocus={e => e.target.select()}
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

                      {/* Rate */}
                      <td className="px-4 py-3 text-right">
                        <input
                          className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none font-bold text-rs-text-primary"
                          type="number" min="0" step="any"
                          value={row.rate === '0' || row.rate === 0 || row.rate === '0.00' ? '' : row.rate}
                          onFocus={e => e.target.select()}
                          onChange={e => updateRow(row.id, 'rate', e.target.value)} />
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-rs-text-primary">
                          {((parseFloat(row.qty) || 0) * (parseFloat(row.rate) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
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
          <div className="w-full md:w-80 flex flex-col justify-end gap-3">
            <div className="bg-rs-cream/40 rounded-xl p-4 flex justify-between items-center">
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">Total Quantity</span>
              <span className="text-2xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {totalQty.toLocaleString()}
              </span>
            </div>
            <div className="bg-rs-text-primary/5 rounded-xl p-4 flex justify-between items-center">
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={() => setShowList(true)}
            className="flex items-center justify-center sm:justify-start gap-2 bg-rs-text-primary text-white px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer">
            <List className="w-4 h-4" /> View Entries
          </button>
          <div className="flex items-center gap-4 sm:gap-8">
            <button type="button" onClick={handleDiscard}
              className="flex-1 sm:flex-none text-center sm:text-left text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer py-2 sm:py-0">
              Discard
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 sm:flex-none bg-rs-text-primary text-white px-4 sm:px-12 py-3 sm:py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : `Save ${type} Voucher`}
            </button>
          </div>
        </div>
      </form>
    </section>

      <VoucherListModal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Stock Data Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={async (id) => { await deleteStockDataVoucher(id); setVouchers(p => p.filter(v => v.id !== id)); emitDataChange(); }}
        onUpdate={async (id, data) => { const u = await updateStockDataVoucher(id, data); setVouchers(p => p.map(v => v.id === id ? { ...v, ...u } : v)); emitDataChange(); }}
        loading={loadingVouchers}
      />
    </>
  );
};

export default StockDataVoucherForm;
