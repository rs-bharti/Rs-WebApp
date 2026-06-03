import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown, ArrowRight } from 'lucide-react';
import { getProducts } from '../../../api/masters';
import { useAuth } from '../../../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const authHeaders = () => {
  const activeBranch = JSON.parse(localStorage.getItem('activeBranch') || 'null');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    ...(activeBranch?.id ? { 'X-Branch-Id': String(activeBranch.id) } : {}),
  };
};

const emptyRow = () => ({ id: Date.now(), productId: '', qty: 1 });

const StockTransferVoucherForm = () => {
  const { activeBranch } = useAuth();
  const [voucherNo,       setVoucherNo]       = useState('');
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId,   setToWarehouseId]   = useState('');
  const [narration,       setNarration]       = useState('');
  const [rows,            setRows]            = useState([emptyRow()]);
  const [warehouses,      setWarehouses]      = useState([]);
  const [products,        setProducts]        = useState([]);
  const [submitting,      setSubmitting]      = useState(false);
  const [message,         setMessage]         = useState(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/warehouses`, { headers: authHeaders() }).then(r => r.json()),
      getProducts(),
      fetch(`${API_URL}/api/stock-vouchers/transfer/next-number`, { headers: authHeaders() }).then(r => r.json()),
    ])
      .then(([wh, prods, { voucherNo: no }]) => {
        setWarehouses(wh);
        setProducts(prods);
        setVoucherNo(no);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load form data' }));
  }, []);

  const addRow    = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id, field, value) => setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

  const totalQty = rows.reduce((sum, r) => sum + (parseFloat(r.qty) || 0), 0);

  const reset = () => { setFromWarehouseId(''); setToWarehouseId(''); setNarration(''); setRows([emptyRow()]); setMessage(null); setDate(new Date().toISOString().split('T')[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromWarehouseId || !toWarehouseId) { setMessage({ type: 'error', text: 'Please select both warehouses' }); return; }
    if (Number(fromWarehouseId) === Number(toWarehouseId)) { setMessage({ type: 'error', text: 'Source and destination must be different' }); return; }
    const validRows = rows.filter(r => r.productId && parseFloat(r.qty) > 0);
    if (!validRows.length) { setMessage({ type: 'error', text: 'Add at least one product with qty > 0' }); return; }

    setSubmitting(true);
    setMessage(null);
    try {
      for (const row of validRows) {
        const res = await fetch(`${API_URL}/api/stock-vouchers/transfer`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({
            date,
            fromWarehouseId: Number(fromWarehouseId),
            toWarehouseId:   Number(toWarehouseId),
            productId:       Number(row.productId),
            qty:             parseFloat(row.qty),
            narration,
            branchId:        activeBranch?.id,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to save');
      }
      const { voucherNo: no } = await fetch(`${API_URL}/api/stock-vouchers/transfer/next-number`, { headers: authHeaders() }).then(r => r.json());
      setVoucherNo(no);
      setMessage({ type: 'success', text: `${validRows.length} Stock Transfer Voucher(s) saved successfully!` });
      reset();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
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

      <form className="p-8 space-y-10" onSubmit={handleSubmit}>

        {/* Branch (read-only) */}
        {activeBranch && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Branch</span>
            <span className="text-sm font-semibold text-rs-text-primary">{activeBranch.name}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-xl">
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

        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">From Warehouse</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={fromWarehouseId} onChange={e => setFromWarehouseId(e.target.value)} required>
                <option value="">Select Source Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center justify-center mt-4 md:mt-6">
            <ArrowRight className="w-5 h-5 text-rs-text-muted" />
          </div>
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">To Warehouse</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={toWarehouseId} onChange={e => setToWarehouseId(e.target.value)} required>
                <option value="">Select Destination Warehouse</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Transfer Items</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-10">#</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-40">Quantity to Transfer</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map((row, index) => (
                  <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">
                    <td className="px-4 py-4 text-rs-text-muted font-bold text-xs">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <select className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer font-medium" value={row.productId} onChange={e => updateRow(row.id, 'productId', e.target.value)}>
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none flex-shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none font-bold text-rs-text-primary" type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(row.id, 'qty', e.target.value)} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <button type="button" onClick={() => removeRow(row.id)} className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addRow} className="flex items-center gap-2 text-rs-text-primary font-bold text-[10px] uppercase tracking-widest mt-4 hover:opacity-70 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> Add Product Row
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors" placeholder="Enter additional details..." rows="4" value={narration} onChange={e => setNarration(e.target.value)} />
          </div>
          <div className="w-full md:w-72 flex flex-col justify-end">
            <div className="bg-rs-cream/40 rounded-xl p-5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">Total Qty Transfer</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">{totalQty.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-8 pt-8 border-t border-stone-100">
          <button type="button" onClick={reset} className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={submitting} className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save Stock Transfer Voucher'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default StockTransferVoucherForm;
