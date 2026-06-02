import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getPaymentMethods, getPaymentNextNo, createPayment } from '../../../api/vouchers';
import { getSuppliers } from '../../../api/masters';

const PaymentVoucherForm = () => {
  const [voucherNo,       setVoucherNo]       = useState('');
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [supplierId,      setSupplierId]      = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount,          setAmount]          = useState('');
  const [narration,       setNarration]       = useState('');
  const [suppliers,       setSuppliers]       = useState([]);
  const [paymentMethods,  setPaymentMethods]  = useState([]);
  const [submitting,      setSubmitting]      = useState(false);
  const [message,         setMessage]         = useState(null);

  useEffect(() => {
    Promise.all([getSuppliers(), getPaymentMethods(), getPaymentNextNo()])
      .then(([sups, methods, { voucherNo: no }]) => {
        setSuppliers(sups);
        setPaymentMethods(methods);
        setVoucherNo(no);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load form data' }));
  }, []);

  const reset = () => { setSupplierId(''); setPaymentMethodId(''); setAmount(''); setNarration(''); setMessage(null); setDate(new Date().toISOString().split('T')[0]); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId || !paymentMethodId || !amount) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await createPayment({ supplierId, paymentMethodId, amount: Number(amount), narration, date });
      setMessage({ type: 'success', text: `Payment Voucher ${voucherNo} saved successfully!` });
      const { voucherNo: no } = await getPaymentNextNo();
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
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New Payment Voucher</h2>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} required>
                <option value="">Select Method</option>
                {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <span className="absolute left-0 top-0 text-stone-400 text-sm font-semibold">₹</span>
              <input className="w-full bg-transparent pl-4 text-sm font-bold text-rs-text-primary outline-none" placeholder="0.00" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
            </div>
          </div>
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
                ₹ {Number(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center gap-8 pt-8 border-t border-stone-100">
          <button type="button" onClick={reset} className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={submitting} className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {submitting ? 'Saving...' : 'Save Payment Voucher'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default PaymentVoucherForm;
