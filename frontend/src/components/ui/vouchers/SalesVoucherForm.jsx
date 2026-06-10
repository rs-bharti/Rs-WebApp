import { useState, useEffect } from 'react';
import { Plus, X, ExternalLink } from 'lucide-react';
import SelectSearch from '../SelectSearch';

const PAYMENT_TERMS_OPTIONS = [
  { id: '60 Days Consignment Basis', name: '60 Days Consignment Basis' },
  { id: '45 Days Consignment Basis', name: '45 Days Consignment Basis' },
  { id: '30 Days Consignment Basis', name: '30 Days Consignment Basis' },
  { id: '15 Days Consignment Basis', name: '15 Days Consignment Basis' },
  { id: 'Cash', name: 'Cash' },
];
import { Link } from 'react-router-dom';
import { getCustomers, getProducts, getWarehouses } from '../../../api/masters';
import { getSalesVoucherNextNo, saveSalesVoucher, getStockQty, getSales, updateSalesVoucher, deleteSalesVoucher } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';
import VoucherList, { fmtDate } from './VoucherList';

const emptyRow = () => ({ id: Date.now() + Math.random(), productId: '', warehouseId: '', qty: 1, rate: 0, amount: 0, lowerLimit: null, upperLimit: null, stockQty: null });

const SalesVoucherForm = () => {
  const type = 'Sales';
  const { activeBranch, currencySymbol } = useAuth();

  const [rows,            setRows]            = useState([emptyRow()]);
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo,       setVoucherNo]       = useState('');
  const [customerId,      setCustomerId]      = useState('');
  const [paymentTerms,    setPaymentTerms]    = useState('');
  const [narration,       setNarration]       = useState('');
  const [customers,       setCustomers]       = useState([]);
  const [products,        setProducts]        = useState([]);
  const [warehouses,      setWarehouses]      = useState([]);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');
  const [vouchers, setVouchers]               = useState([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);

  const COLUMNS = [
    { key: 'voucherNo',    label: 'Voucher No' },
    { key: 'date',         label: 'Date',     render: v => fmtDate(v.date) },
    { key: 'customer',     label: 'Customer', render: v => v.customer?.name || v.customerName || '—' },
    { key: 'paymentTerms', label: 'Terms',    render: v => v.paymentTerms || '—' },
    { key: 'totalAmount',  label: 'Total',    render: v => `₹${Number(v.totalAmount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}` },
    { key: 'items',        label: 'Items',    render: v => v.items?.length ?? '—' },
    { key: 'narration',    label: 'Narration', render: v => v.narration || '—' },
  ];
  const EDIT_FIELDS = [
    { key: 'date',      label: 'Date',      type: 'date' },
    { key: 'narration', label: 'Narration',  type: 'textarea', placeholder: 'Optional remarks' },
  ];

  useEffect(() => {
    setLoadingVouchers(true);
    Promise.all([getCustomers(), getProducts(), getWarehouses(), getSalesVoucherNextNo(), getSales()])
      .then(([cust, prod, wh, vn, vlist]) => {
        setCustomers(cust); setProducts(prod); setWarehouses(wh); setVoucherNo(vn.voucherNo); setVouchers(vlist);
      }).catch(err => setError(err?.message || 'Failed to load form data'))
      .finally(() => setLoadingVouchers(false));
  }, [activeBranch?.id]);

  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id)); };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      updated.amount = parseFloat(updated.qty || 0) * parseFloat(updated.rate || 0);
      if (field === 'productId') {
        const prod = products.find(p => String(p.id) === String(value));
        updated.lowerLimit = prod?.lowerLimit ?? null;
        updated.upperLimit = prod?.upperLimit ?? null;
        updated.stockQty = null;
      }
      if (field === 'warehouseId') updated.stockQty = null;
      return updated;
    }));
    if (field === 'productId' || field === 'warehouseId') {
      const currentRow = rows.find(r => r.id === id);
      if (!currentRow) return;
      const pId = field === 'productId' ? value : currentRow.productId;
      const wId = field === 'warehouseId' ? value : currentRow.warehouseId;
      if (pId && wId) {
        getStockQty(pId, wId)
          .then(data => setRows(curr => curr.map(r => r.id === id ? { ...r, stockQty: data.qty ?? 0 } : r)))
          .catch(() => setRows(curr => curr.map(r => r.id === id ? { ...r, stockQty: 0 } : r)));
      }
    }
  };

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!customerId)    return setError('Please select a customer');
    if (!paymentTerms)  return setError('Please select payment terms');
    const validItems = rows.filter(r => r.productId && parseFloat(r.qty) > 0);
    if (!validItems.length) return setError('Please add at least one product with quantity');

    const overStock = validItems.filter(r =>
      r.warehouseId && r.stockQty !== null && parseFloat(r.qty) > r.stockQty
    );
    if (overStock.length) return setError('One or more items exceed available stock. Please reduce the quantity.');

    setSaving(true);
    try {
      const voucher = await saveSalesVoucher({
        date,
        customerId:   parseInt(customerId),
        paymentTerms,
        warehouseId:  validItems[0]?.warehouseId ? parseInt(validItems[0].warehouseId) : undefined,
        narration:       narration || undefined,
        branchId:        activeBranch?.id,
        items: validItems.map(r => ({
          productId:   parseInt(r.productId),
          warehouseId: r.warehouseId ? parseInt(r.warehouseId) : undefined,
          qty:         parseFloat(r.qty),
          rate:        parseFloat(r.rate),
        })),
      });
      setSuccess(`Voucher ${voucher.voucherNo} saved successfully!`);
      setRows([emptyRow()]); setCustomerId(''); setPaymentTerms(''); setNarration('');
      const [vn, vlist] = await Promise.all([getSalesVoucherNextNo(), getSales()]);
      setVoucherNo(vn.voucherNo);
      setVouchers(vlist);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setRows([emptyRow()]); setCustomerId(''); setPaymentTerms(''); setNarration('');
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

      <form className="p-4 md:p-8 space-y-6 md:space-y-10" onSubmit={handleSubmit}>
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
              <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Customer Name</label>
              <Link to="/dashboard/master/customer" className="text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all" title="Go to Customer Master"><ExternalLink className="w-4 h-4" /></Link>
            </div>
            <SelectSearch
              value={customerId}
              onChange={setCustomerId}
              options={customers.map(c => { const bal = c.balance ?? 0; return { ...c, label: `${c.name} — ${bal >= 0 ? 'CR' : 'DR'} ${currencySymbol}${Math.abs(bal).toLocaleString()}` }; })}
              placeholder="Select Customer"
            />
            {customerId && (() => {
              const c = customers.find(c => String(c.id) === String(customerId));
              if (!c) return null;
              const bal = c.balance ?? 0;
              const isCR = bal >= 0;
              return (
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${isCR ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-500 border border-red-200'}`}>
                  {isCR ? 'CR' : 'DR'} {currencySymbol}{Math.abs(bal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              );
            })()}
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[1050px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name <Link to="/dashboard/master/product" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Product Master"><ExternalLink className="w-4 h-4" /></Link></th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-40">Warehouse <Link to="/dashboard/master/warehouse" className="inline-flex items-center justify-center ml-1 text-rs-text-muted hover:text-rs-text-primary bg-rs-text-primary/10 hover:bg-rs-text-primary/20 rounded p-0.5 transition-all align-middle" title="Go to Warehouse Master"><ExternalLink className="w-4 h-4" /></Link></th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Avl. Stock</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Qty</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Rate</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map(row => {
                  const rate       = parseFloat(row.rate) || 0;
                  const belowMin   = row.lowerLimit !== null && rate > 0 && rate < row.lowerLimit;
                  const aboveMax   = row.upperLimit !== null && rate > row.upperLimit;
                  return (
                    <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">

                      {/* Product */}
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.productId}
                          onChange={v => updateRow(row.id, 'productId', v)}
                          options={products}
                          placeholder="Select Product"
                        />
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3">
                        <SelectSearch
                          variant="inline"
                          value={row.warehouseId}
                          onChange={v => updateRow(row.id, 'warehouseId', v)}
                          options={warehouses}
                          placeholder="Select Warehouse"
                        />
                      </td>

                      {/* Avl. Stock */}
                      <td className="px-4 py-3 text-right">
                        {row.warehouseId && row.productId ? (
                          row.stockQty === null
                            ? <span className="text-[10px] text-stone-400">…</span>
                            : <span className={`font-bold text-sm ${row.stockQty <= 0 ? 'text-red-500' : 'text-emerald-600'}`}>{row.stockQty}</span>
                        ) : <span className="text-stone-300">—</span>}
                      </td>

                      {/* Qty */}
                      <td className="px-4 py-3 text-right">
                        {(() => {
                          const exceedsStock = row.warehouseId && row.productId && row.stockQty !== null && parseFloat(row.qty) > row.stockQty;
                          return (
                            <>
                              <input className={`w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none ${exceedsStock ? 'text-red-500 font-bold' : ''}`}
                                type="number" min="0" step="any" value={row.qty}
                                onChange={e => updateRow(row.id, 'qty', parseFloat(e.target.value) || 0)} />
                              {exceedsStock && (
                                <div className="text-[10px] text-right text-red-500 font-semibold mt-0.5">Max: {row.stockQty}</div>
                              )}
                            </>
                          );
                        })()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <input className={`w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none ${belowMin || aboveMax ? 'text-amber-600 font-bold' : ''}`}
                          type="number" min="0" value={row.rate}
                          onChange={e => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)} />
                        {belowMin && <div className="text-[10px] text-right text-amber-500 font-semibold mt-0.5">Below min {currencySymbol}{row.lowerLimit}</div>}
                        {aboveMax && <div className="text-[10px] text-right text-amber-500 font-semibold mt-0.5">Above max {currencySymbol}{row.upperLimit}</div>}
                        {!belowMin && !aboveMax && row.lowerLimit !== null && row.upperLimit !== null && (
                          <div className="text-[10px] text-right text-stone-400 mt-0.5">{currencySymbol}{row.lowerLimit}–{currencySymbol}{row.upperLimit}</div>
                        )}
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
                  );
                })}
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

        <div className="flex justify-end items-center gap-8 pt-6 md:pt-8 border-t border-stone-100">
          <button type="button" onClick={handleDiscard}
            className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer">
            Discard
          </button>
          <button type="submit" disabled={saving}
            className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-60">
            {saving ? 'Saving…' : `Save ${type} Voucher`}
          </button>
        </div>
      </form>
    </section>

      <VoucherList
        title="Sales Voucher Entries"
        vouchers={vouchers}
        columns={COLUMNS}
        editFields={EDIT_FIELDS}
        onDelete={async (id) => { await deleteSalesVoucher(id); setVouchers(p => p.filter(v => v.id !== id)); }}
        onUpdate={async (id, data) => { const u = await updateSalesVoucher(id, data); setVouchers(p => p.map(v => v.id === id ? { ...v, ...u } : v)); }}
        loading={loadingVouchers}
      />
    </>
  );
};

export default SalesVoucherForm;
