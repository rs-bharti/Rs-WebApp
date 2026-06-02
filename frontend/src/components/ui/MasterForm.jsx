import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, PlusCircle, Trash2, CheckCircle, XCircle } from 'lucide-react';
import {
  getCountries, getStates, getCities, getAreas,
  getCategories, getUnits,
  createCountry, createState, createCity, createArea,
  createBranch, createCategory, createUnit,
  createSupplier, createCustomer, createProduct,
} from '../../api/masters';

const MasterForm = ({ type = 'Customer', userRole = 'admin' }) => {
  const isDetailed = type === 'Supplier';
  const isCustomer = type === 'Customer';
  const isProduct  = type === 'Product';
  const isBranch   = type === 'Branch' || type === 'Branches';
  const isUnit     = type === 'Unit';
  const isAdmin    = userRole === 'admin';

  // ── Form state ───────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const f   = (field) => formData[field] ?? '';
  const upd = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  // ── Contacts ──────────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState([{ id: 1, name: '', phone: '', designation: '', dob: '' }]);
  const addContact    = () => setContacts(prev => [...prev, { id: Date.now(), name: '', phone: '', designation: '', dob: '' }]);
  const removeContact = (id) => setContacts(prev => prev.filter(c => c.id !== id));
  const updContact    = (id, field, val) => setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));

  // ── Location dropdowns ────────────────────────────────────────────────────────
  const [countries,  setCountries]  = useState([]);
  const [states,     setStates]     = useState([]);
  const [cities,     setCities]     = useState([]);
  const [areas,      setAreas]      = useState([]);
  const [selCountry, setSelCountry] = useState('');
  const [selState,   setSelState]   = useState('');
  const [selCity,    setSelCity]    = useState('');
  const [selArea,    setSelArea]    = useState('');

  // ── Product dropdowns ─────────────────────────────────────────────────────────
  const [categories,  setCategories]  = useState([]);
  const [units,       setUnits]       = useState([]);
  const [selCategory, setSelCategory] = useState('');
  const [selUnit,     setSelUnit]     = useState('');

  // ── Simple master parent (State→Country, City→State, Area→City) ───────────────
  const [parentOptions, setParentOptions] = useState([]);
  const [selParent,     setSelParent]     = useState('');

  // ── Clear only field data (keeps success/error) ───────────────────────────────
  const clearFields = () => {
    setFormData({});
    setSelCountry(''); setSelState(''); setSelCity(''); setSelArea('');
    setSelCategory(''); setSelUnit('');
    setSelParent('');
    setContacts([{ id: 1, name: '', phone: '', designation: '', dob: '' }]);
  };

  // ── Full reset (including messages) ──────────────────────────────────────────
  const resetForm = () => { clearFields(); setError(''); setSuccess(''); };

  // ── Reset when type changes ───────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetForm(); }, [type]);

  // ── Load dropdown data ────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        if (isCustomer || isDetailed || isBranch) setCountries(await getCountries());
        if (isProduct) {
          const [cats, us] = await Promise.all([getCategories(), getUnits()]);
          setCategories(cats); setUnits(us);
        }
        if (type === 'State') setParentOptions(await getCountries());
        if (type === 'City')  setParentOptions(await getStates());
        if (type === 'Area')  setParentOptions(await getCities());
      } catch (err) { console.error('Failed to load dropdown data:', err); }
    };
    load();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Cascading: country → states ───────────────────────────────────────────────
  useEffect(() => {
    if (!selCountry) { setStates([]); setSelState(''); setCities([]); setSelCity(''); setAreas([]); setSelArea(''); return; }
    getStates(selCountry).then(setStates).catch(console.error);
    setSelState(''); setCities([]); setSelCity(''); setAreas([]); setSelArea('');
  }, [selCountry]);

  // ── Cascading: state → cities ─────────────────────────────────────────────────
  useEffect(() => {
    if (!selState) { setCities([]); setSelCity(''); setAreas([]); setSelArea(''); return; }
    getCities(selState).then(setCities).catch(console.error);
    setSelCity(''); setAreas([]); setSelArea('');
  }, [selState]);

  // ── Cascading: city → areas ───────────────────────────────────────────────────
  useEffect(() => {
    if (!selCity) { setAreas([]); setSelArea(''); return; }
    getAreas(selCity).then(setAreas).catch(console.error);
    setSelArea('');
  }, [selCity]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      if (type === 'Country') {
        await createCountry({ name: f('name') });
      } else if (type === 'State') {
        await createState({ name: f('name'), countryId: selParent });
      } else if (type === 'City') {
        await createCity({ name: f('name'), stateId: selParent });
      } else if (type === 'Area') {
        await createArea({ name: f('name'), cityId: selParent });
      } else if (type === 'Category') {
        await createCategory({ name: f('name') });
      } else if (isUnit) {
        await createUnit({
          unitName: f('unitName'),
          ...(f('shortName') && { shortName: f('shortName') }),
        });
      } else if (isBranch) {
        await createBranch({
          name: f('name'),
          countryId: selCountry,
          stateId:   selState,
          cityId:    selCity,
          ...(selArea      && { areaId:   selArea }),
          ...(f('address') && { address:  f('address') }),
        });
      } else if (isDetailed) {
        await createSupplier({
          name:      f('name'),
          countryId: selCountry,
          stateId:   selState,
          cityId:    selCity,
          ...(selArea      && { areaId:  selArea }),
          ...(f('address') && { address: f('address') }),
          ...(f('phone')   && { phone:   f('phone') }),
          ...(f('email')   && { email:   f('email') }),
          ...(f('gstNo')   && { gstNo:   f('gstNo') }),
        });
      } else if (isCustomer) {
        await createCustomer({
          name:      f('name'),
          countryId: selCountry,
          stateId:   selState,
          cityId:    selCity,
          ...(selArea      && { areaId:  selArea }),
          ...(f('address') && { address: f('address') }),
          ...(f('phone')   && { phone:   f('phone') }),
          ...(f('email')   && { email:   f('email') }),
          ...(f('gstNo')   && { gstNo:   f('gstNo') }),
        });
      } else if (isProduct) {
        await createProduct({
          name:          f('name'),
          categoryId:    selCategory,
          unitId:        selUnit,
          purchasePrice: f('purchasePrice'),
          sellingPrice:  f('sellingPrice'),
          ...(f('barcode') && { barcode: f('barcode') }),
        });
      }

      clearFields();
      setSuccess(`${type === 'Branches' ? 'Branch' : type} saved successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Shared CSS ────────────────────────────────────────────────────────────────
  const inputCls = cn(
    'w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary placeholder:text-brand-primary/40'
      : 'border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary placeholder:text-rs-text-primary/40'
  );
  const selectCls = cn(
    'w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none appearance-none cursor-pointer',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 text-brand-primary'
      : 'border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary'
  );
  const labelCls = cn('block text-sm font-semibold mb-2', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary');

  // ── Reusable select helper (called as function, not component) ────────────────
  const mkSelect = (label, value, onChange, options, opts = {}) => (
    <div className="space-y-2">
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <select className={selectCls} value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">{opts.placeholder || `Select ${label.replace(' *', '')}`}</option>
          {options.map(o => (
            <option key={o.id} value={o.id}>
              {opts.displayName ? opts.displayName(o) : o.name}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      </div>
    </div>
  );

  // ── Location row (Country → State → City → Area) ──────────────────────────────
  const locationRows = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {mkSelect('Country *', selCountry, setSelCountry, countries)}
      {mkSelect('State *',   selState,   setSelState,   states)}
      {mkSelect('City *',    selCity,    setSelCity,    cities)}
      {mkSelect('Area',      selArea,    setSelArea,    areas)}
    </div>
  );

  // ── Contact persons table ─────────────────────────────────────────────────────
  const contactsTable = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2">
        <h3 className={cn('text-xl font-bold', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary')}>Contact Persons</h3>
        <button type="button" onClick={addContact} className={cn('flex items-center text-xs font-bold uppercase tracking-wider transition-colors', isAdmin ? 'text-brand-primary hover:text-brand-primary/80' : 'text-rs-text-primary hover:text-rs-text-primary/80')}>
          <PlusCircle className="w-4 h-4 mr-2" />Add Contact
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn('border-b', isAdmin ? 'border-brand-bg bg-brand-bg/10' : 'border-rs-accent-bg bg-rs-cream/20')}>
              {['Name', 'Phone Number', 'Designation', 'Date of Birth', ''].map(h => (
                <th key={h} className={cn('p-4 text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className={cn('border-b transition-colors', isAdmin ? 'border-brand-bg/50 hover:bg-brand-bg/5' : 'border-rs-accent-bg/50 hover:bg-rs-cream/10')}>
                <td className="p-2"><input type="text" value={c.name} onChange={(e) => updContact(c.id, 'name', e.target.value)} placeholder="Full Name" className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm transition-colors" /></td>
                <td className="p-2"><input type="tel" value={c.phone} onChange={(e) => updContact(c.id, 'phone', e.target.value)} placeholder="+91 ..." className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm transition-colors" /></td>
                <td className="p-2">
                  <select value={c.designation} onChange={(e) => updContact(c.id, 'designation', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm cursor-pointer">
                    <option value="">Select</option>
                    {['Manager', 'Owner', 'Sales Head', 'Procurement Head', 'Sales Boy', 'President', 'CEO'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="text"
                    onFocus={(e) => { e.target.type = 'date'; }}
                    onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                    value={c.dob}
                    onChange={(e) => updContact(c.id, 'dob', e.target.value)}
                    placeholder="dd-mm-yyyy"
                    className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm text-stone-500"
                  />
                </td>
                <td className="p-2 text-center">
                  <button type="button" onClick={() => removeContact(c.id)} className="text-red-500 hover:text-red-600 transition-colors p-2"><Trash2 className="w-4 h-4 mx-auto" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ── Render fields per type ────────────────────────────────────────────────────
  const renderFields = () => {

    // Customer
    if (isCustomer) return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className={labelCls}>Customer Name <span className="text-red-400">*</span></label>
            <input className={inputCls} type="text" placeholder="Enter customer full name" value={f('name')} onChange={upd('name')} required />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Phone</label>
            <input className={inputCls} type="tel" placeholder="+91 ..." value={f('phone')} onChange={upd('phone')} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className={labelCls}>Email</label>
            <input className={inputCls} type="email" placeholder="customer@email.com" value={f('email')} onChange={upd('email')} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>GST No</label>
            <input className={inputCls} type="text" placeholder="Enter GST number" value={f('gstNo')} onChange={upd('gstNo')} />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Address</label>
            <input className={inputCls} type="text" placeholder="Full postal address" value={f('address')} onChange={upd('address')} />
          </div>
        </div>
        {locationRows()}
        {contactsTable()}
      </div>
    );

    // Supplier
    if (isDetailed) return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className={labelCls}>Name <span className="text-red-400">*</span></label>
              <input className={inputCls} type="text" placeholder="Enter supplier full name" value={f('name')} onChange={upd('name')} required />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Address</label>
              <textarea className={cn(inputCls, 'resize-none')} placeholder="Enter full postal address" rows={3} value={f('address')} onChange={upd('address')} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
            <div className="space-y-2">
              <label className={labelCls}>Phone</label>
              <input className={inputCls} type="tel" placeholder="+91 ..." value={f('phone')} onChange={upd('phone')} />
            </div>
            <div className="space-y-2">
              <label className={labelCls}>Email</label>
              <input className={inputCls} type="email" placeholder="supplier@email.com" value={f('email')} onChange={upd('email')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className={labelCls}>GST No</label>
              <input className={inputCls} type="text" placeholder="Enter GST number" value={f('gstNo')} onChange={upd('gstNo')} />
            </div>
          </div>
        </div>
        {locationRows()}
        {contactsTable()}
      </div>
    );

    // Product
    if (isProduct) return (
      <div className="space-y-8 max-w-5xl">
        <div className="space-y-2">
          <label className={labelCls}>Product Name <span className="text-red-400">*</span></label>
          <input className={inputCls} type="text" placeholder="Enter product name" value={f('name')} onChange={upd('name')} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {mkSelect('Category *', selCategory, setSelCategory, categories)}
          {mkSelect('Unit *', selUnit, setSelUnit, units, {
            displayName: u => `${u.unitName}${u.shortName ? ` (${u.shortName})` : ''}`,
          })}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className={labelCls}>Purchase Price <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₹</span>
              <input className={cn(inputCls, 'pl-10')} type="number" placeholder="0.00" min="0" step="0.01" value={f('purchasePrice')} onChange={upd('purchasePrice')} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Selling Price <span className="text-red-400">*</span></label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₹</span>
              <input className={cn(inputCls, 'pl-10')} type="number" placeholder="0.00" min="0" step="0.01" value={f('sellingPrice')} onChange={upd('sellingPrice')} required />
            </div>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Barcode</label>
            <input className={inputCls} type="text" placeholder="Scan or enter barcode" value={f('barcode')} onChange={upd('barcode')} />
          </div>
        </div>
      </div>
    );

    // Branch
    if (isBranch) return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className={labelCls}>Branch Name <span className="text-red-400">*</span></label>
            <input className={inputCls} type="text" placeholder="Enter branch name" value={f('name')} onChange={upd('name')} required />
          </div>
          {mkSelect('Country *', selCountry, setSelCountry, countries)}
          {mkSelect('State *',   selState,   setSelState,   states)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mkSelect('City *', selCity, setSelCity, cities)}
          {mkSelect('Area',   selArea, setSelArea, areas)}
          <div className="space-y-2">
            <label className={labelCls}>Currency Type</label>
            <div className="relative">
              <select className={selectCls} value={f('currency')} onChange={upd('currency')}>
                <option value="">Select Currency</option>
                {[['INR','Indian Rupee'],['USD','US Dollar'],['EUR','Euro'],['GBP','British Pound'],['AED','UAE Dirham']].map(([code, name]) => (
                  <option key={code} value={code}>{code} — {name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="space-y-2 max-w-2xl">
          <label className={labelCls}>Address</label>
          <textarea className={cn(inputCls, 'resize-none h-[80px]')} placeholder="Enter branch address" value={f('address')} onChange={upd('address')} />
        </div>
      </div>
    );

    // Unit (two fields: unitName + shortName)
    if (isUnit) return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2">
          <label className={labelCls}>Unit Name <span className="text-red-400">*</span></label>
          <input className={inputCls} type="text" placeholder="e.g. Kilogram, Litre" value={f('unitName')} onChange={upd('unitName')} required />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Short Name</label>
          <input className={inputCls} type="text" placeholder="e.g. kg, ltr, pcs" value={f('shortName')} onChange={upd('shortName')} />
        </div>
      </div>
    );

    // Simple masters: Country, State, City, Area, Category
    const parentLabel = { State: 'Country', City: 'State', Area: 'City' }[type];
    const nameLabel   = type === 'Category' ? 'Category Name' : `${type} Name`;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2">
          <label className={labelCls}>{nameLabel} <span className="text-red-400">*</span></label>
          <input className={inputCls} type="text" placeholder={`Enter ${type.toLowerCase()} name`} value={f('name')} onChange={upd('name')} required />
        </div>
        {parentLabel && (
          <div className="space-y-2">
            <label className={labelCls}>{parentLabel} Name <span className="text-red-400">*</span></label>
            <div className="relative">
              <select className={selectCls} value={selParent} onChange={(e) => setSelParent(e.target.value)} required>
                <option value="">Select {parentLabel}</option>
                {parentOptions.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    );
  };

  const displayType  = type === 'Branches' ? 'Branch' : type;
  const formTitle    = isCustomer ? 'Customer Details' : `${displayType} ${isBranch ? 'Details' : 'Master'}`;

  return (
    <section className={cn(
      'rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500',
      isAdmin ? 'bg-white border-brand-bg' : 'bg-white border-stone-100'
    )}>
      {/* Header */}
      <div className={cn(
        'px-8 py-6 border-b flex justify-between items-center',
        isAdmin ? 'border-brand-bg' : 'border-stone-100',
        isProduct && 'bg-[#FDFCFB]'
      )}>
        <h2 className={cn(
          'text-2xl font-bold',
          isAdmin
            ? (isProduct ? 'font-product-serif text-brand-primary' : 'font-admin-serif text-brand-primary')
            : 'font-user-serif text-rs-text-primary'
        )}>
          {formTitle}
        </h2>
        <span className={cn('text-[10px] font-bold uppercase tracking-widest opacity-60', isAdmin ? 'text-brand-primary' : 'text-rs-text-muted')}>
          Form ID: {type.substring(0, 2).toUpperCase()}-{String(Math.floor(Math.random() * 9000) + 1000)}
        </span>
      </div>

      <form className="p-8 space-y-12" onSubmit={handleSubmit}>
        {/* Feedback banners */}
        {error && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {success}
          </div>
        )}

        <div className="min-h-[250px]">
          {renderFields()}
        </div>

        <div className={cn('flex justify-end items-center gap-8 pt-8 border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
          <button
            type="button"
            onClick={resetForm}
            className={cn('text-sm font-semibold', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}
          >
            Discard
          </button>
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'px-10 py-3 rounded-lg font-bold text-sm shadow-md transition-opacity',
              saving && 'opacity-60 cursor-not-allowed',
              isAdmin ? 'bg-brand-primary text-ivory' : 'bg-rs-text-primary text-white'
            )}
          >
            {saving ? 'Saving…' : `Save ${displayType}`}
          </button>
        </div>
      </form>
    </section>
  );
};

export default MasterForm;
