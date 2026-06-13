import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { ChevronDown, PlusCircle, Trash2, CheckCircle, XCircle, Users2, Building2, Search, Pencil, X, List } from 'lucide-react';
import QuickCreateModal from './QuickCreateModal';
import { useAuth } from '../../context/AuthContext';
import {
  getCountries, getStates, getCities,
  getMasterBranches, createBranch, updateBranch, deleteBranch,
  getCategories,    createCategory,    updateCategory,    deleteCategory,
  getUnits,         createUnit,        updateUnit,        deleteUnit,
  getSuppliers,     createSupplier,    updateSupplier,    deleteSupplier,
  getCustomers,     createCustomer,    updateCustomer,    deleteCustomer,
  getProducts,      createProduct,     updateProduct,     deleteProduct,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  getExpenses,      createExpense,     updateExpense,     deleteExpense,
  getWarehouses,    createWarehouse,   updateWarehouse,   deleteWarehouse,
  updateContact,    deleteContact,
} from '../../api/masters';

// Phone number max digits by country dial code (national subscriber number length)
const PHONE_MAX_LENGTHS = {
  // Asia & Pacific
  '91': 10, '92': 10, '880': 10, '94': 9, '977': 10,
  '1': 10,  '61': 9,  '64': 9,  '65': 8,  '60': 9,
  '66': 9,  '62': 12, '63': 10, '84': 10, '86': 11,
  '81': 11, '82': 10, '95': 9,
  // Europe
  '44': 10, '33': 9,  '49': 12, '7': 11,  '34': 9,
  '39': 10, '31': 9,  '32': 9,  '41': 9,  '43': 13,
  '48': 9,  '380': 9, '90': 10,
  // Americas
  '55': 11, '52': 10, '54': 10, '57': 10, '56': 9,
  '51': 9,
  // Middle East
  '971': 9, '966': 9, '965': 8, '973': 8, '974': 8,
  '968': 8, '962': 9, '20': 10, '212': 9,
  // Africa
  '255': 9,  // Tanzania
  '254': 9,  // Kenya
  '256': 9,  // Uganda
  '250': 9,  // Rwanda
  '251': 9,  // Ethiopia
  '27': 9,   // South Africa
  '234': 10, // Nigeria
  '233': 9,  // Ghana
  '213': 9,  // Algeria
  '216': 8,  // Tunisia
  '263': 9,  // Zimbabwe
  '260': 9,  // Zambia
  '258': 9,  // Mozambique
  '225': 10, // Ivory Coast
  '237': 9,  // Cameroon
  '221': 9,  // Senegal
  '243': 9,  // DR Congo
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

  const q = search.toLowerCase();
  const filtered = q
    ? [
        ...options.filter(o => display(o).toLowerCase().startsWith(q)),
        ...options.filter(o => !display(o).toLowerCase().startsWith(q) && display(o).toLowerCase().includes(q)),
      ].slice(0, 60)
    : options.slice(0, 60);

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
          'w-full rounded-xl border px-4 py-3 pr-9 text-sm outline-none transition-all',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-stone-50 border-stone-200'
            : 'cursor-pointer border-stone-200 bg-stone-50 focus:border-rs-text-primary focus:ring-2 focus:ring-rs-text-primary/10 focus:bg-white'
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
        <ul className="absolute z-50 mt-1 w-full bg-white border border-stone-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
          {filtered.length === 0
            ? <li className="px-4 py-3 text-sm text-stone-400 italic">No results</li>
            : filtered.map(o => (
                <li key={o.id}
                  onMouseDown={() => { onChange(o.id, o); setOpen(false); setSearch(''); }}
                  className={cn(
                    'px-4 py-2.5 text-sm cursor-pointer hover:bg-stone-50 transition-colors',
                    String(o.id) === String(value) && 'bg-rs-text-primary/5 font-semibold text-rs-text-primary'
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

// ── Phone Prefix Selector ─────────────────────────────────────────────────────
const PhonePrefixSelect = ({ value, onChange, countries, isAdmin }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  const filtered = countries
    .filter(c => c.phoneCode)
    .filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      `+${c.phoneCode}`.includes(search)
    )
    .slice(0, 60);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setSearch(''); }}
        className={cn(
          'h-full flex items-center gap-1 px-3 rounded-lg border text-sm font-bold cursor-pointer transition-colors whitespace-nowrap',
          isAdmin
            ? 'border-brand-bg bg-brand-bg/30 text-brand-primary hover:bg-brand-bg/50'
            : 'border-rs-accent-bg bg-rs-cream/30 text-rs-text-primary hover:bg-rs-cream/50'
        )}
      >
        {value || '+91'}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1 w-56 bg-white border border-stone-200 rounded-lg shadow-lg">
          <input
            autoFocus
            type="text"
            className="w-full px-3 py-2 text-sm border-b border-stone-100 outline-none"
            placeholder="Search country…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <ul className="max-h-48 overflow-y-auto">
            {filtered.length === 0
              ? <li className="px-3 py-2 text-sm text-stone-400 italic">No results</li>
              : filtered.map(c => (
                <li
                  key={c.id}
                  onMouseDown={() => { onChange(`+${c.phoneCode}`); setOpen(false); setSearch(''); }}
                  className={cn(
                    'px-3 py-2 text-sm cursor-pointer hover:bg-stone-50 flex justify-between items-center gap-2',
                    value === `+${c.phoneCode}` && 'bg-brand-primary/5 font-semibold text-brand-primary'
                  )}
                >
                  <span className="truncate">{c.name}</span>
                  <span className="text-xs font-bold text-stone-400 flex-shrink-0">+{c.phoneCode}</span>
                </li>
              ))
            }
          </ul>
        </div>
      )}
    </div>
  );
};

// ── List Search Bar ───────────────────────────────────────────────────────────
const ListSearch = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative max-w-xs">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-4 py-2 text-sm border border-stone-200 rounded-xl outline-none focus:border-rs-text-primary focus:ring-2 focus:ring-rs-text-primary/10 bg-stone-50 focus:bg-white transition-all"
    />
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const MasterForm = ({ type = 'Customer', userRole = 'admin' }) => {
  const { activeBranch, clearBranch, currencySymbol } = useAuth();
  const navigate = useNavigate();

  const isDetailed       = type === 'Supplier';
  const isCustomer       = type === 'Customer';
  const isProduct        = type === 'Product';
  const isBranch         = type === 'Branch' || type === 'Branches';
  const isUnit           = type === 'Unit';
  const isCategory       = type === 'Category';
  const isPaymentMethod  = type === 'Payment Method';
  const isExpense        = type === 'Expense';
  const isWarehouse      = type === 'Warehouse';
  const isAdmin          = userRole === 'admin';
  const showList         = isCustomer || isDetailed || isProduct || isBranch || isPaymentMethod || isWarehouse || isCategory || isUnit || isExpense;

  const [formData, setFormData] = useState({});
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');

  const f   = (field) => formData[field] ?? '';
  const upd = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  // Contacts
  const [contacts, setContacts] = useState([{ id: 1, name: '', phone: '', phonePrefix: '+91', designation: '', dob: '' }]);
  const addContact    = () => setContacts(prev => [...prev, { id: Date.now(), name: '', phone: '', phonePrefix: f('phonePrefix') || '+91', designation: '', dob: '' }]);
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

  const [quickCreate, setQuickCreate] = useState(null);

  // List of existing records
  const [records,     setRecords]     = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId,  setDeletingId]  = useState(null);
  const [deleteModal, setDeleteModal] = useState(null); // { id, label }
  const [deleteModalErr, setDeleteModalErr] = useState('');

  // Search state for lists
  const [listSearch, setListSearch] = useState('');

  // Inline edit state for product list
  const [editingId,   setEditingId]   = useState(null);
  const [editData,    setEditData]    = useState({});
  const [savingEdit,  setSavingEdit]  = useState(false);
  const [editError,   setEditError]   = useState('');
  const [showListModal, setShowListModal] = useState(false);
  const [viewRecord,  setViewRecord]  = useState(null);
  const [contactsRecord, setContactsRecord] = useState(null);
  const [editingContactId,  setEditingContactId]  = useState(null);
  const [editContactData,   setEditContactData]   = useState({});
  const [savingContact,     setSavingContact]      = useState(false);
  const [contactErr,        setContactErr]         = useState('');
  const [deleteContactId,   setDeleteContactId]   = useState(null);
  const [deletingContact,   setDeletingContact]   = useState(false);

  // Prevents the selCountry/selState cascade from clearing values set by handleCityChange
  const skipCityEffectsRef = useRef(false);
  // Prevents branch prefill from running more than once per form type
  const branchPrefillDone = useRef(false);

  // Global keyboard shortcuts — register once, read latest state via ref
  const kbRef = useRef({});
  kbRef.current = { deleteModal, deleteModalErr, deletingId, viewRecord, contactsRecord, showListModal, quickCreate, saving };

  const confirmDeleteRef = useRef(null);
  const handleSubmitRef  = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      const s = kbRef.current;
      if (e.key === 'Escape') {
        if (s.quickCreate)    { setQuickCreate(null); return; }
        if (s.deleteModal)    { setDeleteModal(null); setDeleteModalErr(''); return; }
        if (s.viewRecord)     { setViewRecord(null); setEditingId(null); setEditData({}); setEditError(''); return; }
        if (s.contactsRecord) { setContactsRecord(null); setEditingContactId(null); setDeleteContactId(null); setContactErr(''); return; }
        if (s.showListModal)  { setShowListModal(false); setListSearch(''); setEditingId(null); return; }
      }
      if (e.key === 'Enter' && s.deleteModal && !s.deleteModalErr && !s.deletingId) {
        confirmDeleteRef.current?.();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!s.deleteModal && !s.viewRecord && !s.contactsRecord && !s.showListModal && !s.quickCreate && !s.saving) {
          handleSubmitRef.current?.({ preventDefault: () => {} });
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []); // register once

  const clearFields = () => {
    setFormData({});
    setSelCountry(''); setSelState(''); setCities([]); setSelCity('');
    setSelCategory(''); setSelUnit('');
    setContacts([{ id: 1, name: '', phone: '', phonePrefix: '+91', designation: '', dob: '' }]);
  };
  const resetForm = () => { clearFields(); setError(''); setSuccess(''); };

  const handleDelete = (id) => {
    const record = records.find(r => r.id === id);
    const label  = record?.name || record?.unitName || `this ${type.toLowerCase()}`;
    setDeleteModal({ id, label });
    setDeleteModalErr('');
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    const { id } = deleteModal;
    setDeletingId(id);
    setDeleteModalErr('');
    try {
      if (isWarehouse)          await deleteWarehouse(id);
      else if (isBranch)        await deleteBranch(id);
      else if (isDetailed)      await deleteSupplier(id);
      else if (isCustomer)      await deleteCustomer(id);
      else if (isProduct)       await deleteProduct(id);
      else if (isPaymentMethod) await deletePaymentMethod(id);
      else if (isUnit)          await deleteUnit(id);
      else if (isCategory)      await deleteCategory(id);
      else if (isExpense)       await deleteExpense(id);
      setRecords(prev => prev.filter(r => r.id !== id));
      setDeleteModal(null);
    } catch (err) {
      setDeleteModalErr(err.message || 'Cannot delete this record.');
    } finally {
      setDeletingId(null);
    }
  };

  confirmDeleteRef.current = confirmDelete;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetForm(); setListSearch(''); setEditingId(null); }, [type]);

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
          if (isCustomer)           rows = await getCustomers();
          else if (isDetailed)      rows = await getSuppliers();
          else if (isProduct)       rows = await getProducts();
          else if (isBranch)        rows = await getMasterBranches();
          else if (isPaymentMethod) rows = await getPaymentMethods();
          else if (isWarehouse)     rows = await getWarehouses();
          else if (isCategory)      rows = await getCategories();
          else if (isUnit)          rows = await getUnits();
          else if (isExpense)       rows = await getExpenses();
          setRecords(rows);
        }
      } catch (err) { console.error('Failed to load data:', err); }
      finally { setLoadingList(false); }
    };
    load();
  }, [type]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset prefill flag whenever the form type switches
  useEffect(() => { branchPrefillDone.current = false; }, [type]);

  // Auto-populate country/state/city from the active branch when the form first opens
  useEffect(() => {
    if (!(isCustomer || isDetailed || isWarehouse)) return;
    if (!activeBranch?.country?.id) return;
    if (countries.length === 0) return;
    if (branchPrefillDone.current) return;
    branchPrefillDone.current = true;

    const doInit = async () => {
      skipCityEffectsRef.current = true;
      setSelCountry(String(activeBranch.country.id));
      setFormData(prev => ({
        ...prev,
        phonePrefix: activeBranch.country.phoneCode ? `+${activeBranch.country.phoneCode}` : (prev.phonePrefix || ''),
        currency:    activeBranch.country.currency  || prev.currency,
      }));
      if (activeBranch.state?.id) {
        const statesList = await getStates(String(activeBranch.country.id));
        setStates(statesList);
        setSelState(String(activeBranch.state.id));
        if (activeBranch.city?.id) {
          const citiesList = await getCities({ stateId: String(activeBranch.state.id) });
          setCities(citiesList);
          setSelCity(String(activeBranch.city.id));
        }
      }
      skipCityEffectsRef.current = false;
    };
    doInit();
  }, [type, activeBranch, countries.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Country → states
  useEffect(() => {
    if (skipCityEffectsRef.current) return;
    if (!selCountry) { setStates([]); setSelState(''); setCities([]); setSelCity(''); return; }
    getStates(selCountry).then(setStates).catch(console.error);
    setSelState(''); setCities([]); setSelCity('');
  }, [selCountry]); // eslint-disable-line react-hooks/exhaustive-deps

  // State → cities
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
        phone: c.phone ? `${c.phonePrefix || ''}${c.phonePrefix ? ' ' : ''}${c.phone}`.trim() : undefined,
        designation: c.designation || undefined,
        dob: c.dob || undefined,
      }));

      let newRow;
      if (isPaymentMethod) {
        if (!f('name')) return setError('Payment method name is required');
        if (!f('category')) return setError('Please select a category (CASH or BANK)');
        newRow = await createPaymentMethod({ name: f('name'), category: f('category') });
      } else if (isExpense) {
        if (!f('name')) return setError('Expense name is required');
        newRow = await createExpense({ name: f('name') });
      } else if (type === 'Category') {
        newRow = await createCategory({ name: f('name') });
      } else if (isUnit) {
        newRow = await createUnit({ unitName: f('unitName'), ...(f('shortName') && { shortName: f('shortName') }) });
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
        const obAmt = parseFloat(f('openingBalance'));
        newRow = await createSupplier({
          name: f('name'), countryId: selCountry, stateId: selState, cityId: selCity,
          ...(f('area')    && { area:    f('area') }),
          ...(f('address') && { address: f('address') }),
          ...(fullPhone    && { phone:   fullPhone }),
          ...(f('email')   && { email:   f('email') }),
          ...(f('gstNo')   && { gstNo:   f('gstNo') }),
          ...(!isNaN(obAmt) && obAmt > 0 && { openingBalance: obAmt, openingBalanceType: f('obType') === 'DR' ? 'DR' : 'CR' }),
          contacts: validContacts,
        });
      } else if (isCustomer) {
        const fullPhone = f('phone') ? `${f('phonePrefix') || ''}${f('phonePrefix') ? ' ' : ''}${f('phone')}`.trim() : undefined;
        const obAmt = parseFloat(f('openingBalance'));
        newRow = await createCustomer({
          name: f('name'), countryId: selCountry, stateId: selState, cityId: selCity,
          ...(f('area')    && { area:    f('area') }),
          ...(f('address') && { address: f('address') }),
          ...(fullPhone    && { phone:   fullPhone }),
          ...(f('email')   && { email:   f('email') }),
          ...(f('gstNo')   && { gstNo:   f('gstNo') }),
          ...(!isNaN(obAmt) && obAmt > 0 && { openingBalance: obAmt, openingBalanceType: f('obType') === 'DR' ? 'DR' : 'CR' }),
          contacts: validContacts,
        });
      } else if (isProduct) {
        if (!f('name'))       return setError('Product name is required');
        if (!selCategory)     return setError('Please select a category');
        if (!selUnit)         return setError('Please select a unit');
        if (f('lowerLimit') === '') return setError('Lower limit is required');
        if (f('upperLimit') === '') return setError('Upper limit is required');
        newRow = await createProduct({
          name: f('name'), categoryId: selCategory, unitId: selUnit,
          lowerLimit: f('lowerLimit'), upperLimit: f('upperLimit'),
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

      if (newRow && showList) setRecords(prev => [newRow, ...prev]);

      clearFields();
      setSuccess(`${type === 'Branches' ? 'Branch' : type} saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const msg = err.message || '';
      if (msg.includes('BRANCH_INVALID')) {
        clearBranch();
        navigate('/select-branch');
        return;
      }
      setError(msg || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  handleSubmitRef.current = handleSubmit;

  // ── Edit handlers ────────────────────────────────────────────────────────────
  const startEdit = (r) => {
    setEditingId(r.id);
    if (isProduct)
      setEditData({ name: r.name, lowerLimit: r.lowerLimit, upperLimit: r.upperLimit, barcode: r.barcode || '' });
    else if (isBranch)
      setEditData({ name: r.name || '', address: r.address || '', area: r.area || '' });
    else if (isDetailed || isCustomer)
      setEditData({ name: r.name || '', phone: r.phone || '', email: r.email || '', gstNo: r.gstNo || '', address: r.address || '', area: r.area || '' });
    else if (isWarehouse)
      setEditData({ name: r.name || '', address: r.address || '', area: r.area || '' });
    else if (isUnit)
      setEditData({ unitName: r.unitName || '', shortName: r.shortName || '' });
    else
      setEditData({ name: r.name || '' });
    setEditError('');
  };
  const cancelEdit = () => { setEditingId(null); setEditData({}); setEditError(''); };
  const openView   = (r) => { setViewRecord(r); setEditingId(null); setEditData({}); setEditError(''); };
  const closeView  = () => { setViewRecord(null); setEditingId(null); setEditData({}); setEditError(''); };

  const saveEdit = async (id) => {
    setEditError('');
    const primaryName = isUnit ? editData.unitName : editData.name;
    if (!primaryName?.trim()) { setEditError('Name is required'); return; }
    setSavingEdit(true);
    try {
      let updated;
      if (isProduct) {
        updated = await updateProduct(id, { name: editData.name.trim(), lowerLimit: Number(editData.lowerLimit), upperLimit: Number(editData.upperLimit), barcode: editData.barcode || undefined });
      } else if (isBranch) {
        updated = await updateBranch(id, { name: editData.name.trim(), address: editData.address, area: editData.area });
      } else if (isDetailed) {
        updated = await updateSupplier(id, { name: editData.name.trim(), phone: editData.phone || undefined, email: editData.email || undefined, gstNo: editData.gstNo || undefined, address: editData.address || undefined, area: editData.area || undefined });
      } else if (isCustomer) {
        updated = await updateCustomer(id, { name: editData.name.trim(), phone: editData.phone || undefined, email: editData.email || undefined, gstNo: editData.gstNo || undefined, address: editData.address || undefined, area: editData.area || undefined });
      } else if (isWarehouse) {
        updated = await updateWarehouse(id, { name: editData.name.trim(), address: editData.address || undefined, area: editData.area || undefined });
      } else if (isUnit) {
        updated = await updateUnit(id, { unitName: editData.unitName.trim(), shortName: editData.shortName || undefined });
      } else if (isCategory) {
        updated = await updateCategory(id, { name: editData.name.trim() });
      } else if (isPaymentMethod) {
        updated = await updatePaymentMethod(id, { name: editData.name.trim(), category: editData.category || null });
      } else if (isExpense) {
        updated = await updateExpense(id, { name: editData.name.trim() });
      }
      setRecords(prev => prev.map(r => r.id === id ? { ...r, ...editData, ...updated } : r));
      if (viewRecord?.id === id) setViewRecord(prev => ({ ...prev, ...editData, ...updated }));
      setEditingId(null);
    } catch (err) {
      setEditError(err.message || 'Failed to save');
    } finally {
      setSavingEdit(false);
    }
  };

  const inputCls = cn(
    'w-full rounded-xl border px-4 py-3 text-sm transition-all outline-none',
    isAdmin
      ? 'border-brand-bg bg-brand-bg/20 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10 text-brand-primary placeholder:text-brand-primary/30'
      : 'border-stone-200 bg-stone-50 focus:border-rs-text-primary focus:ring-2 focus:ring-rs-text-primary/10 text-rs-text-primary placeholder:text-rs-text-muted/60'
  );
  const labelCls   = cn('block text-[11px] font-bold uppercase tracking-wider mb-2', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-muted');
  const thCls      = cn('px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-left', isAdmin ? 'text-brand-primary/60' : 'text-rs-text-muted');
  const tdCls      = cn('px-4 py-3 text-sm', isAdmin ? 'text-brand-primary/80' : 'text-rs-text-primary/80');
  const trHoverCls = cn('border-b transition-colors', isAdmin ? 'border-brand-bg/50 hover:bg-brand-bg/5' : 'border-stone-100 hover:bg-rs-cream/20');

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
      {f('currency') && (
        <div className="flex gap-3 flex-wrap pt-1">
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200">
            💱 {f('currency')}
          </span>
        </div>
      )}
    </div>
  );

  const contactsTable = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={cn('text-sm font-bold uppercase tracking-wider', isAdmin ? 'text-brand-primary/70' : 'text-rs-text-muted')}>Contact Persons</h3>
        <button type="button" onClick={addContact}
          className={cn('flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm active:scale-95', isAdmin ? 'border-brand-bg text-brand-primary hover:bg-brand-bg/30' : 'border-stone-200 text-rs-text-primary hover:bg-rs-cream/40')}>
          <PlusCircle className="w-3.5 h-3.5" />Add Contact
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-stone-100 shadow-sm">
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
                <td className="px-3 py-2"><input type="text" value={c.name} onChange={e => updContact(c.id, 'name', e.target.value)} placeholder="Full Name" className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 outline-none text-sm focus:border-rs-text-primary focus:ring-1 focus:ring-rs-text-primary/10 transition-all placeholder:text-stone-300" /></td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <PhonePrefixSelect
                      value={c.phonePrefix || '+91'}
                      onChange={(prefix) => updContact(c.id, 'phonePrefix', prefix)}
                      countries={countries}
                      isAdmin={isAdmin}
                    />
                    <input type="tel" value={c.phone} onChange={e => updContact(c.id, 'phone', e.target.value)} placeholder="Number" maxLength={phoneMaxLength(c.phonePrefix)} className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 outline-none text-sm focus:border-rs-text-primary focus:ring-1 focus:ring-rs-text-primary/10 transition-all placeholder:text-stone-300" />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <select value={c.designation} onChange={e => updContact(c.id, 'designation', e.target.value)} className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 outline-none text-sm focus:border-rs-text-primary focus:ring-1 focus:ring-rs-text-primary/10 transition-all cursor-pointer appearance-none">
                    <option value="">Select role…</option>
                    {['Manager', 'Owner', 'Sales Head', 'Procurement Head', 'Sales Boy', 'President', 'CEO'].map(d => <option key={d}>{d}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
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
                    className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 outline-none text-sm focus:border-rs-text-primary focus:ring-1 focus:ring-rs-text-primary/10 transition-all text-rs-text-muted"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <button type="button" onClick={() => removeContact(c.id)} className="text-stone-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
          <div className="space-y-6">
            <div className="space-y-2"><label className={labelCls}>Customer Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="Enter customer full name" value={f('name')} onChange={upd('name')} required /></div>
            <div className="space-y-2"><label className={labelCls}>Address</label><textarea className={cn(inputCls, 'resize-none')} placeholder="Enter full postal address" rows={3} value={f('address')} onChange={upd('address')} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 content-start">
            <div className="space-y-2">
              <label className={labelCls}>Phone</label>
              <div className="flex gap-2 items-stretch">
                <PhonePrefixSelect value={f('phonePrefix')} onChange={(prefix) => setFormData(prev => ({ ...prev, phonePrefix: prefix }))} countries={countries} isAdmin={isAdmin} />
                <input className={cn(inputCls, 'flex-1')} type="tel" placeholder="Phone number" value={f('phone')} onChange={upd('phone')} maxLength={phoneMaxLength(f('phonePrefix'))} />
              </div>
            </div>
            <div className="space-y-2"><label className={labelCls}>Email</label><input className={inputCls} type="email" placeholder="customer@email.com" value={f('email')} onChange={upd('email')} /></div>
            <div className="space-y-2 sm:col-span-2"><label className={labelCls}>GST No</label><input className={inputCls} type="text" placeholder="Enter GST number" value={f('gstNo')} onChange={upd('gstNo')} /></div>
            <div className="space-y-2 sm:col-span-2">
              <label className={labelCls}>Opening Balance</label>
              <div className="flex gap-2 items-stretch">
                <div className="flex rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, obType: 'CR' }))}
                    className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors', (f('obType') || 'CR') === 'CR' ? 'bg-red-500 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600')}>
                    CR
                  </button>
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, obType: 'DR' }))}
                    className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors', f('obType') === 'DR' ? 'bg-green-500 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600')}>
                    DR
                  </button>
                </div>
                <div className={cn('flex items-center flex-1 rounded-xl border overflow-hidden transition-all', isAdmin ? 'border-brand-bg bg-brand-bg/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10' : 'border-stone-200 bg-stone-50 focus-within:border-rs-text-primary focus-within:ring-2 focus-within:ring-rs-text-primary/10')}>
                  <span className={cn('pl-4 text-sm flex-shrink-0', isAdmin ? 'text-brand-primary/50' : 'text-stone-400')}>{currencySymbol}</span>
                  <input
                    className={cn('flex-1 py-3 pr-4 bg-transparent text-sm outline-none', f('obType') === 'DR' ? 'text-green-600 font-bold' : 'text-red-500 font-bold')}
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={f('openingBalance')} onChange={upd('openingBalance')}
                  />
                </div>
                {f('openingBalance') && parseFloat(f('openingBalance')) > 0 && (
                  <div className={cn('flex items-center px-3 rounded-lg text-xs font-bold whitespace-nowrap', (f('obType') || 'CR') !== 'DR' ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')}>
                    {(f('obType') || 'CR') !== 'DR' ? '+' : '−'} {currencySymbol}{parseFloat(f('openingBalance')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>
          </div>
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
                <PhonePrefixSelect value={f('phonePrefix')} onChange={(prefix) => setFormData(prev => ({ ...prev, phonePrefix: prefix }))} countries={countries} isAdmin={isAdmin} />
                <input className={cn(inputCls, 'flex-1')} type="tel" placeholder="Phone number" value={f('phone')} onChange={upd('phone')} maxLength={phoneMaxLength(f('phonePrefix'))} />
              </div>
            </div>
            <div className="space-y-2"><label className={labelCls}>Email</label><input className={inputCls} type="email" placeholder="supplier@email.com" value={f('email')} onChange={upd('email')} /></div>
            <div className="space-y-2 sm:col-span-2"><label className={labelCls}>GST No</label><input className={inputCls} type="text" placeholder="Enter GST number" value={f('gstNo')} onChange={upd('gstNo')} /></div>
            <div className="space-y-2 sm:col-span-2">
              <label className={labelCls}>Opening Balance</label>
              <div className="flex gap-2 items-stretch">
                <div className="flex rounded-lg overflow-hidden border border-stone-200 flex-shrink-0">
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, obType: 'CR' }))}
                    className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors', (f('obType') || 'CR') === 'CR' ? 'bg-red-500 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600')}>
                    CR
                  </button>
                  <button type="button"
                    onClick={() => setFormData(p => ({ ...p, obType: 'DR' }))}
                    className={cn('px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors', f('obType') === 'DR' ? 'bg-green-500 text-white' : 'bg-stone-50 text-stone-400 hover:text-stone-600')}>
                    DR
                  </button>
                </div>
                <div className={cn('flex items-center flex-1 rounded-xl border overflow-hidden transition-all', isAdmin ? 'border-brand-bg bg-brand-bg/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10' : 'border-stone-200 bg-stone-50 focus-within:border-rs-text-primary focus-within:ring-2 focus-within:ring-rs-text-primary/10')}>
                  <span className={cn('pl-4 text-sm flex-shrink-0', isAdmin ? 'text-brand-primary/50' : 'text-stone-400')}>{currencySymbol}</span>
                  <input
                    className={cn('flex-1 py-3 pr-4 bg-transparent text-sm outline-none', f('obType') === 'DR' ? 'text-green-600 font-bold' : 'text-red-500 font-bold')}
                    type="number" min="0" step="0.01" placeholder="0.00"
                    value={f('openingBalance')} onChange={upd('openingBalance')}
                  />
                </div>
                {f('openingBalance') && parseFloat(f('openingBalance')) > 0 && (
                  <div className={cn('flex items-center px-3 rounded-lg text-xs font-bold whitespace-nowrap', (f('obType') || 'CR') !== 'DR' ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')}>
                    {(f('obType') || 'CR') !== 'DR' ? '+' : '−'} {currencySymbol}{parseFloat(f('openingBalance')).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
            </div>
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
          <div className="space-y-2">
            <div className="flex items-center justify-between"><label className={labelCls}>Category <span className="text-red-400">*</span></label><button type="button" onClick={() => setQuickCreate('Category')} className="flex items-center gap-1 text-[10px] font-bold text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded px-2 py-0.5 transition-all cursor-pointer"><PlusCircle className="w-3 h-3" />New</button></div>
            <SearchableSelect value={selCategory} onChange={(id) => setSelCategory(id)} options={categories} placeholder="Category" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between"><label className={labelCls}>Unit <span className="text-red-400">*</span></label><button type="button" onClick={() => setQuickCreate('Unit')} className="flex items-center gap-1 text-[10px] font-bold text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded px-2 py-0.5 transition-all cursor-pointer"><PlusCircle className="w-3 h-3" />New</button></div>
            <SearchableSelect value={selUnit} onChange={(id) => setSelUnit(id)} options={units} placeholder="Unit" displayFn={u => `${u.unitName}${u.shortName ? ` (${u.shortName})` : ''}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="space-y-2">
            <label className={labelCls}>Lower Limit (Min Price) <span className="text-red-400">*</span></label>
            <div className={cn('flex items-center rounded-xl border overflow-hidden transition-all', isAdmin ? 'border-brand-bg bg-brand-bg/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10' : 'border-stone-200 bg-stone-50 focus-within:border-rs-text-primary focus-within:ring-2 focus-within:ring-rs-text-primary/10')}><span className={cn('pl-4 text-sm flex-shrink-0', isAdmin ? 'text-brand-primary/50' : 'text-stone-400')}>{currencySymbol}</span><input className={cn('flex-1 py-3 pr-4 bg-transparent text-sm outline-none', isAdmin ? 'text-brand-primary placeholder:text-brand-primary/30' : 'text-rs-text-muted/60 placeholder:text-rs-text-muted/60')} type="number" placeholder="0.00" min="0" step="0.01" value={f('lowerLimit')} onChange={upd('lowerLimit')} required /></div>
          </div>
          <div className="space-y-2">
            <label className={labelCls}>Upper Limit (Max Price) <span className="text-red-400">*</span></label>
            <div className={cn('flex items-center rounded-xl border overflow-hidden transition-all', isAdmin ? 'border-brand-bg bg-brand-bg/20 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/10' : 'border-stone-200 bg-stone-50 focus-within:border-rs-text-primary focus-within:ring-2 focus-within:ring-rs-text-primary/10')}><span className={cn('pl-4 text-sm flex-shrink-0', isAdmin ? 'text-brand-primary/50' : 'text-stone-400')}>{currencySymbol}</span><input className={cn('flex-1 py-3 pr-4 bg-transparent text-sm outline-none', isAdmin ? 'text-brand-primary placeholder:text-brand-primary/30' : 'text-rs-text-muted/60 placeholder:text-rs-text-muted/60')} type="number" placeholder="0.00" min="0" step="0.01" value={f('upperLimit')} onChange={upd('upperLimit')} required /></div>
          </div>
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
        <div className="space-y-2">
          <label className={labelCls}>Category <span className="text-red-400">*</span></label>
          <select className={inputCls} value={f('category') || ''} onChange={upd('category')} required>
            <option value="">Select category…</option>
            <option value="CASH">CASH</option>
            <option value="BANK">BANK</option>
          </select>
        </div>
      </div>
    );

    if (isExpense) return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2"><label className={labelCls}>Expense Name <span className="text-red-400">*</span></label><input className={inputCls} type="text" placeholder="e.g. Rent, Electricity, Salary" value={f('name')} onChange={upd('name')} required /></div>
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
    const headCls    = cn('border-b', isAdmin ? 'border-brand-bg bg-brand-bg/10' : 'border-rs-accent-bg bg-rs-cream/20');
    const dividerCls = cn('border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100');
    const q          = listSearch.trim().toLowerCase();
    const viewBtnCls = cn(
      'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer',
      isAdmin ? 'bg-brand-primary text-white' : 'bg-rs-text-primary text-white'
    );

    // ── Customer / Supplier table ────────────────────────────────────────────
    if (isCustomer || isDetailed) {
      const allContacts = records.flatMap(r => (r.contacts || []).map(cp => ({ ...cp, parentName: r.name })));
      const filteredRecords  = q ? records.filter(r => r.name?.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q)) : records;
      const filteredContacts = q ? allContacts.filter(cp => cp.name?.toLowerCase().includes(q) || cp.parentName?.toLowerCase().includes(q)) : allContacts;
      return (
        <>
          <div className={dividerCls}>
            <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Users2 className={cn('w-4 h-4', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')} />
                <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                  {isCustomer ? 'Customer' : 'Supplier'} Master ({filteredRecords.length})
                </h3>
              </div>
              <ListSearch value={listSearch} onChange={setListSearch} placeholder={`Search ${isCustomer ? 'customers' : 'suppliers'}…`} />
            </div>
            <div className="px-4 pb-4 md:px-8 md:pb-8">
              {loadingList ? (
                <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
              ) : filteredRecords.length === 0 ? (
                <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No records yet.'}</p>
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
                        {(isDetailed || isCustomer) && <th className={thCls}>Balance</th>}
                        <th className={thCls}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRecords.map((r, i) => (
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
                          {(isDetailed || isCustomer) && (
                            <td className={tdCls}>
                              {r.balance !== undefined && r.balance !== null ? (
                                <span className={cn('text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap', r.balance >= 0 ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200')}>
                                  {r.balance >= 0 ? 'CR' : 'DR'} {currencySymbol}{Math.abs(r.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              ) : '—'}
                            </td>
                          )}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setContactsRecord(r)}
                                className={cn(
                                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer',
                                  (r.contacts || []).length > 0
                                    ? (isAdmin ? 'border-brand-bg text-brand-primary hover:bg-brand-bg/30' : 'border-rs-text-primary/30 text-rs-text-primary hover:bg-rs-text-primary/5')
                                    : 'border-stone-200 text-stone-400 hover:bg-stone-50'
                                )}
                              >
                                <Users2 className="w-3.5 h-3.5" />
                                Contacts
                                <span className={cn(
                                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                                  (r.contacts || []).length > 0
                                    ? (isAdmin ? 'bg-brand-primary text-white' : 'bg-rs-text-primary text-white')
                                    : 'bg-stone-200 text-stone-400'
                                )}>
                                  {(r.contacts || []).length}
                                </span>
                              </button>
                              <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
                            </div>
                          </td>
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
      const filteredRecords = q ? records.filter(r => r.name?.toLowerCase().includes(q) || r.category?.name?.toLowerCase().includes(q) || r.barcode?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Product Master ({filteredRecords.length})
            </h3>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search products…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No products yet.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Category</th>
                      <th className={thCls}>Unit</th>
                      <th className={thCls}>Lower Limit</th>
                      <th className={thCls}>Upper Limit</th>
                      <th className={thCls}>Barcode</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={tdCls}>{r.category?.name || '—'}</td>
                        <td className={tdCls}>{r.unit?.unitName || '—'}</td>
                        <td className={tdCls}>{currencySymbol} {Number(r.lowerLimit).toLocaleString()}</td>
                        <td className={tdCls}>{currencySymbol} {Number(r.upperLimit).toLocaleString()}</td>
                        <td className={tdCls}>{r.barcode || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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

    // ── Payment Method list ──────────────────────────────────────────────────
    if (isPaymentMethod) {
      const filteredRecords = q ? records.filter(r => r.name?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Payment Method Master ({filteredRecords.length})
            </h3>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search payment methods…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No payment methods yet.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse max-w-lg">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}>Category</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={cn(tdCls, 'text-xs font-bold uppercase tracking-widest', r.category === 'CASH' ? 'text-green-600' : r.category === 'BANK' ? 'text-blue-600' : 'text-stone-400')}>{r.category || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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

    // ── Branch list ──────────────────────────────────────────────────────────
    if (isBranch) {
      const filteredRecords = q ? records.filter(r => r.name?.toLowerCase().includes(q) || r.city?.name?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className={cn('w-4 h-4', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')} />
              <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                Branch Master ({filteredRecords.length})
              </h3>
            </div>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search branches…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No branches yet.'}</p>
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
                      <th className={thCls}>Area</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={tdCls}>{r.country?.name || '—'}</td>
                        <td className={tdCls}>{r.state?.name || '—'}</td>
                        <td className={cn(tdCls, 'font-medium')}>{r.city?.name || '—'}</td>
                        <td className={tdCls}>{r.address || '—'}</td>
                        <td className={tdCls}>{r.area || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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

    // ── Warehouse list ───────────────────────────────────────────────────────
    if (isWarehouse) {
      const filteredRecords = q ? records.filter(r => r.name?.toLowerCase().includes(q) || r.area?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Warehouse Master ({filteredRecords.length})
            </h3>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search warehouses…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No warehouses yet.'}</p>
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
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className={tdCls}>{r.area || '—'}</td>
                        <td className={tdCls}>{r.address || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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

    // ── Category list ────────────────────────────────────────────────────────
    if (isCategory) {
      const filteredRecords = q ? records.filter(r => r.name?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Category Master ({filteredRecords.length})
            </h3>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search categories…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No categories yet.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse max-w-lg">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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

    // ── Expense list ─────────────────────────────────────────────────────────
    if (isExpense) {
      const filteredRecords = q ? records.filter(r => r.name?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Expense Master ({filteredRecords.length})
            </h3>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search expenses…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No expense types yet.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse max-w-lg">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Name</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.name}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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

    // ── Unit list ────────────────────────────────────────────────────────────
    if (isUnit) {
      const filteredRecords = q ? records.filter(r => r.unitName?.toLowerCase().includes(q) || r.shortName?.toLowerCase().includes(q)) : records;
      return (
        <div className={dividerCls}>
          <div className="px-4 py-3 md:px-8 md:py-4 flex items-center justify-between gap-4 flex-wrap">
            <h3 className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
              Unit Master ({filteredRecords.length})
            </h3>
            <ListSearch value={listSearch} onChange={setListSearch} placeholder="Search units…" />
          </div>
          <div className="px-8 pb-8">
            {loadingList ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Loading…</p>
            ) : filteredRecords.length === 0 ? (
              <p className={cn('text-center py-8 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>{q ? 'No results found.' : 'No units yet.'}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse max-w-xl">
                  <thead>
                    <tr className={headCls}>
                      <th className={thCls}>#</th>
                      <th className={thCls}>Unit Name</th>
                      <th className={thCls}>Short Name</th>
                      <th className={thCls}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r, i) => (
                      <tr key={r.id} className={trHoverCls}>
                        <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                        <td className={cn(tdCls, 'font-semibold')}>{r.unitName}</td>
                        <td className={tdCls}>{r.shortName || '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button type="button" onClick={() => openView(r)} className={viewBtnCls}>View</button>
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
    <>
    <section className={cn('rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500', isAdmin ? 'bg-white border-brand-bg' : 'bg-white border-stone-100')}>
      {/* Header */}
      <div className={cn('px-4 py-4 md:px-8 md:py-6 border-b flex justify-between items-center', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
        <h2 className={cn('text-2xl font-bold', isAdmin ? (isProduct ? 'font-product-serif text-brand-primary' : 'font-admin-serif text-brand-primary') : 'font-user-serif text-rs-text-primary')}>
          {formTitle}
        </h2>
        <span className={cn('text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full', isAdmin ? 'bg-brand-primary/10 text-brand-primary/70' : 'bg-rs-text-primary/10 text-rs-text-muted')}>
          {displayType}
        </span>
      </div>

      {/* Form */}
      <form className="p-4 md:p-8 space-y-8 md:space-y-12" onSubmit={handleSubmit}>
        {error   && <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"><XCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
        {success && <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

        <div className="min-h-[250px]">{renderFields()}</div>

        <div className={cn('flex justify-between items-center gap-4 pt-6 md:pt-8 border-t', isAdmin ? 'border-brand-bg' : 'border-stone-100')}>
          {showList ? (
            <button type="button" onClick={() => setShowListModal(true)}
              className={cn('flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer', isAdmin ? 'text-brand-primary/60 hover:text-brand-primary' : 'text-rs-text-muted hover:text-rs-text-primary')}>
              <List className="w-4 h-4" /> View Entries
            </button>
          ) : <span />}
          <div className="flex items-center gap-4">
            <button type="button" onClick={resetForm}
              className={cn('px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-stone-50 active:scale-95', isAdmin ? 'border-brand-bg text-brand-primary/60 hover:border-brand-primary/30' : 'border-stone-200 text-rs-text-muted hover:border-stone-300 hover:text-rs-text-primary')}>
              Discard
            </button>
            <button type="submit" disabled={saving}
              className={cn('px-10 py-2.5 rounded-xl font-bold text-sm tracking-wide shadow-sm transition-all hover:shadow-md hover:brightness-110 active:scale-95', saving ? 'opacity-60 cursor-not-allowed' : '', isAdmin ? 'bg-brand-primary text-white' : 'bg-rs-text-primary text-white')}>
              {saving ? 'Saving…' : `Save ${displayType}`}
            </button>
          </div>
        </div>
      </form>
    </section>

      {showListModal && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8 px-4"
          onClick={e => e.target === e.currentTarget && setShowListModal(false)}
        >
          <div className="w-full max-w-7xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => { setShowListModal(false); setListSearch(''); setEditingId(null); setViewRecord(null); }}
                className="flex items-center gap-2 text-xs font-bold text-white/80 uppercase tracking-widest hover:text-white transition-colors cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
            <div className={cn('bg-white rounded-2xl shadow-2xl overflow-hidden', isAdmin ? 'border border-brand-bg' : 'border border-stone-100')}>
              {renderList()}
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 w-full max-w-sm mx-4 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${deleteModalErr ? 'bg-amber-50 border border-amber-100' : 'bg-red-50 border border-red-100'}`}>
                <Trash2 className={`w-5 h-5 ${deleteModalErr ? 'text-amber-500' : 'text-red-500'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-stone-800">Delete {type === 'Branches' ? 'Branch' : type}?</h3>
                {deleteModalErr ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-sm font-semibold text-amber-700">Cannot delete "{deleteModal.label}"</p>
                    <p className="text-sm text-stone-500 leading-relaxed">{deleteModalErr}</p>
                    <p className="text-xs text-stone-400 mt-1">Remove or reassign the linked entries first, then try again.</p>
                  </div>
                ) : (
                  <p className="text-sm text-stone-500 mt-1">
                    <span className="font-semibold text-stone-700">"{deleteModal.label}"</span> will be permanently deleted. This cannot be undone.
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => { setDeleteModal(null); setDeleteModalErr(''); }}
                className="px-5 py-2 rounded-xl text-sm font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 transition-all active:scale-95"
              >
                {deleteModalErr ? 'Close' : 'Cancel'}
              </button>
              {!deleteModalErr && (
                <button
                  type="button"
                  onClick={confirmDelete}
                  disabled={!!deletingId}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-red-500 text-white hover:bg-red-600 transition-all active:scale-95 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deletingId ? 'Deleting…' : 'Yes, Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {viewRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={e => e.target === e.currentTarget && closeView()}
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className={cn('flex items-center justify-between px-6 py-4 border-b', isAdmin ? 'bg-brand-bg/40 border-brand-bg' : 'bg-rs-cream/40 border-stone-100')}>
              <div>
                <p className={cn('text-xs font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Record Details</p>
                <p className={cn('text-base font-bold mt-0.5', isAdmin ? 'font-admin-serif text-brand-primary' : 'font-user-serif text-rs-text-primary')}>
                  {viewRecord.name || viewRecord.unitName || '—'}
                </p>
              </div>
              <button type="button" onClick={closeView} className={cn('cursor-pointer transition-colors', isAdmin ? 'text-brand-primary/30 hover:text-brand-primary' : 'text-stone-400 hover:text-stone-600')}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingId === viewRecord.id ? (
              <>
                <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                  {editError && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{editError}</p>}
                  {(isProduct
                    ? [{ key: 'name', label: 'Name', type: 'text' }, { key: 'lowerLimit', label: 'Lower Limit', type: 'number' }, { key: 'upperLimit', label: 'Upper Limit', type: 'number' }, { key: 'barcode', label: 'Barcode', type: 'text' }]
                    : isBranch || isWarehouse
                    ? [{ key: 'name', label: 'Name', type: 'text' }, { key: 'address', label: 'Address', type: 'text' }, { key: 'area', label: 'Area', type: 'text' }]
                    : isCustomer || isDetailed
                    ? [{ key: 'name', label: 'Name', type: 'text' }, { key: 'phone', label: 'Phone', type: 'text' }, { key: 'email', label: 'Email', type: 'email' }, { key: 'gstNo', label: 'GST No', type: 'text' }, { key: 'address', label: 'Address', type: 'text' }, { key: 'area', label: 'Area', type: 'text' }]
                    : isUnit
                    ? [{ key: 'unitName', label: 'Unit Name', type: 'text' }, { key: 'shortName', label: 'Short Name', type: 'text' }]
                    : isPaymentMethod
                    ? [{ key: 'name', label: 'Name', type: 'text' }, { key: 'category', label: 'Category', type: 'select', options: ['CASH', 'BANK'] }]
                    : [{ key: 'name', label: 'Name', type: 'text' }]
                  ).map(f => (
                    <div key={f.key}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-rs-text-muted mb-1.5">{f.label}</label>
                      {f.type === 'select' ? (
                        <select
                          value={editData[f.key] ?? ''}
                          onChange={e => setEditData(p => ({ ...p, [f.key]: e.target.value }))}
                          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none focus:border-rs-text-primary bg-stone-50"
                        >
                          <option value="">Select…</option>
                          {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input
                          type={f.type}
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
                  <button type="button" onClick={cancelEdit} className="px-4 py-2 rounded-lg text-xs font-semibold border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer">
                    Cancel
                  </button>
                  <button type="button" onClick={() => saveEdit(viewRecord.id)} disabled={savingEdit}
                    className={cn('px-5 py-2 rounded-lg text-xs font-bold text-white hover:brightness-110 disabled:opacity-60 cursor-pointer', isAdmin ? 'bg-brand-primary' : 'bg-rs-text-primary')}>
                    {savingEdit ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="px-6 py-5 grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
                  {(isCustomer || isDetailed
                    ? [
                        { label: 'Name', value: viewRecord.name },
                        { label: 'Phone', value: viewRecord.phone },
                        { label: 'City', value: viewRecord.cityName },
                        { label: 'State', value: viewRecord.stateName },
                        { label: 'Country', value: viewRecord.countryName },
                        { label: 'Area', value: viewRecord.area },
                        { label: 'GST No', value: viewRecord.gstNo },
                        { label: 'Email', value: viewRecord.email },
                        ...(viewRecord.balance !== undefined && viewRecord.balance !== null
                          ? [{ label: 'Balance', value: `${viewRecord.balance >= 0 ? 'CR' : 'DR'} ${currencySymbol}${Math.abs(viewRecord.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}` }]
                          : []),
                      ]
                    : isProduct
                    ? [
                        { label: 'Name', value: viewRecord.name },
                        { label: 'Category', value: viewRecord.category?.name },
                        { label: 'Unit', value: viewRecord.unit?.unitName },
                        { label: 'Lower Limit', value: `${currencySymbol} ${Number(viewRecord.lowerLimit).toLocaleString()}` },
                        { label: 'Upper Limit', value: `${currencySymbol} ${Number(viewRecord.upperLimit).toLocaleString()}` },
                        { label: 'Barcode', value: viewRecord.barcode },
                      ]
                    : isBranch
                    ? [
                        { label: 'Name', value: viewRecord.name },
                        { label: 'Country', value: viewRecord.country?.name },
                        { label: 'State', value: viewRecord.state?.name },
                        { label: 'City', value: viewRecord.city?.name },
                        { label: 'Address', value: viewRecord.address },
                        { label: 'Area', value: viewRecord.area },
                      ]
                    : isWarehouse
                    ? [
                        { label: 'Name', value: viewRecord.name },
                        { label: 'Area', value: viewRecord.area },
                        { label: 'Address', value: viewRecord.address },
                      ]
                    : isPaymentMethod
                    ? [
                        { label: 'Name', value: viewRecord.name },
                        { label: 'Category', value: viewRecord.category },
                      ]
                    : isUnit
                    ? [
                        { label: 'Unit Name', value: viewRecord.unitName },
                        { label: 'Short Name', value: viewRecord.shortName },
                      ]
                    : [{ label: 'Name', value: viewRecord.name }]
                  ).map((p, i) => (
                    <div key={i}>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-rs-text-muted mb-1">{p.label}</p>
                      <p className="text-sm font-semibold text-rs-text-primary">{p.value || '—'}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3">
                  <button type="button" onClick={() => { handleDelete(viewRecord.id); closeView(); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-all cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                  <button type="button" onClick={() => startEdit(viewRecord)}
                    className={cn('inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white hover:brightness-110 transition-all cursor-pointer', isAdmin ? 'bg-brand-primary' : 'bg-rs-text-primary')}>
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {contactsRecord && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto py-8 px-4 animate-in fade-in duration-150"
          onClick={e => e.target === e.currentTarget && setContactsRecord(null)}
        >
          <div className="w-full max-w-4xl animate-in zoom-in-95 duration-150">
            <div className="flex justify-end mb-3">
              <button
                type="button"
                onClick={() => { setContactsRecord(null); setEditingContactId(null); setDeleteContactId(null); setContactErr(''); }}
                className="flex items-center gap-2 text-xs font-bold text-white/80 uppercase tracking-widest hover:text-white transition-colors cursor-pointer bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg border border-white/20"
              >
                <X className="w-4 h-4" /> Close
              </button>
            </div>
            <div className={cn('bg-white rounded-2xl shadow-2xl overflow-hidden', isAdmin ? 'border border-brand-bg' : 'border border-stone-100')}>
              <div className={cn('flex items-center justify-between px-6 py-4 border-b', isAdmin ? 'bg-brand-bg/40 border-brand-bg' : 'bg-rs-cream/40 border-stone-100')}>
                <div>
                  <p className={cn('text-[10px] font-bold uppercase tracking-widest', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>Contact Persons</p>
                  <p className={cn('text-base font-bold mt-0.5', isAdmin ? 'font-admin-serif text-brand-primary' : 'font-user-serif text-rs-text-primary')}>{contactsRecord.name}</p>
                </div>
                <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full', isAdmin ? 'bg-brand-primary/10 text-brand-primary' : 'bg-rs-text-primary/10 text-rs-text-muted')}>
                  {(contactsRecord.contacts || []).length} Contact{(contactsRecord.contacts || []).length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-6 py-5">
                {contactErr && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg mb-4">{contactErr}</p>}
                {(contactsRecord.contacts || []).length === 0 ? (
                  <p className={cn('text-center py-10 text-sm', isAdmin ? 'text-brand-primary/40' : 'text-rs-text-muted')}>No contact persons added for this {isCustomer ? 'customer' : 'supplier'}.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className={cn('border-b', isAdmin ? 'bg-brand-bg/30 border-brand-bg' : 'bg-rs-cream/30 border-stone-100')}>
                          <th className={thCls}>#</th>
                          <th className={thCls}>Name</th>
                          <th className={thCls}>Phone</th>
                          <th className={thCls}>Designation</th>
                          <th className={thCls}>Date of Birth</th>
                          <th className={thCls}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(contactsRecord.contacts || []).map((cp, i) => {
                          const isEditing = editingContactId === cp.id;
                          const isConfirmDelete = deleteContactId === cp.id;
                          return (
                            <tr key={cp.id || i} className={trHoverCls}>
                              <td className={cn(tdCls, 'font-bold w-10 text-stone-400')}>{i + 1}</td>
                              {isEditing ? (
                                <>
                                  <td className="px-3 py-2"><input type="text" value={editContactData.name ?? ''} onChange={e => setEditContactData(p => ({ ...p, name: e.target.value }))} className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-rs-text-primary bg-stone-50" /></td>
                                  <td className="px-3 py-2"><input type="text" value={editContactData.phone ?? ''} onChange={e => setEditContactData(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-rs-text-primary bg-stone-50" /></td>
                                  <td className="px-3 py-2">
                                    <select value={editContactData.designation ?? ''} onChange={e => setEditContactData(p => ({ ...p, designation: e.target.value }))} className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-rs-text-primary bg-stone-50 cursor-pointer">
                                      <option value="">Select…</option>
                                      {['Manager', 'Owner', 'Sales Head', 'Procurement Head', 'Sales Boy', 'President', 'CEO'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                  </td>
                                  <td className="px-3 py-2"><input type="date" value={editContactData.dob ?? ''} onChange={e => setEditContactData(p => ({ ...p, dob: e.target.value }))} className="w-full rounded-lg border border-stone-200 px-3 py-1.5 text-sm outline-none focus:border-rs-text-primary bg-stone-50" /></td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button type="button" onClick={() => { setEditingContactId(null); setContactErr(''); }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer">Cancel</button>
                                      <button type="button" disabled={savingContact} onClick={async () => {
                                        if (!editContactData.name?.trim()) { setContactErr('Name is required'); return; }
                                        setSavingContact(true); setContactErr('');
                                        try {
                                          const updated = await updateContact(cp.id, editContactData);
                                          const updatedContacts = contactsRecord.contacts.map(c => c.id === cp.id ? updated : c);
                                          setContactsRecord(prev => ({ ...prev, contacts: updatedContacts }));
                                          setRecords(prev => prev.map(r => r.id === contactsRecord.id ? { ...r, contacts: updatedContacts } : r));
                                          setEditingContactId(null);
                                        } catch (err) { setContactErr(err.message || 'Save failed'); }
                                        finally { setSavingContact(false); }
                                      }} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-bold text-white disabled:opacity-60 cursor-pointer', isAdmin ? 'bg-brand-primary hover:brightness-110' : 'bg-rs-text-primary hover:brightness-110')}>
                                        {savingContact ? 'Saving…' : 'Save'}
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : isConfirmDelete ? (
                                <>
                                  <td colSpan={4} className={cn(tdCls, 'text-red-500 font-semibold')}>Delete "{cp.name}"? This cannot be undone.</td>
                                  <td className="px-3 py-2 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button type="button" onClick={() => setDeleteContactId(null)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-stone-200 text-stone-500 hover:bg-stone-50 cursor-pointer">Cancel</button>
                                      <button type="button" disabled={deletingContact} onClick={async () => {
                                        setDeletingContact(true); setContactErr('');
                                        try {
                                          await deleteContact(cp.id);
                                          const updatedContacts = contactsRecord.contacts.filter(c => c.id !== cp.id);
                                          setContactsRecord(prev => ({ ...prev, contacts: updatedContacts }));
                                          setRecords(prev => prev.map(r => r.id === contactsRecord.id ? { ...r, contacts: updatedContacts } : r));
                                          setDeleteContactId(null);
                                        } catch (err) { setContactErr(err.message || 'Delete failed'); }
                                        finally { setDeletingContact(false); }
                                      }} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 cursor-pointer">
                                        {deletingContact ? 'Deleting…' : 'Yes, Delete'}
                                      </button>
                                    </div>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className={cn(tdCls, 'font-semibold')}>{cp.name || '—'}</td>
                                  <td className={tdCls}>{cp.phone || '—'}</td>
                                  <td className={tdCls}>{cp.designation || '—'}</td>
                                  <td className={tdCls}>{cp.dob ? cp.dob.split('T')[0].split('-').reverse().join('/') : '—'}</td>
                                  <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <button type="button" onClick={() => { setEditingContactId(cp.id); setEditContactData({ name: cp.name || '', phone: cp.phone || '', designation: cp.designation || '', dob: cp.dob ? cp.dob.split('T')[0] : '' }); setContactErr(''); setDeleteContactId(null); }}
                                        className={cn('px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all cursor-pointer', isAdmin ? 'border-brand-bg text-brand-primary hover:bg-brand-bg/30' : 'border-rs-text-primary/30 text-rs-text-primary hover:bg-rs-text-primary/5')}>
                                        Edit
                                      </button>
                                      <button type="button" onClick={() => { setDeleteContactId(cp.id); setEditingContactId(null); setContactErr(''); }}
                                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-all cursor-pointer">
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {quickCreate && (
        <QuickCreateModal
          type={quickCreate}
          onClose={() => setQuickCreate(null)}
          onCreated={(item) => {
            if (quickCreate === 'Category') {
              setCategories(prev => [...prev, item]);
              setSelCategory(String(item.id));
            } else if (quickCreate === 'Unit') {
              setUnits(prev => [...prev, item]);
              setSelUnit(String(item.id));
            }
            setQuickCreate(null);
          }}
        />
      )}
    </>
  );
};

export default MasterForm;
