import { useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, PlusCircle, Trash2, CheckCircle, XCircle, Users2, Building2 } from 'lucide-react';
import {
  getCountries, getStates, getCities,
  getCategories, getUnits,
  getMasterBranches,
  getSuppliers, getCustomers, getProducts,
  getPaymentMethods,
  getWarehouses, createWarehouse, deleteWarehouse,
  createBranch, createCategory, createUnit,
  createSupplier, createCustomer, createProduct,
  createPaymentMethod,
} from '../../api/masters';

// Phone number max digits by country code
const PHONE_MAX_LENGTHS = {
  '91': 10, '1': 10, '44': 10, '61': 9, '86': 11,
  '33': 9,  '49': 12, '81': 11, '55': 11, '7': 11,
  '34': 9,  '39': 10, '92': 10, '880': 10, '65': 8,
  '60': 9,  '66': 9,  '62': 12, '63': 10, '84': 10,
};
const phoneMaxLength = (prefix) => {
  const code = (prefix || '').replace('+', '').trim();
  return PHONE_MAX_LENGTHS[code] || 15;
};

// ── Searchable Select ─────────────────────────────────────────────────────────
const SearchableSelect = ({ value, onChange, options, placeholder, disabled, displayFn }) => {
  const [search, setSearch] = useState('');
  const [open,   setOpen]   = useState(false);
  const ref                 = useRef(null);

  const display  = displayFn || (o => o.name);
  const selected = options.find(o => String(o.id) === String(value));

  const filtered = options
    .filter(o => display(o).toLowerCase().includes(search.toLowerCase()))
    .slice(0, 60);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        className={cn(
          'w-full rounded-lg border px-4 py-3 pr-9 text-sm outline-none transition-all',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-200'
            : 'cursor-pointer border-stone-200 bg-white focus:border-brand-primary'
        )}
        placeholder={open ? 'Type to search…' : (placeholder || 'Select…')}
        value={open ? search : (selected ? display(selected) : '')}
        onChange={e => { setSearch(e.target.value); setOpen(true); }}
        onFocus={() => { if (!disabled) { setOpen(true); setSearch(''); } }}
        onClick={() => { if (!disabled) { setOpen(true); setSearch(''); } }}
        readOnly={!open}
        disabled={disabled}
      />
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
      {open && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <li className="px-4 py-3 text-sm text-stone-400 italic">No results</li>
            : filtered.map(o => (
                <li key={o.id}
                  onMouseDown={() => { onChange(o.id, o); setOpen(false); setSearch(''); }}
                  className={cn(
                    'px-4 py-2.5 text-sm cursor-pointer hover:bg-stone-50',
                    String(o.id) === String(value) && 'bg-brand-primary/5 font-semibold text-brand-primary'
                  )}
                >
                  {display(o)}
                </li>
              ))
          }
        </ul>
      )}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const MasterForm = ({ type = 'Customer', userRole = 'admin' }) => {
  const isDetailed       = type === 'Supplier';
  const isCustomer       = type === 'Customer';
  const isProduct        = type === 'Product';
  const isBranch         = type === 'Branch' || type === 'Branches';
  const isUnit           = type === 'Unit';
  const isPaymentMethod  = type === 'Payment Method';
  const isWarehouse      = type === 'Warehouse';
  const isAdmin          = userRole === 'admin';
  const showList         = isCustomer || isDetailed || isProduct || isBranch || isPaymentMethod || isWarehouse;

  const [formData, setFormData] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const f   = (field) => formData[field] ?? '';
  const upd = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  // Contacts
  const [contacts, setContacts] = useState([{ id: 1, name: '', phone: '', designation: '', dob: '' }]);
  const addContact    = () => setContacts(prev => [...prev, { id: Date.now(), name: '', phone: '', designation: '', dob: '' }]);
  const removeContact = (id) => setContacts(prev => prev.filter(c => c.id !== id));
  const updContact    = (id, field, val) => setContacts(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));

  // Location dropdowns
  const [countries,  setCountries]  = useState([]);
  const [states,     setStates]     = useState([]);
  const [cities,     setCities]     = useState([]);
  const [selCountry, setSelCountry] = useState('');
  const [selState,   setSelState]   = useState('');
  const [selCity,    setSelCity]    = useState('');

  // Product dropdowns
  const [categories,  setCategories]  = useState([]);
  const [units,       setUnits]       = useState([]);
  const [selCategory, setSelCategory] = useState('');
  const [selUnit,     setSelUnit]     = useState('');

  // List of existing records
  const [records,     setRecords]     = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);

  // Prevents the selCountry/selState cascade from clearing values set by handleCityChange
  const skipCityEffectsRef = useRef(false);

  const clearFields = () => {
    setFormData({});
    setSelCountry(''); setSelState(''); setCities([]); setSelCity('');
    setSelCategory(''); setSelUnit('');
    setContacts([{ id: 1, name: '', phone: '', designation: '', dob: '' }]);
  };
  const resetForm = () => { clearFields(); setError(''); setSuccess(''); };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteWarehouse(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete.');
    } finally {
      setDeletingId(null);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetForm(); }, [type]);

  // Load initial data + existing records
  useEffect(() => {
    const load = async () => {
      try {
        if (isCustomer || isDetailed || isBranch || isWarehouse) setCountries(await getCountries());
        if (isProduct) {
          const [cats, us] = await Promise.all([getCategories(), getUnits()]);
          setCategories(cats); setUnits(us);
        }
        if (showList) {
          setLoadingList(true);
          let rows = [];
          if (isCustomer)         rows = await getCustomers();
          else if (isDetailed)    rows = await getSuppliers();
          else if (isProduct)     rows = await getProducts();
          else if (isBranch)      rows = await getMasterBranches();
          else if (isPaymentMethod) rows = await getPaymentMethods();
          else if (isWarehouse)     rows = await getWarehouses();
          setRecords(rows);
        }
      } catch (err) { console.error('Failed to load data:', err); }
      finally { setLoadingList(false); }
    };
    load();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Country → states (skipped when handleCityChange auto-fills to avoid cascade reset)
  useEffect(() => {
    if (skipCityEffectsRef.current) return;
    if (!selCountry) { setStates([]); setSelState(''); setCities([]); setSelCity(''); return; }
    getStates(selCountry).then(setStates).catch(console.error);
    setSelState(''); setCities([]); setSelCity('');
  }, [selCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  // State → cities (skipped when handleCityChange auto-fills; ref reset here as 2nd effect)
  useEffect(() => {
    if (skipCityEffectsRef.current) { skipCityEffectsRef.current = false; return; }
    if (!selState) { setCities([]); setSelCity(''); return; }
    getCities({ stateId: selState }).then(setCities).catch(console.error);
    setSelCity('');
  }, [selState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCountryChange = (id, obj) => {
    setSelCountry(id);
    setFormData(prev => ({
      ...prev,
      phonePrefix: obj?.phoneCode ? `+${obj.phoneCode}` : prev.phonePrefix,
      currency:    obj?.currency  || prev.currency,
    }));
  };

  const handleCityChange = (id, cityObj) => {
    // Suppress cascade: setting selCountry/selState from here must NOT clear the city we just picked
    skipCityEffectsRef.current = true;
    setSelCity(id);
    if (cityObj?.state) {
      const newStateId   = String(cityObj.state.id);
      const c            = cityObj.state.country;
      const newCountryId = c ? String(c.id) : selCountry;
      setSelState(newStateId);
      setSelCountry(newCountryId);
      if (c) {
        setFormData(prev => ({
          ...prev,
          phonePrefix: c.phoneCode ? `+${c.phoneCode}` : prev.phonePrefix,
          currency:    c.currency  || prev.currency,
        }));
        // Load the correct states list for the auto-detected country without cascading
        if (newCountryId !== String(selCountry)) {
          getStates(newCountryId).then(setStates).catch(console.error);
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setSaving(true);
    try {
      const validContacts = contacts.filter(c => c.name.trim()).map(c => ({
        name: c.name.trim(),
        phone: c.phone ? `${f('phonePrefix') || ''}${f('phonePrefix') ? ' ' : ''}${c.phone}`.trim() : undefined,
        designation: c.designation || undefined,
        dob: c.dob || undefined,
      }));

      let newRow;
      if (isPaymentMethod) {
        if (!f('name')) return setError('Payment method name is required');
        newRow = await createPaymentMethod({ name: f('name') });
      } else if (type === 'Category') {
        await createCategory({ name: f('name') });
      } else if (isUnit) {
        await createUnit({ unitName: f('unitName'), ...(f('shortName') && { shortName: f('shortName') }) });
      } else if (isBranch) {
        if (!f('name'))  return setError('Branch name is required');
        if (!selCountry) return setError('Please select a country');
        if (!selState)   return setError('Please select a state');
        if (!selCity)    return setError('Please select a city');
        newRow = await createBranch({
          name: f('name'), countryId: selCountry, stateId: selState, cityId: selCity,
          ...(f('area')    && { area:    f('area') }),
          ...(f('address') && { address: f('address') }),
        });
      } else if (isDetailed) {
        const fullPhone = f('phone') ? `${f('phonePrefix') || ''}${f('phonePrefix') ? ' ' : ''}${f('phone')}`.trim() : undefined;
        newRow = await createSupplier({
          name: f('name'), countryId: selCountry, stateId: selState, cityId: selCity,
          ...(f('area')    && { area:    f('area') }),
          ...(f('address') && { address: f('address') }),
          ...(fullPhone    && { phone:   fullPhone }),
          ...(f('email')   && { email:   f('email') }),
          ...(f('gstNo')   && { gstNo:   f('gstNo') }),
          contacts: validContacts,
        });
      } else if (isCustomer) {
        const fullPhone = f('phone') ? `${f('phonePrefix') || ''}${f('phonePrefix') ? ' ' : ''}${f('phone')}`.trim() : undefined;
        newRow = await createCustomer({
          name: f('name'), countryId: selCountry, stateId: selState, cityId: selCity,
          ...(f('area')    && { area:    f('area') }),
          ...(f('address') && { address: f('address') }),
          ...(fullPhone    && { phone:   fullPhone }),
          ...(f('email')   && { email:   f('email') }),
          ...(f('gstNo')   && { gstNo:   f('gstNo') }),
          contacts: validContacts,
        });
      } else if (isProduct) {
        newRow = await createProduct({
          name: f('name'), categoryId: selCategory, unitId: selUnit,
          purchasePrice: f('purchasePrice'), sellingPrice: f('sellingPrice'),
          ...(f('barcode') && { barcode: f('barcode') }),
        });
      } else if (isWarehouse) {
        if (!f('name')) return setError('Warehouse name is required');
        newRow = await createWarehouse({
          name: f('name'),
          ...(f('address') && { address: f('address') }),
          ...(f('area')    && { area:    f('area') }),
          ...(selCity      && { cityId:  selCity }),
        });
      }

      // Prepend new record to list
      if (newRow && showList) setRecords(prev => [newRow, ...prev]);

      clearFields();
      setSuccess(`${type === 'Branches' ? 'Branch' : type} saved successfully!`);
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = cn(
    'w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary placeholder:text-brand-primary/40'
      : 'border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary placeholder:text-rs-text-primary/40'
  );
  const labelCls   = cn('block text-sm font-semibold mb-2', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary');
  const thCls      = cn('p-4 text-[10px] font-bold uppercase tracking-widest text-left', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted');
  const tdCls      = cn('p-4 text-sm', isAdmin ? 'text-brand-primary/80' : 'text-rs-text-primary/80');
  const trHoverCls = cn('border-b transition-colors', isAdmin ? 'border-brand-bg/50 hover:bg-brand-bg/5' : 'border-rs-accent-bg/50 hover:bg-rs-cream/10');

  const locationBlock = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className={labelCls}>Country <span className="text-red-400">*</span></label>
          <SearchableSelect value={selCountry} onChange={handleCountryChange} options={countries} placeholder="Country" />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>State <span className="text-red-400">*</span></label>
          <SearchableSelect value={selState} onChange={(id) => setSelState(id)} options={states} placeholder="State" disabled={!selCountry} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>City <span className="text-red-400">*</span></label>
          <SearchableSelect value={selCity} onChange={handleCityChange} options={cities} placeholder="City" disabled={!selState} />
        </div>
        <div className="space-y-2">
          <label className={labelCls}>Area / Locality</label>
          <input className={inputCls} type="text" placeholder="e.g. Andheri, Sector 12" value={f('area')} onChange={upd('area')} />
        </div>
      </div>
      {(f('phonePrefix') || f('currency')) && (
        <div className="flex gap-3 flex-wrap pt-1">
          {f('phonePrefix') && (
            <span className="inline-flex items-center gap-1.5 bg-brand-primary/5 text-brand-primary text-xs font-bold px-3 py-1.5 rounded-full border border-brand-primary/20">
              📞 {f('phonePrefix')}
            </span>
          )}
          {f('currency') && (
            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
              💱 {f('currency')}
            </span>
          )}
        </div>
      )}
    </div>
  );

  const contactsTable = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={cn('text-base font-bold', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary')}>Contact Persons</h3>
        <button type="button" onClick={addContact} className={cn('flex items-center text-xs font-bold uppercase tracking-wider gap-1', isAdmin ? 'text-brand-primary' : 'text-rs-text-primary')}>
          <PlusCircle className="w-4 h-4" />Add Contact
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-stone-100">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn('border-b', isAdmin ? 'border-brand-bg bg-brand-bg/10' : 'border-rs-accent-bg bg-rs-cream/20')}>
              {['Name', 'Phone', 'Designation', 'Date of Birth', ''].map(h => (
                <th key={h} className={thCls}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className={trHoverCls}>
                <td className="p-2"><input type="text" value={c.name} onChange={e => updContact(c.id, 'name', e.target.value)} placeholder="Full Name" className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm" /></td>
                <td className="p-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-stone-500 whitespace-nowrap flex-shrink-0">{f('phonePrefix') || '+91'}</span>
                    <input type="tel" value={c.phone} onChange={e => updContact(c.id, 'phone', e.target.value)} placeholder="Number" maxLength={phoneMaxLength(f('phonePrefix'))} className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm" />
                  </div>
                </td>
                <td className="p-2">
                  <select value={c.designation} onChange={e => updContact(c.id, 'designation', e.target.value)} className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm cursor-pointer">
                    <option value="">Select</option>
                    {['Manager', 'Owner', 'Sales Head', 'Procurement Head', 'Sales Boy', 'President', 'CEO'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </td>
                <td className="p-2">
                  <input
                    type="date"
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    value={c.dob}
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) { updContact(c.id, 'dob', ''); return; }
                      const picked = new Date(val + 'T00:00:00');
                      const today  = new Date(); today.setHours(23, 59, 59, 999);
                      if (isNaN(picked.getTime()) || picked > today) return;
                      updContact(c.id, 'dob', val);
                    }}
                    className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm text-stone-500"
                  />
                </td>
                <td className="p-2 text-center">
                  <button type="button" onClick={() => removeContact(c.id)} className="text-red-400 hover:text-red-600 p-2"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFields = () => {
    if (isCustomer) return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-2">
            <label className={labelCls}>Customer Name <span className="text-red-400">*</span></label>
            <input className={inputCls} type="text" placeholder="Enter customer full name" value={f('name')} onChange={upd('name')} required />
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Phone</label>
            <div className="flex gap-2 items-stretch">
              <div className={cn(
                'flex items-center justify-center px-3 rounded-lg border text-sm font-bold min-w-[64px] text-center flex-shrink-0',
                isAdmin ? 'border-brand-bg bg-brand-bg/30 text-brand-primary' : 'border-rs-accent-bg bg-rs-cream/30 text-rs-text-primary'
              )}>
                {f('phonePrefix') || '+91'}
              </div>
              <input className={cn(inputCls, 'flex-1')} type="tel" placeholder="Phone number" value={f('phone')} onChange={upd('phone')} maxLength={phoneMaxLength(f('phonePrefix'))} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2"><label className={labelCls}>Email</label><input className={inputCls} type="email" placeholder="customer@email.com" value={f('email')} onChange={upd('email')} /></div>
          <div className="space-y-2"><label className={labelCls}>GST No</label><input className={inputCls} type="text" placeholder="Enter GST number" value={f('gstNo')} onChange={upd('gstNo')} /></div>
          <div className="space-y-2"><label className={labelCls}>Address</label><input className={inputCls} type="text" placeholder="Full postal address" value={f('address')} onChange={upd('address')} /></div>
        </div>
        {locationBlock()}
        {contactsTable()}
      </div>
    );

    if (isDetailed) return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-6">
            <div className="space-y-2"><label className={labelCls}>Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="Enter supplier full name" value={f('name')} onChange={upd('name')} required /></div>
            <div className="space-y-2"><label className={labelCls}>Address</label><textarea className={cn(inputCls, 'resize-none')} placeholder="Enter full postal address" rows={3} value={f('address')} onChange={upd('address')} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
            <div className="space-y-2">
              <label className={labelCls}>Phone</label>
              <div className="flex gap-2 items-stretch">
                <div className={cn(
                  'flex items-center justify-center px-3 rounded-lg border text-sm font-bold min-w-[64px] text-center flex-shrink-0',
                  isAdmin ? 'border-brand-bg bg-brand-bg/30 text-brand-primary' : 'border-rs-accent-bg bg-rs-cream/30 text-rs-text-primary'
                )}>
                  {f('phonePrefix') || '+91'}
                </div>
                <input className={cn(inputCls, 'flex-1')} type="tel" placeholder="Phone number" value={f('phone')} onChange={upd('phone')} maxLength={phoneMaxLength(f('phonePrefix'))} />
              </div>
            </div>
            <div className="space-y-2"><label className={labelCls}>Email</label><input className={inputCls} type="email" placeholder="supplier@email.com" value={f('email')} onChange={upd('email')} /></div>
            <div className="space-y-2 sm:col-span-2"><label className={labelCls}>GST No</label><input className={inputCls} type="text" placeholder="Enter GST number" value={f('gstNo')} onChange={upd('gstNo')} /></div>
          </div>
        </div>
        {locationBlock()}
        {contactsTable()}
      </div>
    );

    if (isProduct) return (
      <div className="space-y-8 max-w-5xl">
        <div className="space-y-2"><label className={labelCls}>Product Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="Enter product name" value={f('name')} onChange={upd('name')} required /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-2"><label className={labelCls}>Category *</label><SearchableSelect value={selCategory} onChange={(id) => setSelCategory(id)} options={categories} placeholder="Category" /></div>
          <div className="space-y-2"><label className={labelCls}>Unit *</label><SearchableSelect value={selUnit} onChange={(id) => setSelUnit(id)} options={units} placeholder="Unit" displayFn={u => `${u.unitName}${u.shortName ? ` (${u.shortName})` : ''}`} /></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="space-y-2"><label className={labelCls}>Purchase Price <span className="text-red-400">*</span></label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₹</span><input className={cn(inputCls, 'pl-10')} type="number" placeholder="0.00" min="0" step="0.01" value={f('purchasePrice')} onChange={upd('purchasePrice')} required /></div></div>
          <div className="space-y-2"><label className={labelCls}>Selling Price <span className="text-red-400">*</span></label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₹</span><input className={cn(inputCls, 'pl-10')} type="number" placeholder="0.00" min="0" step="0.01" value={f('sellingPrice')} onChange={upd('sellingPrice')} required /></div></div>
          <div className="space-y-2"><label className={labelCls}>Barcode</label><input className={inputCls} type="text" placeholder="Scan or enter barcode" value={f('barcode')} onChange={upd('barcode')} /></div>
        </div>
      </div>
    );

    if (isBranch) return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-2"><label className={labelCls}>Branch Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="Enter branch name" value={f('name')} onChange={upd('name')} required /></div>
          <div className="space-y-2"><label className={labelCls}>Address</label><input className={inputCls} type="text" placeholder="Enter branch address" value={f('address')} onChange={upd('address')} /></div>
        </div>
        {locationBlock()}
        {f('currency') && (
          <div className="max-w-xs space-y-2"><label className={labelCls}>Currency (auto-filled)</label><input className={inputCls} type="text" value={f('currency')} readOnly /></div>
        )}
      </div>
    );

    if (isUnit) return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2"><label className={labelCls}>Unit Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="e.g. Kilogram, Litre" value={f('unitName')} onChange={upd('unitName')} required /></div>
        <div className="space-y-2"><label className={labelCls}>Short Name</label><input className={inputCls} type="text" placeholder="e.g. kg, ltr, pcs" value={f('shortName')} onChange={upd('shortName')} /></div>
      </div>
    );

    if (isPaymentMethod) return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2"><label className={labelCls}>Payment Method Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="e.g. Cash, Bank Transfer, UPI" value={f('name')} onChange={upd('name')} required /></div>
      </div>
    );

    if (isWarehouse) return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-2"><label className={labelCls}>Warehouse Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="Enter warehouse name" value={f('name')} onChange={upd('name')} required /></div>
          <div className="space-y-2"><label className={labelCls}>Address</label><input className={inputCls} type="text" placeholder="Enter full address" value={f('address')} onChange={upd('address')} /></div>
        </div>
        {locationBlock()}
      </div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2"><label className={labelCls}>Category Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="Enter category name" value={f('name')} onChange={upd('name')} required /></div>
      </div>
    );
  };

  // ── Records list table ────────────────────────────────────────────────────────
  const renderList = () => {
    if (!showList) return null;

    const headCls  = cn('border-b', isAdmin ? 'border-brand-bg bg-brand-bg/10' : 'border-rs-accent-bg bg-rs-cream/20');
    const dividerCls = cn('border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100');

    // ── Customer / Supplier table + separate Contact Persons table ───────────
    if (isCustomer || isDetailed) {
      // All contacts across all records, flat list
      const allContacts = records.flatMap(r =>
        (r.contacts || []).map(cp => ({ ...cp, parentName: r.name }))
      );

      return (
        <>
          {/* ── Main records table ── */}
          <div className={dividerCls}>
            <div className="px-4 py-3 md:px-8 md:py-4 flex items-center gap-2">
              <Users2 className={cn('w-4 h-4', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')} />
              <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                {isCustomer ? 'Customer' : 'Supplier'} Master ({records.length})
              </h3>
            </div>
            <div className="px-4 pb-4 md:px-8 md:pb-8">
              {loadingList ? (
                <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
              ) : records.length === 0 ? (
                <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>No records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[900px]">
                    <thead>
                      <tr className={headCls}>
                        <th className={thCls}>#</th>
                        <th className={thCls}>Name</th>
                        <th className={thCls}>Phone</th>
                        <th className={thCls}>City</th>
                        <th className={thCls}>State</th>
                        <th className={thCls}>Country</th>
                        <th className={thCls}>Area</th>
                        <th className={thCls}>GST No</th>
                        <th className={thCls}>Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={r.id} className={trHoverCls}>
                          <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                          <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                          <td className={tdCls}>{r.phone || '—'}</td>
                          <td className={cn(tdCls, 'font-medium')}>{r.cityName || '—'}</td>
                          <td className={tdCls}>{r.stateName || '—'}</td>
                          <td className={tdCls}>{r.countryName || '—'}</td>
                          <td className={tdCls}>{r.area || '—'}</td>
                          <td className={tdCls}>{r.gstNo || '—'}</td>
                          <td className={tdCls}>{r.email || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* ── Contact Persons table ── */}
          <div className={dividerCls}>
            <div className="px-4 py-3 md:px-8 md:py-4 flex items-center gap-2">
              <Users2 className={cn('w-4 h-4', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')} />
              <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                Contact Persons ({allContacts.length})
              </h3>
            </div>
            <div className="px-4 pb-4 md:px-8 md:pb-8">
              {loadingList ? (
                <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
              ) : allContacts.length === 0 ? (
                <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                  No contact persons added yet. Fill the Contact Persons section in the form above before saving.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className={headCls}>
                        <th className={thCls}>#</th>
                        <th className={thCls}>{isCustomer ? 'Customer' : 'Supplier'}</th>
                        <th className={thCls}>Contact Name</th>
                        <th className={thCls}>Phone</th>
                        <th className={thCls}>Designation</th>
                        <th className={thCls}>Date of Birth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allContacts.map((cp, i) => (
                        <tr key={cp.id} className={trHoverCls}>
                          <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                          <td className={cn(tdCls, 'font-medium text-brand-primary/70')}>{cp.parentName}</td>
                          <td className={cn(tdCls, 'font-semibold')}>{cp.name}</td>
                          <td className={tdCls}>{cp.phone || '—'}</td>
                          <td className={tdCls}>{cp.designation || '—'}</td>
                          <td className={tdCls}>{cp.dob ? cp.dob.split('-').reverse().join('/') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      );
    }

    // ── Product list ─────────────────────────────────────────────────────────
    if (isProduct) {
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Product Master ({records.length})
            </h3>
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : records.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>No products yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Category</th>
                      <th className={thCls}>Unit</th>
                      <th className={thCls}>Purchase Price</th>
                      <th className={thCls}>Selling Price</th>
                      <th className={thCls}>Barcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={tdCls}>{r.category?.name || '—'}</td>
                        <td className={tdCls}>{r.unit?.unitName || '—'}</td>
                        <td className={tdCls}>₹ {Number(r.purchasePrice).toLocaleString()}</td>
                        <td className={tdCls}>₹ {Number(r.sellingPrice).toLocaleString()}</td>
                        <td className={tdCls}>{r.barcode || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── Payment Method list ──────────────────────────────────────────────────
    if (isPaymentMethod) {
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Payment Method Master ({records.length})
            </h3>
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : records.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>No payment methods yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse max-w-sm">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── Branch list ──────────────────────────────────────────────────────────
    if (isBranch) {
      return (
        <div className={dividerCls}>
          <div className="px-8 py-4 flex items-center gap-2">
            <Building2 className={cn('w-4 h-4', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')} />
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Branch Master ({records.length})
            </h3>
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : records.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>No branches yet. Add one above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Branch Name</th>
                      <th className={thCls}>Country</th>
                      <th className={thCls}>State</th>
                      <th className={thCls}>City</th>
                      <th className={thCls}>Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={tdCls}>{r.country?.name || '—'}</td>
                        <td className={tdCls}>{r.state?.name || '—'}</td>
                        <td className={cn(tdCls, 'font-medium')}>{r.city?.name || '—'}</td>
                        <td className={tdCls}>{r.address || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── Warehouse list ───────────────────────────────────────────────────────
    if (isWarehouse) {
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Warehouse Master ({records.length})
            </h3>
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : records.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>No warehouses yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Area</th>
                      <th className={thCls}>Address</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={tdCls}>{r.area || '—'}</td>
                        <td className={tdCls}>{r.address || '—'}</td>
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
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
      );
    }

    return null;
  };

  const displayType = type === 'Branches' ? 'Branch' : type;
  const formTitle   = isCustomer ? 'Customer Details' : `${displayType} ${isBranch ? 'Details' : 'Master'}`;

  return (
    <section className={cn('rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500', isAdmin ? 'bg-white border-brand-bg' : 'bg-white border-stone-100')}>
      {/* Header */}
      <div className={cn('px-4 py-4 md:px-8 md:py-6 border-b flex justify-between items-center', isAdmin ? 'border-brand-bg' : 'border-stone-100', isProduct && 'bg-[#FDFCFB]')}>
        <h2 className={cn('text-2xl font-bold', isAdmin ? (isProduct ? 'font-product-serif text-brand-primary' : 'font-admin-serif text-brand-primary') : 'font-user-serif text-rs-text-primary')}>
          {formTitle}
        </h2>
        <span className={cn('text-[10px] font-bold uppercase tracking-widest opacity-60', isAdmin ? 'text-brand-primary' : 'text-rs-text-muted')}>
          Form ID: {type.substring(0, 2).toUpperCase()}-{String(Math.floor(Math.random() * 9000) + 1000)}
        </span>
      </div>

      {/* Form */}
      <form className="p-4 md:p-8 space-y-8 md:space-y-12" onSubmit={handleSubmit}>
        {error   && <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><XCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
        {success && <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

        <div className="min-h-[250px]">{renderFields()}</div>

        <div className={cn('flex justify-end items-center gap-8 pt-6 md:pt-8 border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
          <button type="button" onClick={resetForm} className={cn('text-sm font-semibold', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted')}>Discard</button>
          <button type="submit" disabled={saving}
            className={cn('px-10 py-3 rounded-lg font-bold text-sm shadow-md transition-opacity', saving && 'opacity-60 cursor-not-allowed', isAdmin ? 'bg-brand-primary text-ivory' : 'bg-rs-text-primary text-white')}>
            {saving ? 'Saving…' : `Save ${displayType}`}
          </button>
        </div>
      </form>

      {/* List of existing records */}
      {renderList()}
    </section>
  );
};

export default MasterForm;
