import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  createCategory,
  createUnit,
  createPaymentMethod,
  createExpense,
  createCustomer,
  createSupplier,
} from '../../api/masters';

const CONFIGS = {
  'Category': {
    title: 'New Category',
    fields: [
      { key: 'name', label: 'Category Name', placeholder: 'e.g. Electronics, Clothing', required: true },
    ],
    save:     (data) => createCategory({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Unit': {
    title: 'New Unit',
    fields: [
      { key: 'unitName',  label: 'Unit Name',  placeholder: 'e.g. Kilogram, Litre, Piece', required: true },
      { key: 'shortName', label: 'Short Name', placeholder: 'e.g. kg, L, pcs',             required: false },
    ],
    save:     (data) => createUnit({ unitName: data.unitName.trim(), ...(data.shortName?.trim() && { shortName: data.shortName.trim() }) }),
    toOption: (r) => ({ id: r.id, unitName: r.unitName, shortName: r.shortName }),
    label:    (r) => r.unitName + (r.shortName ? ` (${r.shortName})` : ''),
  },
  'Payment Method': {
    title: 'New Payment Method',
    fields: [
      { key: 'name', label: 'Payment Method Name', placeholder: 'e.g. Cash, UPI, Bank Transfer', required: true },
    ],
    save:     (data) => createPaymentMethod({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Expense': {
    title: 'New Expense Type',
    fields: [
      { key: 'name', label: 'Expense Name', placeholder: 'e.g. Rent, Electricity, Salary', required: true },
    ],
    save:     (data) => createExpense({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Customer': {
    title: 'New Customer',
    fields: [
      { key: 'name', label: 'Customer Name', placeholder: 'e.g. John Doe', required: true },
    ],
    save:     (data) => createCustomer({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Supplier': {
    title: 'New Supplier',
    fields: [
      { key: 'name', label: 'Supplier Name', placeholder: 'e.g. ABC Traders', required: true },
    ],
    save:     (data) => createSupplier({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
};

const inputCls = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-all focus:border-rs-text-primary focus:ring-2 focus:ring-rs-text-primary/10 focus:bg-white placeholder:text-rs-text-muted/50';
const labelCls = 'text-[11px] font-bold uppercase tracking-wider text-rs-text-muted';

const QuickCreateModal = ({ type, onClose, onCreated }) => {
  const config = CONFIGS[type];
  const { clearBranch } = useAuth();
  const navigate = useNavigate();

  const [formData,   setFormData]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [savedLabel, setSavedLabel] = useState('');

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!config) return null;

  const upd = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    for (const f of config.fields) {
      if (f.required && !formData[f.key]?.trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      const result = await config.save(formData);
      const option = config.toOption(result);
      setSavedLabel(config.label(result));
      setTimeout(() => {
        onCreated(option);
      }, 1000);
    } catch (err) {
      const msg = err.message || 'Failed to save';
      if (msg?.includes('BRANCH_INVALID')) {
        clearBranch();
        onClose();
        navigate('/select-branch');
      } else {
        setError(msg);
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-lg font-user-serif font-bold text-rs-text-primary">{config.title}</h3>
          <button type="button" onClick={onClose}
            className="text-rs-text-muted hover:text-rs-text-primary bg-stone-50 hover:bg-stone-100 rounded-lg p-1.5 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {savedLabel ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-rs-text-primary text-center">
                "<span className="text-emerald-600">{savedLabel}</span>" saved!
              </p>
              <p className="text-xs text-rs-text-muted">Selecting automatically…</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

              {config.fields.map((f, i) => (
                <div key={f.key} className="space-y-1.5">
                  <label className={labelCls}>
                    {f.label} {f.required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    className={inputCls}
                    type="text"
                    placeholder={f.placeholder}
                    value={formData[f.key] || ''}
                    onChange={upd(f.key)}
                    required={f.required}
                    autoFocus={i === 0}
                  />
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-rs-text-muted hover:text-rs-text-primary border border-stone-200 rounded-xl hover:border-stone-300 transition-all cursor-pointer active:scale-95">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-rs-text-primary text-white hover:brightness-110 active:scale-95 transition-all shadow-sm disabled:opacity-60 cursor-pointer">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickCreateModal;
