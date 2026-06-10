import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Pencil, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getCategories,    createCategory,    deleteCategory,    updateCategory,
  getUnits,         createUnit,        deleteUnit,        updateUnit,
  getPaymentMethods, createPaymentMethod, deletePaymentMethod, updatePaymentMethod,
} from '../../api/masters';

const CONFIGS = {
  'Category': {
    title: 'Category',
    fields: [
      { key: 'name', label: 'Category Name', placeholder: 'e.g. Electronics, Clothing', required: true },
    ],
    getAll:    () => getCategories(),
    save:      (data) => createCategory({ name: data.name.trim() }),
    remove:    (id) => deleteCategory(id),
    edit:      (id, data) => updateCategory(id, { name: data.name.trim() }),
    toOption:  (r) => ({ id: r.id, name: r.name }),
    label:     (r) => r.name,
    editFields: [{ key: 'name', placeholder: 'Category name' }],
    editInit:  (r) => ({ name: r.name }),
  },
  'Unit': {
    title: 'Unit',
    fields: [
      { key: 'unitName',  label: 'Unit Name',  placeholder: 'e.g. Kilogram, Litre, Piece', required: true },
      { key: 'shortName', label: 'Short Name', placeholder: 'e.g. kg, L, pcs',             required: false },
    ],
    getAll:    () => getUnits(),
    save:      (data) => createUnit({ unitName: data.unitName.trim(), ...(data.shortName?.trim() && { shortName: data.shortName.trim() }) }),
    remove:    (id) => deleteUnit(id),
    edit:      (id, data) => updateUnit(id, { unitName: data.unitName.trim(), shortName: data.shortName?.trim() || undefined }),
    toOption:  (r) => ({ id: r.id, unitName: r.unitName, shortName: r.shortName }),
    label:     (r) => r.unitName + (r.shortName ? ` (${r.shortName})` : ''),
    editFields: [
      { key: 'unitName',  placeholder: 'Unit name' },
      { key: 'shortName', placeholder: 'Short name' },
    ],
    editInit:  (r) => ({ unitName: r.unitName, shortName: r.shortName || '' }),
  },
  'Payment Method': {
    title: 'Payment Method',
    fields: [
      { key: 'name', label: 'Payment Method Name', placeholder: 'e.g. Cash, UPI, Bank Transfer', required: true },
    ],
    getAll:    () => getPaymentMethods(),
    save:      (data) => createPaymentMethod({ name: data.name.trim() }),
    remove:    (id) => deletePaymentMethod(id),
    edit:      (id, data) => updatePaymentMethod(id, { name: data.name.trim() }),
    toOption:  (r) => ({ id: r.id, name: r.name }),
    label:     (r) => r.name,
    editFields: [{ key: 'name', placeholder: 'Payment method name' }],
    editInit:  (r) => ({ name: r.name }),
  },
};

const inputCls = 'w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-all focus:border-rs-text-primary focus:ring-2 focus:ring-rs-text-primary/10 focus:bg-white placeholder:text-rs-text-muted/50';
const labelCls = 'text-[11px] font-bold uppercase tracking-wider text-rs-text-muted';
const inlineCls = 'flex-1 min-w-0 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-rs-text-primary focus:ring-1 focus:ring-rs-text-primary/10 transition-all';

const QuickCreateModal = ({ type, onClose, onCreated }) => {
  const config = CONFIGS[type];
  const { clearBranch } = useAuth();
  const navigate = useNavigate();

  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [formData,   setFormData]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingId,  setEditingId]  = useState(null);
  const [editData,   setEditData]   = useState({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [showForm,   setShowForm]   = useState(false);

  const handleBranchInvalid = (msg) => {
    if (msg?.includes('BRANCH_INVALID')) {
      clearBranch();
      onClose();
      navigate('/select-branch');
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (!config) return;
    config.getAll()
      .then(rows => { setItems(rows); setLoading(false); })
      .catch(err => { setError(err?.message || 'Failed to load'); setLoading(false); });
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setItems(prev => [result, ...prev]);
      setFormData({});
      setShowForm(false);
      onCreated(option);
    } catch (err) {
      const msg = err.message || 'Failed to save';
      if (!handleBranchInvalid(msg)) setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const label = config.label(item);
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await config.remove(item.id);
      setItems(prev => prev.filter(r => r.id !== item.id));
    } catch (err) {
      const msg = err.message || 'Failed to delete';
      if (!handleBranchInvalid(msg)) setError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData(config.editInit(item));
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const handleEdit = async (item) => {
    setSavingEdit(true);
    try {
      const updated = await config.edit(item.id, editData);
      setItems(prev => prev.map(r => r.id === item.id ? { ...r, ...updated } : r));
      setEditingId(null);
    } catch (err) {
      const msg = err.message || 'Failed to update';
      if (!handleBranchInvalid(msg)) setError(msg);
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-lg font-user-serif font-bold text-rs-text-primary">{config.title} Master</h3>
            <p className="text-[10px] uppercase tracking-widest text-rs-text-muted mt-0.5">
              {items.length} {type.toLowerCase()}{items.length !== 1 ? 's' : ''} saved
            </p>
          </div>
          <button type="button" onClick={onClose}
            className="text-rs-text-muted hover:text-rs-text-primary bg-stone-50 hover:bg-stone-100 rounded-lg p-1.5 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Existing items list */}
          <div className="px-6 pt-4 pb-2">
            {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mb-3">{error}</p>}

            {loading ? (
              <p className="text-sm text-rs-text-muted text-center py-6">Loading…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-rs-text-muted text-center py-6 italic">No {type.toLowerCase()}s added yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {items.map(item => (
                  <li key={item.id}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-stone-100 bg-stone-50 hover:bg-rs-cream/30 transition-colors group">

                    {editingId === item.id ? (
                      <>
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                          {config.editFields.map(ef => (
                            <input
                              key={ef.key}
                              className={inlineCls}
                              value={editData[ef.key] || ''}
                              placeholder={ef.placeholder}
                              onChange={e => setEditData(p => ({ ...p, [ef.key]: e.target.value }))}
                              autoFocus={config.editFields[0].key === ef.key}
                            />
                          ))}
                        </div>
                        <button type="button" onClick={() => handleEdit(item)} disabled={savingEdit}
                          className="p-1.5 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer">
                          <Check className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={cancelEdit}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-all flex-shrink-0 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm font-medium text-rs-text-primary truncate">
                          {config.label(item)}
                        </span>
                        <button type="button" onClick={() => startEdit(item)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-stone-400 hover:text-rs-text-primary hover:bg-stone-100 transition-all flex-shrink-0 cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" onClick={() => handleDelete(item)} disabled={deletingId === item.id}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add New — toggle */}
          <div className="px-6 pb-6 pt-3">
            {!showForm ? (
              <button type="button" onClick={() => { setShowForm(true); setError(''); setFormData({}); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-stone-200 text-rs-text-muted hover:border-rs-text-primary hover:text-rs-text-primary hover:bg-rs-cream/20 transition-all cursor-pointer text-sm font-semibold">
                <Plus className="w-4 h-4" />
                Add New {type}
              </button>
            ) : (
              <form onSubmit={handleSave} className="space-y-4 border border-stone-200 rounded-xl p-4 bg-rs-cream/10">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rs-text-muted">New {type}</p>

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

                <div className="flex items-center gap-2 pt-1">
                  <button type="button" onClick={() => { setShowForm(false); setError(''); setFormData({}); }}
                    className="flex-1 px-4 py-2.5 text-sm font-semibold text-rs-text-muted hover:text-rs-text-primary border border-stone-200 rounded-xl hover:border-stone-300 transition-all cursor-pointer active:scale-95">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving}
                    className="flex-1 px-4 py-2.5 rounded-xl font-bold text-sm bg-rs-text-primary text-white hover:brightness-110 active:scale-95 transition-all shadow-sm disabled:opacity-60 cursor-pointer">
                    {saving ? 'Saving…' : `Save ${type}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex-shrink-0">
          <button type="button" onClick={onClose}
            className="w-full px-4 py-2.5 rounded-xl font-semibold text-sm text-rs-text-muted hover:text-rs-text-primary border border-stone-200 hover:border-stone-300 transition-all cursor-pointer active:scale-95">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickCreateModal;
