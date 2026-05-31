import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';

const WarehouseMaster = ({ userRole = 'admin' }) => {
  const isAdmin = userRole === 'admin';

  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState({ name: '', address: '', area: '', city: '' });
  const [formId] = useState((Math.random() * 9999).toFixed(0));

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setWarehouses(prev => [...prev, { id: Date.now(), ...form }]);
    setForm({ name: '', address: '', area: '', city: '' });
  };

  const handleDelete = (id) => {
    setWarehouses(prev => prev.filter(w => w.id !== id));
  };

  const inputClass = cn(
    'w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary'
      : 'border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary'
  );

  const labelClass = cn(
    'block text-sm font-semibold mb-2',
    isAdmin ? 'text-brand-primary' : 'text-rs-text-primary'
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

      {/* Create Form */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className={labelClass}>Warehouse Name</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Enter warehouse name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 lg:col-span-2">
            <label className={labelClass}>Address</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Enter full address"
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>City</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Enter city"
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Area</label>
            <input
              className={inputClass}
              type="text"
              placeholder="Enter area"
              value={form.area}
              onChange={(e) => handleChange('area', e.target.value)}
            />
          </div>
        </div>

        <div className={cn('flex justify-end items-center gap-8 pt-4 border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
          <button
            type="button"
            onClick={() => setForm({ name: '', address: '', area: '', city: '' })}
            className={cn('text-sm font-semibold', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}
          >
            Clear
          </button>
          <button
            type="submit"
            className={cn('flex items-center gap-2 px-8 py-3 rounded-lg font-bold text-sm shadow-md', isAdmin ? 'bg-brand-primary text-ivory' : 'bg-rs-text-primary text-white')}
          >
            <PlusCircle className="w-4 h-4" />
            Add Warehouse
          </button>
        </div>
      </form>

      {/* Warehouses List */}
      <div className={cn('border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
        <div className="px-8 py-4">
          <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
            Warehouses List
          </h3>
        </div>

        <div className="px-8 pb-8">
          {warehouses.length === 0 ? (
            <p className={cn('text-center py-12 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              No warehouses added yet. Use the form above to create one.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn('border-b', isAdmin ? 'border-brand-bg bg-brand-bg/10' : 'border-rs-accent-bg bg-rs-cream/20')}>
                    {['#', 'Name', 'Address', 'Area', 'City', 'Action'].map((h) => (
                      <th key={h} className={cn('p-4 text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {warehouses.map((w, i) => (
                    <tr key={w.id} className={cn('border-b transition-colors', isAdmin ? 'border-brand-bg/50 hover:bg-brand-bg/5' : 'border-rs-accent-bg/50 hover:bg-rs-cream/10')}>
                      <td className={cn('p-4 text-sm font-bold w-12', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{i + 1}</td>
                      <td className={cn('p-4 text-sm font-semibold', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary')}>{w.name}</td>
                      <td className={cn('p-4 text-sm', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-primary/70')}>{w.address || '—'}</td>
                      <td className={cn('p-4 text-sm', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-primary/70')}>{w.area || '—'}</td>
                      <td className={cn('p-4 text-sm', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-primary/70')}>{w.city || '—'}</td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleDelete(w.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
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
