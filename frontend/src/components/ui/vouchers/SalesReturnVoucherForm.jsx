import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAutoRefresh, emitDataChange } from '../../../hooks/useAutoRefresh';
import { Plus, X, ExternalLink, List } from 'lucide-react';
import SelectSearch from '../SelectSearch';

const PAYMENT_TERMS_OPTIONS = [
  { id: '60 Days Consignment Basis', name: '60 Days Consignment Basis' },
  { id: '45 Days Consignment Basis', name: '45 Days Consignment Basis' },
  { id: '30 Days Consignment Basis', name: '30 Days Consignment Basis' },
  { id: '15 Days Consignment Basis', name: '15 Days Consignment Basis' },
  { id: 'Cash', name: 'Cash' },
];
import { Link, useNavigate } from 'react-router-dom';
import { getCustomers, getProducts, getWarehouses, getMasterBranchMasters } from '../../../api/masters';
import { getSalesReturnNextNo, saveSalesReturnVoucher, getSalesReturns, updateSalesReturnVoucher, deleteSalesReturnVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import VoucherListModal, { fmtDate } from './VoucherListModal';

const emptyRow = () => ({ id: Date.now() + Math.random(), productId: '', warehouseId: '', qty: 1, rate: 0, amount: 0 });

const SalesReturnVoucherForm = () => {
  const type = 'Sales Return';
  const { activeBranch, currencySymbol, canAccessMaster } = useAuth();
  const navigate = useNavigate();

  const [rows,         setRows]        = useState([emptyRow()]);
  const [date,         setDate]        = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo,    setVoucherNo]   = useState('');
  const [partyKey,     setPartyKey]    = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [narration,    setNarration]   = useState('');
  const [customers,    setCustomers]   = useState([]);
  const [branches,     setBranches]    = useState([]);
  const [products,     setProducts]    = useState([]);
  const [warehouses,   setWarehouses]  = useState([]);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [vouchers, setVouchers]               = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showList,        setShowList]        = useState(false);

  const refreshVouchers = useCallback(() => { getSalesReturns().then(setVouchers).catch(console.error); }, []);
  useAutoRefresh(refreshVouchers, 15000);

  const partyOptions = useMemo(() => [
    ...customers.map(c => ({ id: `customer_${c.id}`, name: `${c.name} (Customer)` })),
    ...branches.map(b =>  ({ id: `branch_${b.id}`,   name: `${b.name} (Branch)` })),
  ], [customers, branches]);

  const COLUMNS = [
    { key: 'voucherNo',    label: 'Voucher No' },
    { key: 'date',         label: 'Date',          render: v => fmtDate(v.date) },
    { key: 'customer',     label: 'Party',         render: v => v.customerName || v.customer?.name || '—' },
    { key: 'paymentTerms', label: 'Payment Terms', render: v => v.paymentTerms || '—' },
    { key: 'items',        label: 'Products',      render: v => { const items = v.items || []; if (!items.length) return '—'; const first = items[0].product?.name || items[0].productName || '—'; return items.length > 1 ? `${first} +${items.length - 1}` : first; } },
    { key: '_qty',         label: 'Qty',           render: v => { const items = v.items || []; const t = items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0); return t || '—'; } },
    { key: '_rate',        label: 'Rate',          render: v => { const i = (v.items || [])[0]; return i?.rate != null ? Number(i.rate).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '—'; } },
    { key: 'totalAmount',  label: 'Amount',        render: v => `₹${Number(v.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { key: 'narration',    label: 'Narration',     render: v => v.narration || '—' },
    { key: 'branch',       label: 'Branch',        render: v => v.branch?.name || '—',    detailOnly: true },
    { key: 'createdBy',    label: 'Created By',    render: v => v.createdBy?.name || '—', detailOnly: true },
  ];
  const EDIT_FIELDS = [
    { key: 'partyKey', label: 'Customer / Party', type: 'select', options: partyOptions,
      getValue: (v) => {
        if (v.particularType === 'customer' && v.customerId) return `customer_${v.customerId}`;
        if (v.particularType === 'branch' && v.customerName) {
          const found = partyOptions.find(o => o.name === `${v.customerName} (Branch)`);
          return found ? found.id : '';
        }
        return '';
      },
    },
    { key: 'date',      label: 'Date',      type: 'date' },
    { key: 'narration', label: 'Narration',  type: 'textarea', placeholder: 'Optional remarks' },
    { key: 'items',     label: 'Products',   type: 'items' },
  ];

  useEffect(() => {
    setLoadingVouchers(true);
    Promise.all([getCustomers(), getMasterBranchMasters(), getProducts(), getWarehouses(), getSalesReturnNextNo(), getSalesReturns()])
      .then(([cust, brs, prod, wh, vn, vlist]) => {
        setCustomers(cust); setBranches(brs); setProducts(prod); setWarehouses(wh); setVoucherNo(vn.voucherNo); setVouchers(vlist);
      }).catch(err => setError(err?.message || 'Failed to load form data'))
        .finally(() => setLoadingVouchers(false));
  }, [activeBranch?.id]);

  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id)); };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      updated.amount = Math.round(parseFloat(updated.qty || 0) * parseFloat(updated.rate || 0) * 100) / 100;
      return updated;
    }));
  };

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!partyKey)     return setError('Please select a customer or branch');
    if (!paymentTerms) return setError('Please select payment terms');
    const validItems = rows.filter(r => r.productId && parseFloat(r.qty) > 0);
    if (!validItems.length) return setError('Please add at least one product with quantity');
    const [pType, pId] = partyKey.split('_');
    const partyName = partyOptions.find(o => o.id === partyKey)?.name.replace(/ \((Customer|Branch)\)$/, '') || '';
    setSaving(true);
    try {
      const voucher = await saveSalesReturnVoucher({
        date,
        particularType: pType,
        particularId:   parseInt(pId),
        particularName: partyName.toUpperCase(),
        paymentTerms,
        narration:      narration ? narration.toUpperCase() : undefined,
        branchId:       activeBranch?.id,
        items: validItems.map(r => ({
          productId:   parseInt(r.productId),
          warehouseId: r.warehouseId ? parseInt(r.warehouseId) : undefined,
          qty:         parseFloat(r.qty),
          rate:        parseFloat(r.rate),
        })),
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved successfully!`);
      setRows([emptyRow()]); setPartyKey(''); setPaymentTerms(''); setNarration('');
      const [vn, vlist] = await Promise.all([getSalesReturnNextNo(), getSalesReturns()]);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
      emitDataChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setRows([emptyRow()]); setPartyKey(''); setPaymentTerms(''); setNarration('');
    setError(''); setSuccess('');
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

      <form className="p-4 md:p-8 space-y-6 md:space-y-10" onSubmit={handleSubmit} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSubmit(e); } }}>
        {error   && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">{success}</p>}

        {activeBranch && (
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-stone-50 border border-stone-100 max-w-xs">
            <span className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Branch</span>
            <span className="text-sm font-semibold text-rs-text-primary">{activeBranch.name}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Date</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <input className="w-full bg-transparent text-sm font-medium outline-none" type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Voucher No</label>
            <div className="relative border-b border-stone-100 pb-1">
              <input className="w-full bg-transparent text-sm font-bold text-rs-text-primary outline-none" readOnly value={voucherNo} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Party (Customer / Branch)</label>
              {canAccessMaster('Customer') && <button type="button" onClick={() => navigate('/dashboard/master/customer')} className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all cursor-pointer" title="Go to Customer Master"><Plus className="w-4 h-4" /></button>}
            </div>
            <SelectSearch
              value={partyKey}
              onChange={setPartyKey}
              options={partyOptions}
              placeholder="Select Customer or Branch"
            />
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Terms</label>
          <SelectSearch
            value={paymentTerms}
            onChange={setPaymentTerms}
            options={PAYMENT_TERMS_OPTIONS}
            placeholder="Select Payment Terms"
          />
        </div>

        {/* Product Table — warehouse + available per row */}
        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Product Details</h5>

          {/* Mobile card view */}
          <div className="flex flex-col gap-3 md:hidden">
            {rows.map(row => (
              <div key={row.id} className="border border-stone-200 rounded-xl p-4 bg-white space-y-3 relative">
                <button type="button" onClick={() => removeRow(row.id)}
                  className="absolute top-3 right-3 text-stone-300 hover:text-rose-500 transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
                <div>
                  <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block mb-1">Product</label>
                  <SelectSearch
                    value={row.productId}
                    onChange={v => updateRow(row.id, 'productId', v)}
                    options={products}
                    placeholder="Select Product"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block mb-1">Return to Warehouse</label>
                  <SelectSearch
                    value={row.warehouseId}
                    onChange={v => updateRow(row.id, 'warehouseId', v)}
                    options={warehouses}
                    placeholder="Select Warehouse"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block mb-1">Qty</label>
                    <input className="w-full text-right bg-rs-cream/30 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rs-text-primary"
                      type="number" min="0" value={row.qty === 0 ? '' : row.qty}
                      onFocus={e => e.target.select()}
                      onChange={e => updateRow(row.id, 'qty', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block mb-1">Rate</label>
                    <input className="w-full text-right bg-rs-cream/30 border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-rs-text-primary"
                      type="number" min="0" value={row.rate === 0 ? '' : row.rate}
                      onFocus={e => e.target.select()}
                      onChange={e => updateRow(row.id, 'rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block mb-1">Total</label>
                    <p className="text-right font-bold text-rs-text-primary text-sm py-2">{currencySymbol} {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name {canAccessMaster('Product') && <Link to="/dashboard/master/product" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Product Master"><ExternalLink className="w-4 h-4" /></Link>}</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-40">Return to Warehouse {canAccessMaster('Warehouse') && <Link to="/dashboard/master/warehouse" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Warehouse Master"><ExternalLink className="w-4 h-4" /></Link>}</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Qty</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Rate</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map(row => (
                    <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.productId}
                          onChange={v => updateRow(row.id, 'productId', v)}
                          options={products}
                          placeholder="Select Product"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.warehouseId}
                          onChange={v => updateRow(row.id, 'warehouseId', v)}
                          options={warehouses}
                          placeholder="Select Warehouse"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none"
                          type="number" min="0" value={row.qty === 0 ? '' : row.qty}
                          onFocus={e => e.target.select()}
                          onChange={e => updateRow(row.id, 'qty', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none"
                          type="number" min="0" value={row.rate === 0 ? '' : row.rate}
                          onFocus={e => e.target.select()}
                          onChange={e => updateRow(row.id, 'rate', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rs-text-primary">
                        {currencySymbol} {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-3 text-center">
                        <button type="button" onClick={() => removeRow(row.id)}
                          className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer">
                          <X className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" onClick={addRow}
            className="flex items-center gap-2 text-rs-text-primary font-bold text-[10px] uppercase tracking-widest mt-4 hover:opacity-70 transition-opacity cursor-pointer">
            <Plus className="w-4 h-4" /> Add Product Row
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors"
              placeholder="Enter additional details..." rows="4" value={narration} onChange={e => setNarration(e.target.value)} />
          </div>
          <div className="w-full md:w-80 flex flex-col justify-end">
            <div className="flex justify-between items-end">
              <span className="font-bold text-rs-text-primary text-sm uppercase tracking-widest">Grand Total</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {currencySymbol} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={() => setShowList(true)}
            className="flex items-center justify-center sm:justify-start gap-2 bg-rs-text-primary text-white px-5 py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer">
            <List className="w-4 h-4" /> View Entries
          </button>
          <div className="flex items-center gap-4 sm:gap-8">
            <button type="button" onClick={handleDiscard}
              className="flex-1 sm:flex-none text-center sm:text-left text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer py-2 sm:py-0">
              Discard
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 sm:flex-none bg-rs-text-primary text-white px-4 sm:px-12 py-3 sm:py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
              {saving ? 'Saving…' : `Save ${type} Voucher`}
            </button>
          </div>
        </div>
      </form>
    </section>

      <VoucherListModal
        isOpen={showList}
        onClose={() => setShowList(false)}
        title="Sales Return Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={async (id) => { await deleteSalesReturnVoucher(id); setVouchers(p => p.filter(v => v.id !== id)); emitDataChange(); }}
        onUpdate={async (id, data) => {
          const payload = { ...data };
          if (data.partyKey !== undefined) {
            const key = data.partyKey || '';
            const us = key.indexOf('_');
            if (us !== -1) {
              payload.particularType = key.substring(0, us);
              const partyId = key.substring(us + 1);
              const opt = partyOptions.find(o => o.id === key);
              const name = opt ? opt.name.replace(/ \((Customer|Branch)\)$/, '') : '';
              if (payload.particularType === 'customer') { payload.customerId = partyId; payload.customerName = name; }
              else { payload.customerName = name; }
            }
            delete payload.partyKey;
          }
          const u = await updateSalesReturnVoucher(id, payload);
          setVouchers(p => p.map(v => v.id === id ? { ...v, ...u } : v));
          emitDataChange();
        }}
        loading={loadingVouchers}
      />
    </>
  );
};

export default SalesReturnVoucherForm;
