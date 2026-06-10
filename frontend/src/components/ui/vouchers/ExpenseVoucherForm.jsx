import { useState, useEffect } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { getExpenses } from '../../../api/masters';
import { getExpenseVoucherNextNo, saveExpenseVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import QuickCreateModal from '../QuickCreateModal';

const ExpenseVoucherForm = () => {
  const type = 'Expense';
  const { activeBranch } = useAuth();

  const [date,        setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo,   setVoucherNo]   = useState('');
  const [expenseId,   setExpenseId]   = useState('');
  const [amount,      setAmount]      = useState('');
  const [narration,   setNarration]   = useState('');

  const [expenses,    setExpenses]    = useState([]);

  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [quickCreate, setQuickCreate] = useState(null);

  useEffect(() => {
    setExpenseId('');
    setExpenses([]);
    Promise.all([
      getExpenses(),
      getExpenseVoucherNextNo(),
    ]).then(([exp, vn]) => {
      setExpenses(exp);
      setVoucherNo(vn.voucherNo);
    }).catch(err => setError(err?.message || 'Failed to load form data'));
  }, [activeBranch?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!expenseId)                         return setError('Please select an expense type');
    if (!amount || parseFloat(amount) <= 0) return setError('Please enter a valid amount');
    setSaving(true);
    try {
      const voucher = await saveExpenseVoucher({
        date,
        expenseId: parseInt(expenseId),
        amount:    parseFloat(amount),
        narration: narration || undefined,
        branchId:  activeBranch?.id,
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      setExpenseId('');
      setAmount('');
      setNarration('');
      const vn = await getExpenseVoucherNextNo();
      setVoucherNo(vn.voucherNo);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setExpenseId('');
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

      <form className="p-4 md:p-8 space-y-6 md:space-y-10" onSubmit={handleSubmit}>
        {error   && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

        {/* Branch */}
        {activeBranch && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Branch</span>
            <span className="text-sm font-semibold text-rs-text-primary">{activeBranch.name}</span>
          </div>
        )}

        {/* Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-2xl">
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

        {/* Expense Type + Amount — inline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-2xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Expense Type</label>
              <button type="button" onClick={() => setQuickCreate('Expense')}
                className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all cursor-pointer"
                title="Add new expense type">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer" value={expenseId} onChange={e => setExpenseId(e.target.value)} required>
                <option value="" disabled>Select Expense</option>
                {expenses.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
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

        {/* Narration + Total */}
        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors" placeholder="Enter additional details..." rows="4" value={narration} onChange={e => setNarration(e.target.value)} />
          </div>
          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-end">
              <span className="font-bold text-rs-text-primary text-sm uppercase tracking-widest">Total Amount</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                ₹ {parseFloat(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end items-center gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={handleDiscard} className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={saving} className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {saving ? 'Saving…' : `Save ${type} Voucher`}
          </button>
        </div>
      </form>
    </section>

      {quickCreate && (
        <QuickCreateModal
          type={quickCreate}
          onClose={() => setQuickCreate(null)}
          onCreated={(item) => {
            if (quickCreate === 'Expense') {
              setExpenses(prev => [...prev, item]);
              setExpenseId(String(item.id));
            }
            setQuickCreate(null);
          }}
        />
      )}
    </>
  );
};

export default ExpenseVoucherForm;
