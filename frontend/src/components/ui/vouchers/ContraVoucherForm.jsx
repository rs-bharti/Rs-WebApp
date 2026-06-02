import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { getPaymentMethods, getContraNextNo, createContra } from '../../../api/vouchers';

const ContraVoucherForm = () => {
  const [voucherNo,           setVoucherNo]           = useState('');
  const [date,                setDate]                = useState(new Date().toISOString().split('T')[0]);
  const [fromPaymentMethodId, setFromPaymentMethodId] = useState('');
  const [toPaymentMethodId,   setToPaymentMethodId]   = useState('');
  const [amount,              setAmount]              = useState('');
  const [narration,           setNarration]           = useState('');
  const [paymentMethods,      setPaymentMethods]      = useState([]);
  const [submitting,          setSubmitting]          = useState(false);
  const [message,             setMessage]             = useState(null);

  useEffect(() => {
    Promise.all([getPaymentMethods(), getContraNextNo()])
      .then(([methods, { voucherNo: no }]) => {
        setPaymentMethods(methods);
        setVoucherNo(no);
      })
      .catch(() => setMessage({ type: 'error', text: 'Failed to load form data' }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fromPaymentMethodId || !toPaymentMethodId || !amount) {
      setMessage({ type: 'error', text: 'Please fill all required fields' });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      await createContra({ fromPaymentMethodId, toPaymentMethodId, amount: Number(amount), narration, date });
      setMessage({ type: 'success', text: `Contra Voucher ${voucherNo} saved successfully!` });
      const { voucherNo: no } = await getContraNextNo();
      setVoucherNo(no);
      setFromPaymentMethodId('');
      setToPaymentMethodId('');
      setAmount('');
      setNarration('');
      setDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New Contra Voucher</h2>
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
        {/* Date + Voucher No */}
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

        {/* Transfer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* From */}
          <div className="space-y-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h3 className="text-sm font-bold text-rs-text-primary uppercase tracking-widest">From</h3>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method</label>
              <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
                <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={fromPaymentMethodId} onChange={e => setFromPaymentMethodId(e.target.value)} required>
                  <option value="">Select Account</option>
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

          {/* To */}
          <div className="space-y-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h3 className="text-sm font-bold text-rs-text-primary uppercase tracking-widest">To</h3>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method</label>
              <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
                <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={toPaymentMethodId} onChange={e => setToPaymentMethodId(e.target.value)} required>
                  <option value="">Select Account</option>
                  {paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
              <div className="relative border-b border-stone-100 pb-1">
                <span className="absolute left-0 top-0 text-stone-400 text-sm font-semibold">₹</span>
                <input className="w-full bg-transparent pl-4 text-sm font-bold text-rs-text-primary outline-none" readOnly value={amount || '0.00'} />
              </div>
            </div>
          </div>
        </div>

        {/* Narration */}
        <div className="space-y-2 max-w-2xl">
          <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
          <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors" placeholder="Enter additional details..." rows="3" value={narration} onChange={e => setNarration(e.target.value)} />
        </div>

        <div className="flex justify-end items-center gap-8 pt-8 border-t border-stone-100">
          <button type="reset" onClick={() => { setFromPaymentMethodId(''); setToPaymentMethodId(''); setAmount(''); setNarration(''); setMessage(null); }} className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={submitting} className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {submitting ? 'Saving...' : 'Submit'}
          </button>
        </div>
      </form>
    </section>
  );
};

export default ContraVoucherForm;
