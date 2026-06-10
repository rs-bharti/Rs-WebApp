import { useState } from 'react';
import { Search, X, Trash2, Pencil } from 'lucide-react';

export const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const toDateInput = (d) => (d ? new Date(d).toISOString().split('T')[0] : '');

const VoucherList = ({ title, vouchers = [], columns, editFields, onDelete, onUpdate, loading }) => {
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState(null);  // voucher being viewed
  const [editing,   setEditing]   = useState(false);
  const [editData,  setEditData]  = useState({});
  const [confirm,   setConfirm]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [err,       setErr]       = useState('');

  const q = search.trim().toLowerCase();
  const filtered = q
    ? vouchers.filter(v => JSON.stringify(v).toLowerCase().includes(q))
    : vouchers;

  /* ── open view popup ── */
  const handleView = (v) => {
    setSelected(v);
    setEditing(false);
    setConfirm(false);
    setErr('');
  };

  /* ── open edit form inside the popup ── */
  const startEdit = () => {
    const data = {};
    (editFields || []).forEach(f => {
      data[f.key] = f.type === 'date' ? toDateInput(selected[f.key]) : (selected[f.key] ?? '');
    });
    setEditData(data);
    setEditing(true);
    setErr('');
  };

  /* ── save edit ── */
  const handleSave = async () => {
    setSaving(true); setErr('');
    try {
      await onUpdate(selected.id, editData);
      setSelected(null);
    } catch (e) { setErr(e.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    setDeleting(true); setErr('');
    try {
      await onDelete(selected.id);
      setSelected(null);
    } catch (e) { setErr(e.message || 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const close = () => { setSelected(null); setErr(''); setEditing(false); setConfirm(false); };

  return (
    <>
      {/* ── List ── */}
      <section className="mt-4 bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">
            {title} ({filtered.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg outline-none focus:border-rs-text-primary bg-stone-50 w-44"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-center py-10 text-sm text-rs-text-muted">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-sm text-rs-text-muted">{q ? 'No results.' : 'No entries yet.'}</p>
          ) : (
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-rs-text-muted w-10">#</th>
                  {columns.map(c => (
                    <th key={c.key} className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-rs-text-muted">{c.label}</th>
                  ))}
                  <th className="px-4 py-3 w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr key={v.id} className="border-b border-stone-50 hover:bg-rs-cream/10 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-stone-400">{i + 1}</td>
                    {columns.map(c => (
                      <td key={c.key} className="px-4 py-3 text-sm text-rs-text-primary/80">
                        {c.render ? c.render(v) : (v[c.key] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleView(v)}
                        className="px-3 py-1.5 rounded-lg border border-rs-text-primary/30 text-[10px] font-bold uppercase tracking-widest text-rs-text-primary hover:bg-rs-text-primary hover:text-white hover:border-transparent transition-all cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Popup ── */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={e => e.target === e.currentTarget && close()}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-150">

            {/* popup header */}
            <div className="flex items-center justify-between px-6 py-4 bg-rs-cream/40 border-b border-stone-100">
              <div>
                <p className="text-xs font-bold text-rs-text-muted uppercase tracking-widest">Voucher Details</p>
                <p className="text-base font-bold text-rs-text-primary font-user-serif mt-0.5">{selected.voucherNo}</p>
              </div>
              <button type="button" onClick={close} className="text-stone-400 hover:text-stone-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!editing && !confirm && (
              <>
                {/* data grid */}
                <div className="px-6 py-5 grid grid-cols-2 gap-4">
                  {columns.map(c => (
                    <div key={c.key}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted mb-1">{c.label}</p>
                      <p className="text-sm font-semibold text-rs-text-primary">
                        {c.render ? c.render(selected) : (selected[c.key] ?? '—')}
                      </p>
                    </div>
                  ))}
                </div>
                {/* actions */}
                <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  {editFields && onUpdate && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-rs-text-primary hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── Edit form ── */}
            {editing && (
              <>
                <div className="px-6 py-5 space-y-4">
                  {err && <p className="text-xs text-red-500">{err}</p>}
                  {editFields.map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-rs-text-muted mb-1.5">{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          placeholder={f.placeholder || ''}
                          value={editData[f.key] ?? ''}
                          onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-rs-text-primary bg-stone-50 resize-none"
                        />
                      ) : (
                        <input
                          type={f.type}
                          placeholder={f.placeholder || ''}
                          step={f.type === 'number' ? '0.01' : undefined}
                          min={f.type === 'number' ? '0' : undefined}
                          value={editData[f.key] ?? ''}
                          onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-rs-text-primary bg-stone-50"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                    Cancel
                  </button>
                  <button type="button" onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-rs-text-primary hover:brightness-110 disabled:opacity-60 cursor-pointer">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* ── Delete confirm ── */}
            {confirm && (
              <>
                <div className="px-6 py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-3">
                    <Trash2 className="w-5 h-5 text-red-500" />
                  </div>
                  <p className="text-sm font-bold text-stone-800">Delete this voucher?</p>
                  <p className="text-xs text-stone-500">
                    <span className="font-semibold">"{selected.voucherNo}"</span> will be permanently deleted.
                  </p>
                  {err && <p className="text-xs text-red-500 pt-1">{err}</p>}
                </div>
                <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3">
                  <button type="button" onClick={() => setConfirm(false)} className="px-4 py-2 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                    Cancel
                  </button>
                  <button type="button" onClick={handleDelete} disabled={deleting} className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 cursor-pointer">
                    {deleting ? 'Deleting…' : 'Yes, Delete'}
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default VoucherList;
