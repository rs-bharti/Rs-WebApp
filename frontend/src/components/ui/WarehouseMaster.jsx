import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, PlusCircle, Trash2 } from 'lucide-react';
import {
  getCountries, getStates, getCities,
  getWarehouses, createWarehouse, deleteWarehouse,
} from '../../api/masters';
import { useAuth } from '../../context/AuthContext';

const WarehouseMaster = ({ userRole = 'admin' }) => {
  const isAdmin = userRole === 'admin';
  const { activeBranch } = useAuth();

  const [warehouses, setWarehouses] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  const [form, setForm] = useState({ name: '', address: '', area: '' });
  const [formId] = useState(String(Math.floor(Math.random() * 9000) + 1000));

  // Location dropdowns — country/state only for cascading to city; area is free text
  const [countries,  setCountries]  = useState([]);
  const [states,     setStates]     = useState([]);
  const [cities,     setCities]     = useState([]);
  const [selCountry, setSelCountry] = useState('');
  const [selState,   setSelState]   = useState('');
  const [selCity,    setSelCity]    = useState('');

  useEffect(() => {
    getCountries().then(setCountries).catch(console.error);
    getWarehouses()
      .then(setWarehouses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Cascading: country → states
  useEffect(() => {
    if (!selCountry) { setStates([]); setSelState(''); setCities([]); setSelCity(''); return; }
    getStates(selCountry).then(setStates).catch(console.error);
    setSelState(''); setCities([]); setSelCity('');
  }, [selCountry]);

  // Cascading: state → cities
  useEffect(() => {
    if (!selState) { setCities([]); setSelCity(''); return; }
    getCities({ stateId: selState }).then(setCities).catch(console.error);
    setSelCity('');
  }, [selState]);

  const clearForm = () => {
    setForm({ name: '', address: '', area: '' });
    setSelCountry(''); setSelState(''); setSelCity('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError(''); setSaving(true);
    try {
      const created = await createWarehouse({
        name:    form.name.trim(),
        address: form.address.trim() || undefined,
        area:    form.area.trim()    || undefined,
        cityId:  selCity             || undefined,
      });
      setWarehouses(prev => [created, ...prev]);
      clearForm();
    } catch (err) {
      setError(err.message || 'Failed to save warehouse.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteWarehouse(id);
      setWarehouses(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete warehouse.');
    }
  };

  const inputCls = cn(
    'w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary placeholder:text-brand-primary/40'
      : 'border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary placeholder:text-rs-text-primary/40'
  );
  const selectCls = cn(
    'w-full rounded-lg border px-4 py-3 text-sm appearance-none cursor-pointer outline-none transition-all',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 text-brand-primary'
      : 'border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary'
  );
  const labelCls = cn('block text-sm font-semibold mb-2', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary');

  const mkSelect = (label, value, onChange, options) => (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select {label}</option>
          {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <section className={cn(
      'rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500',
      isAdmin ? 'bg-white border-brand-bg' : 'bg-white border-stone-100'
    )}>
      {/* Header */}
      <div className={cn('px-8 py-6 border-b flex justify-between items-center', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
        <h2 className={cn('text-2xl font-bold', isAdmin ? 'font-admin-serif text-brand-primary' : 'font-user-serif text-rs-text-primary')}>
          Warehouse Master
        </h2>
        <span className={cn('text-[10px] font-bold uppercase tracking-widest opacity-60', isAdmin ? 'text-brand-primary' : 'text-rs-text-muted')}>
          Form ID: WH-{formId}
        </span>
      </div>

      {/* Create form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {activeBranch && (
          <div className={cn(
            'flex items-center gap-3 px-4 py-2 rounded-lg border max-w-xs',
            isAdmin ? 'bg-brand-bg/10 border-brand-bg' : 'bg-stone-50 border-stone-100'
          )}>
            <span className={cn('text-[10px] uppercase font-bold tracking-widest', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}>Branch</span>
            <span className={cn('text-sm font-semibold', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary')}>{activeBranch.name}</span>
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {/* Row 1: Name, Address, Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className={labelCls}>Warehouse Name <span className="text-red-400">*</span></label>
            <input className={inputCls} type="text" placeholder="Enter warehouse name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Address</label>
            <input className={inputCls} type="text" placeholder="Enter full address" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Area / Locality</label>
            <input className={inputCls} type="text" placeholder="e.g. Andheri, Sector 12" value={form.area} onChange={(e) => setForm(p => ({ ...p, area: e.target.value }))} />
          </div>
        </div>

        {/* Row 2: Country → State → City */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {mkSelect('Country', selCountry, setSelCountry, countries)}
          {mkSelect('State',   selState,   setSelState,   states)}
          {mkSelect('City',    selCity,    setSelCity,    cities)}
        </div>

        <div className={cn('flex justify-end items-center gap-8 pt-4 border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
          <button
            type="button"
            onClick={clearForm}
            className={cn('text-sm font-semibold', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm shadow-md transition-opacity',
              saving && 'opacity-60 cursor-not-allowed',
              isAdmin ? 'bg-brand-primary text-ivory' : 'bg-rs-text-primary text-white'
            )}
          >
            <PlusCircle className="w-4 h-4" />
            {saving ? 'Saving…' : 'Add Warehouse'}
          </button>
        </div>
      </form>

      {/* Warehouses list */}
      <div className={cn('border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
        <div className="px-8 py-4">
          <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
            Warehouses List
          </h3>
        </div>
        <div className="px-8 pb-8">
          {loading ? (
            <p className={cn('text-center py-12 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading warehouses…</p>
          ) : warehouses.length === 0 ? (
            <p className={cn('text-center py-12 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              No warehouses added yet. Use the form above to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn('border-b', isAdmin ? 'border-brand-bg bg-brand-bg/10' : 'border-rs-accent-bg bg-rs-cream/20')}>
                    {['#', 'Name', 'Area', 'Address', 'Action'].map(h => (
                      <th key={h} className={cn('p-4 text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w, i) => (
                    <tr key={w.id} className={cn('border-b transition-colors', isAdmin ? 'border-brand-bg/50 hover:bg-brand-bg/5' : 'border-rs-accent-bg/50 hover:bg-rs-cream/10')}>
                      <td className={cn('p-4 text-sm font-bold w-12', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{i + 1}</td>
                      <td className={cn('p-4 text-sm font-semibold', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary')}>{w.name}</td>
                      <td className={cn('p-4 text-sm', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-primary/70')}>{w.area || '—'}</td>
                      <td className={cn('p-4 text-sm', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-primary/70')}>{w.address || '—'}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default WarehouseMaster;
