import { useState, useEffect } from 'react';
import { Plus, List } from 'lucide-react';
import SelectSearch from '../SelectSearch';
import { getPaymentMethods } from '../../../api/masters';
import { getContraVoucherNextNo, saveContraVoucher, getContras, updateContraVoucher, deleteContraVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import QuickCreateModal from '../QuickCreateModal';
import VoucherListModal, { fmtDate } from './VoucherListModal';

const ContraVoucherForm = () => {
  const type = 'Contra';
  const { activeBranch, currencySymbol } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [fromPaymentMethodId, setFromPaymentMethodId] = useState('');
  const [toPaymentMethodId, setToPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  const [paymentMethods, setPaymentMethods] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quickCreate, setQuickCreate] = useState(null);
  const [vouchers, setVouchers]               = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showList,        setShowList]        = useState(false);

  const COLUMNS = [
    { key: 'voucherNo',          label: 'Voucher No' },
    { key: 'date',               label: 'Date',  render: v => fmtDate(v.date) },
    { key: 'fromPaymentMethod',  label: 'From',  render: v => v.fromPaymentMethod?.name || v.fromPaymentMethodName || '—' },
    { key: 'toPaymentMethod',    label: 'To',    render: v => v.toPaymentMethod?.name   || v.toPaymentMethodName   || '—' },
    { key: 'amount',             label: 'Amount', render: v => `₹${Number(v.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
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
    setLoadingVouchers(true);
    Promise.all([
      getPaymentMethods(),
      getContraVoucherNextNo(),
      getContras(),
    ]).then(([pm, vn, vlist]) => {
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
    if (!fromPaymentMethodId || !toPaymentMethodId) return setError('Please select both accounts');
    if (fromPaymentMethodId === toPaymentMethodId)  return setError('Source and destination accounts must be different');
    if (!amount || parseFloat(amount) <= 0)         return setError('Please enter a valid amount');
    setSaving(true);
    try {
      const voucher = await saveContraVoucher({
        date,
        fromPaymentMethodId: parseInt(fromPaymentMethodId),
        toPaymentMethodId:   parseInt(toPaymentMethodId),
        amount:              parseFloat(amount),
        narration:           narration || undefined,
        branchId:            activeBranch?.id,
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved successfully!`);
      setFromPaymentMethodId('');
      setToPaymentMethodId('');
      setAmount('');
      setNarration('');
      const [vn, vlist] = await Promise.all([getContraVoucherNextNo(), getContras()]);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setFromPaymentMethodId('');
    setToPaymentMethodId('');
    setAmount('');
    setNarration('');
    setError('');
    setSuccess('');
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

        {/* Date + Voucher No */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-xl">
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
        </div>

        {/* Transfer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          {/* From */}
          <div className="space-y-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h3 className="text-sm font-bold text-rs-text-primary uppercase tracking-widest">From</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Account</label>
                  <button type="button" onClick={() => setQuickCreate("Payment Method")} className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all cursor-pointer" title="Create new Payment Method"><Plus className="w-4 h-4" /></button>
                </div>
                <SelectSearch
                  value={fromPaymentMethodId}
                  onChange={setFromPaymentMethodId}
                  options={paymentMethods}
                  placeholder="Select Account"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
                <div className="flex items-center gap-1 border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
                  <span className="text-stone-400 text-sm font-semibold flex-shrink-0">{currencySymbol}</span>
                  <input className="flex-1 bg-transparent text-sm font-bold text-rs-text-primary outline-none" placeholder="0.00" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                </div>
              </div>
            </div>
          </div>

          {/* To */}
          <div className="space-y-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h3 className="text-sm font-bold text-rs-text-primary uppercase tracking-widest">To</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Account</label>
                  <button type="button" onClick={() => setQuickCreate("Payment Method")} className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all cursor-pointer" title="Create new Payment Method"><Plus className="w-4 h-4" /></button>
                </div>
                <SelectSearch
                  value={toPaymentMethodId}
                  onChange={setToPaymentMethodId}
                  options={paymentMethods}
                  placeholder="Select Account"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
                <div className="flex items-center gap-1 border-b border-stone-100 pb-1">
                  <span className="text-stone-400 text-sm font-semibold flex-shrink-0">{currencySymbol}</span>
                  <input className="flex-1 bg-transparent text-sm font-bold text-rs-text-primary outline-none" readOnly type="number" value={amount || 0} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Narration */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
          <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors" placeholder="Enter additional details..." rows="3" value={narration} onChange={e => setNarration(e.target.value)} />
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
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>
      </form>
    </section>

      {quickCreate && (
        <QuickCreateModal
          type={quickCreate}
          onClose={() => setQuickCreate(null)}
          onCreated={(item) => { setPaymentMethods(prev => [...prev, item]); setQuickCreate(null); }}
        />
      )}

      <VoucherListModal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Contra Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={async (id) => { await deleteContraVoucher(id); setVouchers(p => p.filter(v => v.id !== id)); }}
        onUpdate={async (id, data) => { const u = await updateContraVoucher(id, data); setVouchers(p => p.map(v => v.id === id ? { ...v, ...u } : v)); }}
        loading={loadingVouchers}
      />
    </>
  );
};

export default ContraVoucherForm;
