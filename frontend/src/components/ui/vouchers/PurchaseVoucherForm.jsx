import React, { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { getPaymentMethods, getPurchaseNextNo, createPurchase } from '../../../api/vouchers';
import { getSuppliers, getMasterBranches, getProducts } from '../../../api/masters';

const emptyRow = () => ({ id: Date.now(), productId: '', qty: 1, rate: 0, amount: 0 });

const PurchaseVoucherForm = () => {
  const [voucherNo,       setVoucherNo]       = useState('');
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [supplierId,      setSupplierId]      = useState('');
  const [branchId,        setBranchId]        = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [narration,       setNarration]       = useState('');
  const [rows,            setRows]            = useState([emptyRow()]);
  const [suppliers,       setSuppliers]       = useState([]);
  const [branches,        setBranches]        = useState([]);
  const [products,        setProducts]        = useState([]);
  const [paymentMethods,  setPaymentMethods]  = useState([]);
  const [submitting,      setSubmitting]      = useState(false);
  const [message,         setMessage]         = useState(null);

  useEffect(() => {
    Promise.all([getSuppliers(), getMasterBranches(), getProducts(), getPaymentMethods(), getPurchaseNextNo()])
      .then(([sups, brs, prods, methods, { voucherNo: no }]) => {
        setSuppliers(sups);
        setBranches(brs);
        setProducts(prods);
        setPaymentMethods(methods);
        setVoucherNo(no);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load form data' }));
  }, []);

  const addRow    = () => setRows(r => [...r, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(r => r.filter(x => x.id !== id)); };
  const updateRow = (id, field, value) => {
    setRows(r => r.map(row => {
      if (row.id !== id) return row;
      const updated = { ...row, [field]: value };
      updated.amount = Number(updated.qty) * Number(updated.rate);
      return updated;
    }));
  };

  const total = rows.reduce((s, r) => s + r.amount, 0);

  const reset = () => {
    setSupplierId(''); setBranchId(''); setPaymentMethodId(''); setNarration('');
    setRows([emptyRow()]); setMessage(null); setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !branchId || !paymentMethodId) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }
    const validRows = rows.filter(r => r.productId && r.qty > 0);
    if (!validRows.length) {
      setMessage({ type: 'error', text: 'Add at least one product with qty > 0' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await createPurchase({
        supplierId, branchId, paymentMethodId, date, narration,
        items: validRows.map(r => ({ productId: r.productId, qty: r.qty, rate: r.rate })),
      });
      setMessage({ type: 'success', text: `Purchase Voucher ${voucherNo} saved successfully!` });
      const { voucherNo: no } = await getPurchaseNextNo();
      setVoucherNo(no);
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
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New Purchase Voucher</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Supplier Name</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Branch Location</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={branchId} onChange={e => setBranchId(e.target.value)} required>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method</label>
          <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
            <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} required>
              <option value="">Select Method</option>
              {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Product Details</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-20">Qty</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Rate</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map(row => (
                  <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">
                    <td className="px-4 py-4">
                      <select className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer font-medium" value={row.productId} onChange={e => updateRow(row.id, 'productId', e.target.value)}>
                        <option value="">Select Product</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none" type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(row.id, 'qty', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none" type="number" min="0" step="0.01" value={row.rate} onChange={e => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)} />
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rs-text-primary">
                      ₹ {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-end">
              <span className="font-bold text-rs-text-primary text-sm uppercase tracking-widest">Grand Total</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                ₹ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-8 pt-8 border-t border-stone-100">
          <button type="button" onClick={reset} className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={submitting} className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save Purchase Voucher'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default PurchaseVoucherForm;
