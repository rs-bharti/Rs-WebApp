import { useState, useEffect } from 'react';
import { Plus, ExternalLink, List } from 'lucide-react';
import SelectSearch from '../SelectSearch';
import { getCustomers, getPaymentMethods } from '../../../api/masters';
import { getReceiptVoucherNextNo, saveReceiptVoucher, getReceipts, updateReceiptVoucher, deleteReceiptVoucher } from '../../../api/vouchers';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import QuickCreateModal from '../QuickCreateModal';
import VoucherListModal, { fmtDate } from './VoucherListModal';

const ReceiptVoucherForm = () => {
  const type = 'Receipt';
  const { activeBranch, currencySymbol } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  const [customers, setCustomers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickCreate, setQuickCreate] = useState(null);
  const [vouchers, setVouchers]             = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showList,        setShowList]        = useState(false);

  const COLUMNS = [
    { key: 'voucherNo',     label: 'Voucher No' },
    { key: 'date',          label: 'Date',    render: v => fmtDate(v.date) },
    { key: 'customer',      label: 'Customer', render: v => v.customer?.name || '—' },
    { key: 'paymentMethod', label: 'Method',  render: v => v.paymentMethod?.name || '—' },
    { key: 'amount',        label: 'Amount',  render: v => `₹${Number(v.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { key: 'narration',  label: 'Narration',  render: v => v.narration || '—' },
    { key: 'branch',     label: 'Branch',     render: v => v.branch?.name || '—',    detailOnly: true },
    { key: 'createdBy',  label: 'Created By', render: v => v.createdBy?.name || '—', detailOnly: true },
  ];
  const EDIT_FIELDS = [
    { key: 'date',      label: 'Date',      type: 'date' },
    { key: 'amount',    label: 'Amount (₹)', type: 'number', placeholder: '0.00' },
    { key: 'narration', label: 'Narration',  type: 'textarea', placeholder: 'Optional remarks' },
  ];

  useEffect(() => {
    setPaymentMethodId('');
    setPaymentMethods([]);
    setLoadingVouchers(true);
    Promise.all([
      getCustomers(),
      getPaymentMethods(),
      getReceiptVoucherNextNo(),
      getReceipts(),
    ]).then(([cust, pm, vn, vlist]) => {
      setCustomers(cust);
      setPaymentMethods(pm);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
    }).catch(err => setError(err?.message || 'Failed to load form data'))
      .finally(() => setLoadingVouchers(false));
  }, [activeBranch?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!customerId)                        return setError('Please select a customer');
    if (!paymentMethodId)                   return setError('Please select a payment method');
    if (!amount || parseFloat(amount) <= 0) return setError('Please enter a valid amount');
    setSaving(true);
    try {
      const voucher = await saveReceiptVoucher({
        date,
        customerId:      parseInt(customerId),
        paymentMethodId: parseInt(paymentMethodId),
        amount:          parseFloat(amount),
        narration:       narration || undefined,
        branchId:        activeBranch?.id,
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved successfully!`);
      setCustomerId('');
      setPaymentMethodId('');
      setAmount('');
      setNarration('');
      const [vn, vlist] = await Promise.all([getReceiptVoucherNextNo(), getReceipts()]);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setCustomerId('');
    setPaymentMethodId('');
    setAmount('');
    setNarration('');
    setError('');
    setSuccess('');
  };

  const handleDeleteVoucher = async (id) => {
    await deleteReceiptVoucher(id);
    setVouchers(prev => prev.filter(v => v.id !== id));
  };
  const handleUpdateVoucher = async (id, data) => {
    const updated = await updateReceiptVoucher(id, data);
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, ...updated } : v));
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

        {/* Branch (read-only) */}
        {activeBranch && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Branch</span>
            <span className="text-sm font-semibold text-rs-text-primary">{activeBranch.name}</span>
          </div>
        )}

        {/* Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Date</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <input className="w-full bg-transparent text-sm font-medium outline-none" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Voucher No</label>
            <div className="relative border-b border-stone-100 pb-1">
              <input className="w-full bg-transparent text-sm font-bold text-rs-text-primary outline-none" readOnly type="text" value={voucherNo} />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Customer Name</label>
              <Link to="/dashboard/master/customer" className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all" title="Go to Customer Master"><ExternalLink className="w-4 h-4" /></Link>
            </div>
            <SelectSearch
              value={customerId}
              onChange={setCustomerId}
              options={customers.map(c => { const bal = c.balance ?? 0; return { ...c, label: `${c.name} — ${bal >= 0 ? 'CR' : 'DR'} ${currencySymbol}${Math.abs(bal).toLocaleString()}` }; })}
              placeholder="Select Customer"
            />
            {customerId && (() => {
              const c = customers.find(c => String(c.id) === String(customerId));
              if (!c) return null;
              const bal = c.balance ?? 0;
              const isCR = bal >= 0;
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isCR ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                  {isCR ? 'CR' : 'DR'} {currencySymbol}{Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-2xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Payment Method</label>
              <button type="button" onClick={() => setQuickCreate("Payment Method")} className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all cursor-pointer" title="Create new Payment Method"><Plus className="w-4 h-4" /></button>
            </div>
            <SelectSearch
              value={paymentMethodId}
              onChange={setPaymentMethodId}
              options={paymentMethods}
              placeholder="Select Method"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
            <div className="flex items-center gap-1 border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <span className="text-stone-400 text-sm font-semibold flex-shrink-0">{currencySymbol}</span>
              <input className="flex-1 bg-transparent text-sm font-bold text-rs-text-primary outline-none" placeholder="0" type="number" min="0" step="any" value={amount} onFocus={e => e.target.select()} onChange={e => setAmount(e.target.value)} required />
            </div>
          </div>
        </div>

        {/* Narration & Total */}
        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors" placeholder="Enter additional details..." rows="4" value={narration} onChange={e => setNarration(e.target.value)} />
          </div>
          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-end">
              <span className="font-bold text-rs-text-primary text-sm uppercase tracking-widest">Grand Total</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {currencySymbol} {parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={() => setShowList(true)} className="flex items-center gap-2 bg-rs-text-primary text-white px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer">
            <List className="w-4 h-4" /> View Entries
          </button>
          <div className="flex items-center gap-8">
            <button type="button" onClick={handleDiscard} className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
              Discard
            </button>
            <button type="submit" disabled={saving} className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : `Save ${type} Voucher`}
            </button>
          </div>
        </div>
      </form>
    </section>

      {quickCreate && (
        <QuickCreateModal
          type={quickCreate}
          onClose={() => setQuickCreate(null)}
          onCreated={(item) => { setPaymentMethods(prev => [...prev, item]); setPaymentMethodId(String(item.id)); setQuickCreate(null); }}
        />
      )}

      <VoucherListModal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Receipt Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={handleDeleteVoucher}
        onUpdate={handleUpdateVoucher}
        loading={loadingVouchers}
      />
    </>
  );
};

export default ReceiptVoucherForm;
