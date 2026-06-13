import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, List, ChevronDown } from 'lucide-react';
import SelectSearch from '../SelectSearch';
import { getCustomers, getSuppliers, getExpenses, getMasterBranchMasters, getPaymentMethods } from '../../../api/masters';
import { openInTab } from '../../../utils/openInTab';
import { getPaymentVoucherNextNo, savePaymentVoucher, getPayments, updatePaymentVoucher, deletePaymentVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import VoucherListModal, { fmtDate } from './VoucherListModal';

const PaymentVoucherForm = () => {
  const type = 'Payment';
  const { activeBranch, currencySymbol, isAdmin, allowedBranches } = useAuth();

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo, setVoucherNo] = useState('');
  const [particularKey, setParticularKey] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');

  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [masterPopup, setMasterPopup] = useState(false);
  const masterPopupRef = useRef(null);

  useEffect(() => {
    if (!masterPopup) return;
    const handler = (e) => { if (masterPopupRef.current && !masterPopupRef.current.contains(e.target)) setMasterPopup(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [masterPopup]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vouchers, setVouchers]               = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showList,        setShowList]        = useState(false);

  // Combined particulars options: "Name (Type)"
  const particularsOptions = useMemo(() => {
    const opts = [];
    for (const s of suppliers) opts.push({ id: `supplier_${s.id}`, name: `${s.name} (Supplier)` });
    for (const c of customers) opts.push({ id: `customer_${c.id}`, name: `${c.name} (Customer)` });
    for (const e of expenses)  opts.push({ id: `expense_${e.id}`,  name: `${e.name} (Expense)` });
    for (const b of branches)  opts.push({ id: `branch_${b.id}`,   name: `${b.name} (Branch)` });
    return opts;
  }, [suppliers, customers, expenses, branches]);

  const parseParticular = (key) => {
    if (!key) return null;
    const idx = key.indexOf('_');
    if (idx === -1) return null;
    return { type: key.slice(0, idx), id: Number(key.slice(idx + 1)) };
  };

  const COLUMNS = [
    { key: 'voucherNo',     label: 'Voucher No' },
    { key: 'date',          label: 'Date',     render: v => fmtDate(v.date) },
    { key: 'particular',    label: 'Particulars', render: v => v.particularName || v.supplier?.name || '—' },
    { key: 'paymentMethod', label: 'Method',   render: v => v.paymentMethod?.name || '—' },
    { key: 'amount',        label: 'Amount',   render: v => `₹${Number(v.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
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
    // For admin: fetch all branches from master; for regular users: use their allowed branches
    const branchPromise = getMasterBranchMasters();
    Promise.all([
      getCustomers(),
      getSuppliers(),
      getExpenses(),
      branchPromise,
      getPaymentMethods(),
      getPaymentVoucherNextNo(),
      getPayments(),
    ]).then(([cust, supp, exp, brnch, pm, vn, vlist]) => {
      setCustomers(cust);
      setSuppliers(supp);
      setExpenses(exp);
      setBranches(brnch);
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
    if (!particularKey)                      return setError('Please select a particular');
    if (!paymentMethodId)                    return setError('Please select a payment method');
    if (!amount || parseFloat(amount) <= 0)  return setError('Please enter a valid amount');
    const parsed = parseParticular(particularKey);
    if (!parsed) return setError('Invalid particular selection');
    const opt = particularsOptions.find(o => o.id === particularKey);
    const name = opt?.name?.replace(/ \(\w+\)$/, '') || '';
    setSaving(true);
    try {
      const voucher = await savePaymentVoucher({
        date,
        particularType:  parsed.type,
        particularId:    parsed.id,
        particularName:  name,
        paymentMethodId: parseInt(paymentMethodId),
        amount:          parseFloat(amount),
        narration:       narration || undefined,
        branchId:        activeBranch?.id,
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved successfully!`);
      setParticularKey('');
      setPaymentMethodId('');
      setAmount('');
      setNarration('');
      const [vn, vlist] = await Promise.all([getPaymentVoucherNextNo(), getPayments()]);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setParticularKey('');
    setPaymentMethodId('');
    setAmount('');
    setNarration('');
    setError('');
    setSuccess('');
  };

  const typeBadgeClass = {
    supplier: 'bg-purple-50 text-purple-700 border border-purple-100',
    customer: 'bg-blue-50 text-blue-700 border border-blue-100',
    expense:  'bg-orange-50 text-orange-700 border border-orange-100',
    branch:   'bg-teal-50 text-teal-700 border border-teal-100',
  };

  const selectedTypeBadge = () => {
    if (!particularKey) return null;
    const parsed = parseParticular(particularKey);
    if (!parsed) return null;
    const label = parsed.type.charAt(0).toUpperCase() + parsed.type.slice(1);
    return <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${typeBadgeClass[parsed.type] || 'bg-stone-100 text-stone-600'}`}>{label}</span>;
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
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Particulars</label>
              <div className="relative" ref={masterPopupRef}>
                <button type="button" onClick={() => setMasterPopup(p => !p)} className="flex items-center gap-0.5 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded px-1.5 py-0.5 transition-all cursor-pointer text-[10px] font-bold uppercase tracking-widest">
                  <Plus className="w-3 h-3" /> Add <ChevronDown className="w-3 h-3" />
                </button>
                {masterPopup && (
                  <div className="absolute right-0 top-7 z-50 bg-white border border-stone-200 rounded-xl shadow-lg py-1 min-w-[160px] animate-in fade-in zoom-in-95 duration-100">
                    {[['supplier', 'Supplier', '/dashboard/master/supplier'], ['customer', 'Customer', '/dashboard/master/customer'], ['expense', 'Expense', '/dashboard/master/expense']].map(([type, label, path]) => (
                      <button key={type} type="button" onClick={() => { openInTab(path); setMasterPopup(false); }}
                        className={`w-full text-left px-4 py-2 text-sm font-medium hover:bg-rs-accent-bg transition-colors`}>
                        + Open {label} Master
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <SelectSearch
              value={particularKey}
              onChange={setParticularKey}
              options={particularsOptions}
              placeholder="Select Supplier / Customer / Expense / Branch"
            />
            {selectedTypeBadge()}
          </div>
        </div>

        {/* Payment Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-2xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Payment Method</label>
              <button type="button" onClick={() => openInTab('/dashboard/master/payment-method')} className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all cursor-pointer" title="Open Payment Method Master"><Plus className="w-4 h-4" /></button>
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

      <VoucherListModal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Payment Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={async (id) => { await deletePaymentVoucher(id); setVouchers(p => p.filter(v => v.id !== id)); }}
        onUpdate={async (id, data) => { const u = await updatePaymentVoucher(id, data); setVouchers(p => p.map(v => v.id === id ? { ...v, ...u } : v)); }}
        loading={loadingVouchers}
      />
    </>
  );
};

export default PaymentVoucherForm;
