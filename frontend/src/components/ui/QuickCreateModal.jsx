import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Pencil, Trash2, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,      createUnit,     updateUnit,     deleteUnit,
  createPaymentMethod,
  createExpense,
  createCustomer,
  createSupplier,
} from '../../api/masters';

// Only Category and Unit have list management — others navigate to their master pages
const CONFIGS = {
  'Category': {
    title:     'Category',
    fields:    [{ key: 'name', label: 'Category Name', placeholder: 'e.g. Electronics, Clothing', required: true }],
    save:      (data) => createCategory({ name: data.name.trim() }),
    getList:   getCategories,
    update:    (id, data) => updateCategory(id, { name: data.name.trim() }),
    delete:    (id) => deleteCategory(id),
    toOption:  (r) => ({ id: r.id, name: r.name }),
    label:     (r) => r.name,
    rowLabel:  (r) => r.name,
    editFields: [{ key: 'name', placeholder: 'Category name' }],
  },
  'Unit': {
    title:     'Unit',
    fields:    [
      { key: 'unitName',  label: 'Unit Name',  placeholder: 'e.g. Kilogram, Litre, Piece', required: true },
      { key: 'shortName', label: 'Short Name', placeholder: 'e.g. kg, L, pcs',             required: false },
    ],
    save:      (data) => createUnit({ unitName: data.unitName.trim(), ...(data.shortName?.trim() && { shortName: data.shortName.trim() }) }),
    getList:   getUnits,
    update:    (id, data) => updateUnit(id, { unitName: data.unitName?.trim(), shortName: data.shortName?.trim() || null }),
    delete:    (id) => deleteUnit(id),
    toOption:  (r) => ({ id: r.id, unitName: r.unitName, shortName: r.shortName }),
    label:     (r) => r.unitName + (r.shortName ? ` (${r.shortName})` : ''),
    rowLabel:  (r) => r.unitName + (r.shortName ? ` · ${r.shortName}` : ''),
    editFields: [{ key: 'unitName', placeholder: 'Unit name' }, { key: 'shortName', placeholder: 'Short name' }],
  },
  'Payment Method': {
    title:    'New Payment Method',
    fields:   [{ key: 'name', label: 'Payment Method Name', placeholder: 'e.g. Cash, UPI, Bank Transfer', required: true }],
    save:     (data) => createPaymentMethod({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Expense': {
    title:    'New Expense Type',
    fields:   [{ key: 'name', label: 'Expense Name', placeholder: 'e.g. Rent, Electricity, Salary', required: true }],
    save:     (data) => createExpense({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Customer': {
    title:    'New Customer',
    fields:   [{ key: 'name', label: 'Customer Name', placeholder: 'e.g. John Doe', required: true }],
    save:     (data) => createCustomer({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
  'Supplier': {
    title:    'New Supplier',
    fields:   [{ key: 'name', label: 'Supplier Name', placeholder: 'e.g. ABC Traders', required: true }],
    save:     (data) => createSupplier({ name: data.name.trim() }),
    toOption: (r) => ({ id: r.id, name: r.name }),
    label:    (r) => r.name,
  },
};

const inputCls  = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-all focus:border-rs-text-primary focus:ring-2 focus:ring-rs-text-primary/10 focus:bg-white placeholder:text-rs-text-muted/50';
const labelCls  = 'text-[11px] font-bold uppercase tracking-wider text-rs-text-muted';

const QuickCreateModal = ({ type, onClose, onCreated }) => {
  const config = CONFIGS[type];
  const { clearBranch } = useAuth();
  const navigate = useNavigate();
  const hasList = !!config?.getList;

  const [formData,   setFormData]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [savedLabel, setSavedLabel] = useState('');

  // List state (only for types with getList)
  const [list,       setList]       = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [editData,   setEditData]   = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [editErr,    setEditErr]    = useState('');
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (!hasList) return;
    setLoadingList(true);
    config.getList()
      .then(rows => setList(rows))
      .catch(() => {})
      .finally(() => setLoadingList(false));
  }, [hasList]);

  if (!config) return null;

  const upd = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    for (const f of config.fields) {
      if (f.required && !formData[f.key]?.trim()) { setError(`${f.label} is required`); return; }
    }
    setSaving(true);
    try {
      const result = await config.save(formData);
      const option = config.toOption(result);
      setSavedLabel(config.label(result));
      if (hasList) setList(prev => [...prev, result]);
      setTimeout(() => {
        onCreated(option);
      }, 900);
    } catch (err) {
      const msg = err.message || 'Failed to save';
      if (msg?.includes('BRANCH_INVALID')) { clearBranch(); onClose(); navigate('/select-branch'); }
      else { setError(msg); setSaving(false); }
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditErr('');
    const data = {};
    (config.editFields || []).forEach(f => { data[f.key] = item[f.key] || ''; });
    setEditData(data);
  };

  const saveEdit = async (id) => {
    setEditErr('');
    setSavingEdit(true);
    try {
      const updated = await config.update(id, editData);
      setList(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      setEditingId(null);
    } catch (err) {
      setEditErr(err.message || 'Failed to update');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await config.delete(id);
      setList(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message || 'Cannot delete — item may be in use.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ${hasList ? 'max-w-lg' : 'max-w-sm'}`}>

        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between">
          <h3 className="text-lg font-user-serif font-bold text-rs-text-primary">
            {hasList ? `Manage ${config.title}` : config.title}
          </h3>
          <button type="button" onClick={onClose}
            className="text-rs-text-muted hover:text-rs-text-primary bg-stone-50 hover:bg-stone-100 rounded-lg p-1.5 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[80vh] overflow-y-auto">

          {/* Create Form */}
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
            <form onSubmit={handleSave} className="space-y-3">
              {hasList && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">Add New</p>
              )}
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
              <div className="flex items-center gap-3 pt-1">
                {!hasList && (
                  <button type="button" onClick={onClose}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-rs-text-muted hover:text-rs-text-primary border border-stone-200 rounded-xl hover:border-stone-300 transition-all cursor-pointer active:scale-95">
                    Cancel
                  </button>
                )}
                <button type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-rs-text-primary text-white hover:brightness-110 active:scale-95 transition-all shadow-sm disabled:opacity-60 cursor-pointer">
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          )}

          {/* List with Edit / Delete */}
          {hasList && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted border-t border-stone-100 pt-4">
                Existing ({list.length})
              </p>

              {loadingList ? (
                <p className="text-sm text-rs-text-muted text-center py-4">Loading…</p>
              ) : list.length === 0 ? (
                <p className="text-sm text-rs-text-muted text-center py-4">None created yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {list.map(item => (
                    <div key={item.id} className="flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2 border border-stone-100">
                      {editingId === item.id ? (
                        <>
                          <div className="flex-1 flex gap-2">
                            {(config.editFields || []).map(f => (
                              <input
                                key={f.key}
                                className="flex-1 text-sm bg-white border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-rs-text-primary"
                                placeholder={f.placeholder}
                                value={editData[f.key] || ''}
                                onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                                autoFocus={f.key === (config.editFields[0]?.key)}
                              />
                            ))}
                          </div>
                          {editErr && <span className="text-xs text-red-500">{editErr}</span>}
                          <button type="button" onClick={() => saveEdit(item.id)} disabled={savingEdit}
                            className="text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg p-1.5 transition-all cursor-pointer disabled:opacity-50">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)}
                            className="text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg p-1.5 transition-all cursor-pointer">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium text-rs-text-primary">{config.rowLabel(item)}</span>
                          <button type="button" onClick={() => startEdit(item)}
                            className="text-rs-text-muted hover:text-rs-text-primary bg-white hover:bg-stone-100 rounded-lg p-1.5 transition-all cursor-pointer border border-stone-200">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                            className="text-red-400 hover:text-red-600 bg-white hover:bg-red-50 rounded-lg p-1.5 transition-all cursor-pointer border border-stone-200 disabled:opacity-50">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer close for list modals */}
        {hasList && !savedLabel && (
          <div className="px-6 py-4 border-t border-stone-100 flex justify-end">
            <button type="button" onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-rs-text-muted hover:text-rs-text-primary border border-stone-200 rounded-xl hover:border-stone-300 transition-all cursor-pointer">
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickCreateModal;
