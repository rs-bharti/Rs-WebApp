import { useState, useEffect } from 'react';
import { Plus, X, ArrowRight, ExternalLink, List } from 'lucide-react';
import SelectSearch from '../SelectSearch';
import { Link } from 'react-router-dom';
import { getProducts, getWarehouses } from '../../../api/masters';
import { getStockTransferVoucherNextNo, saveStockTransferVoucher, getStockQty, getStockTransfers, updateStockTransferVoucher, deleteStockTransferVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import VoucherListModal, { fmtDate } from './VoucherListModal';

const emptyRow = () => ({ id: Date.now() + Math.random(), productId: '', fromWarehouseId: '', qty: 1, stockQty: null });

const StockTransferVoucherForm = () => {
  const { activeBranch } = useAuth();
  const [voucherNo,     setVoucherNo]     = useState('');
  const [date,          setDate]          = useState(new Date().toISOString().split('T')[0]);
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [narration,     setNarration]     = useState('');
  const [rows,          setRows]          = useState([emptyRow()]);
  const [warehouses,    setWarehouses]    = useState([]);
  const [products,      setProducts]      = useState([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [message,       setMessage]       = useState(null);
  const [vouchers, setVouchers]               = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showList,        setShowList]        = useState(false);

  const COLUMNS = [
    { key: 'voucherNo',      label: 'Voucher No' },
    { key: 'date',           label: 'Date',           render: v => fmtDate(v.date) },
    { key: 'fromWarehouse',  label: 'From Warehouse', render: v => v.fromWarehouse?.name || v.fromWarehouseName || '—' },
    { key: 'toWarehouse',    label: 'To Warehouse',   render: v => v.toWarehouse?.name   || v.toWarehouseName   || '—' },
    { key: 'items',          label: 'Items',          render: v => v.items?.length ?? '—' },
    { key: 'narration',      label: 'Narration',      render: v => v.narration || '—' },
  ];
  const EDIT_FIELDS = [
    { key: 'date',      label: 'Date',      type: 'date' },
    { key: 'narration', label: 'Narration',  type: 'textarea', placeholder: 'Optional remarks' },
  ];

  useEffect(() => {
    setLoadingVouchers(true);
    Promise.all([getWarehouses(), getProducts(), getStockTransferVoucherNextNo(), getStockTransfers()])
      .then(([wh, prods, { voucherNo: no }, vlist]) => { setWarehouses(wh); setProducts(prods); setVoucherNo(no); setVouchers(vlist); })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load form data' }))
      .finally(() => setLoadingVouchers(false));
  }, [activeBranch?.id]);

  const addRow    = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'productId' || field === 'fromWarehouseId') updated.stockQty = null;
      return updated;
    }));
    if (field === 'productId' || field === 'fromWarehouseId') {
      const currentRow = rows.find(r => r.id === id);
      if (!currentRow) return;
      const pId = field === 'productId' ? value : currentRow.productId;
      const wId = field === 'fromWarehouseId' ? value : currentRow.fromWarehouseId;
      if (pId && wId) {
        getStockQty(pId, wId)
          .then(data => setRows(curr => curr.map(r => r.id === id ? { ...r, stockQty: data.qty ?? 0 } : r)))
          .catch(() => setRows(curr => curr.map(r => r.id === id ? { ...r, stockQty: 0 } : r)));
      }
    }
  };

  const totalQty = rows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0);

  const reset = () => {
    setToWarehouseId(''); setNarration(''); setRows([emptyRow()]);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toWarehouseId) { setMessage({ type: 'error', text: 'Please select a destination warehouse' }); return; }
    const validRows = rows.filter(r => r.productId && r.fromWarehouseId && parseFloat(r.qty) > 0);
    if (!validRows.length) { setMessage({ type: 'error', text: 'Add at least one product with source warehouse and qty > 0' }); return; }

    const missingWh = rows.filter(r => r.productId && !r.fromWarehouseId);
    if (missingWh.length) { setMessage({ type: 'error', text: 'Please select a source warehouse for each product row' }); return; }

    const sameWh = validRows.filter(r => Number(r.fromWarehouseId) === Number(toWarehouseId));
    if (sameWh.length) { setMessage({ type: 'error', text: 'Source and destination warehouse must be different' }); return; }

    const overStock = validRows.filter(r =>
      r.fromWarehouseId && r.stockQty !== null && parseFloat(r.qty) > r.stockQty
    );
    if (overStock.length) { setMessage({ type: 'error', text: 'One or more items exceed available stock in the source warehouse.' }); return; }

    setSubmitting(true); setMessage(null);
    try {
      // Send first row's fromWarehouseId at top level for backend compatibility,
      // and also per-item for backends that support it
      const voucher = await saveStockTransferVoucher({
        date,
        fromWarehouseId: Number(validRows[0].fromWarehouseId),
        toWarehouseId:   Number(toWarehouseId),
        narration:       narration || undefined,
        branchId:        activeBranch?.id,
        items: validRows.map(r => ({
          productId:       Number(r.productId),
          fromWarehouseId: Number(r.fromWarehouseId),
          qty:             parseFloat(r.qty),
        })),
      });
      const [nextVn, vlist] = await Promise.all([getStockTransferVoucherNextNo(), getStockTransfers()]);
      setVoucherNo(nextVn.voucherNo);
      setVouchers(vlist);
      reset();
      setMessage({ type: 'success', text: `Voucher ${voucher.voucherNo} saved with ${validRows.length} item(s)` });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-4 py-4 md:px-8 md:py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New Stock Transfer Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: {voucherNo || '...'}
        </span>
      </div>

      {message && (
        <div className={`mx-8 mt-6 px-4 py-3 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      <form className="p-4 md:p-8 space-y-6 md:space-y-10" onSubmit={handleSubmit}>

        {activeBranch && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Branch</span>
            <span className="text-sm font-semibold text-rs-text-primary">{activeBranch.name}</span>
          </div>
        )}

        {/* Date, Voucher No, Destination Warehouse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 max-w-2xl">
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
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5 text-rs-text-muted" />
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">To Warehouse (All)</label>
            </div>
            <SelectSearch
              value={toWarehouseId}
              onChange={setToWarehouseId}
              options={warehouses}
              placeholder="Select Destination"
            />
          </div>
        </div>

        {/* Transfer Items Table — per-row from warehouse */}
        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Transfer Items</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-8">#</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name <Link to="/dashboard/master/product" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Product Master"><ExternalLink className="w-4 h-4" /></Link></th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-44">From Warehouse <Link to="/dashboard/master/warehouse" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Warehouse Master"><ExternalLink className="w-4 h-4" /></Link></th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-28">Avl. Stock</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-36">Transfer Qty</th>
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

                      {/* From Warehouse */}
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.fromWarehouseId}
                          onChange={v => updateRow(row.id, 'fromWarehouseId', v)}
                          options={warehouses.filter(w => String(w.id) !== String(toWarehouseId))}
                          placeholder="Select Source"
                        />
                      </td>

                      {/* Avl. Stock */}
                      <td className="px-4 py-3 text-right">
                        {row.fromWarehouseId && row.productId ? (
                          row.stockQty === null
                            ? <span className="text-[10px] text-stone-400">…</span>
                            : <span className={`font-bold text-sm ${row.stockQty <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>{row.stockQty}</span>
                        ) : <span className="text-stone-300">—</span>}
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          const exceedsStock = row.fromWarehouseId && row.productId && row.stockQty !== null && parseFloat(row.qty) > row.stockQty;
                          return (
                            <>
                              <input
                                className={`w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none font-bold ${exceedsStock ? 'text-red-500' : 'text-rs-text-primary'}`}
                                type="number" min="0" step="any" value={row.qty}
                                onChange={e => updateRow(row.id, 'qty', e.target.value)} />
                              {exceedsStock && (
                                <div className="text-[10px] text-right text-red-500 font-semibold mt-0.5">Max: {row.stockQty}</div>
                              )}
                            </>
                          );
                        })()}
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
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">Total Qty Transfer</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">{totalQty.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={() => setShowList(true)}
            className="flex items-center gap-2 bg-rs-text-primary text-white px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer">
            <List className="w-4 h-4" /> View Entries
          </button>
          <div className="flex items-center gap-8">
            <button type="button" onClick={reset}
              className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
              Discard
            </button>
            <button type="submit" disabled={submitting}
              className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
              {submitting ? 'Saving...' : 'Save Stock Transfer Voucher'}
            </button>
          </div>
        </div>
      </form>
    </section>

      <VoucherListModal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Stock Transfer Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={async (id) => { await deleteStockTransferVoucher(id); setVouchers(p => p.filter(v => v.id !== id)); }}
        onUpdate={async (id, data) => { const u = await updateStockTransferVoucher(id, data); setVouchers(p => p.map(v => v.id === id ? { ...v, ...u } : v)); }}
        loading={loadingVouchers}
      />
    </>
  );
};

export default StockTransferVoucherForm;
