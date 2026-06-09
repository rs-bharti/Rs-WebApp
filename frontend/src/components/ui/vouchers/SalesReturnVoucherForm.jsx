import { useState, useEffect } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { getCustomers, getProducts, getWarehouses, getPaymentMethods } from '../../../api/masters';
import { getSalesReturnNextNo, saveSalesReturnVoucher, getStockQty } from '../../../api/vouchers';
import { useAuth } from '../../../context/AuthContext';

const emptyRow = () => ({ id: Date.now() + Math.random(), productId: '', warehouseId: '', qty: 1, rate: 0, amount: 0, availableQty: null, loadingQty: false });

const SalesReturnVoucherForm = () => {
  const type = 'Sales Return';
  const { activeBranch } = useAuth();

  const [rows,            setRows]            = useState([emptyRow()]);
  const [date,            setDate]            = useState(new Date().toISOString().split('T')[0]);
  const [voucherNo,       setVoucherNo]       = useState('');
  const [customerId,      setCustomerId]      = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [narration,       setNarration]       = useState('');
  const [customers,       setCustomers]       = useState([]);
  const [products,        setProducts]        = useState([]);
  const [warehouses,      setWarehouses]      = useState([]);
  const [paymentMethods,  setPaymentMethods]  = useState([]);
  const [saving,          setSaving]          = useState(false);
  const [error,           setError]           = useState('');
  const [success,         setSuccess]         = useState('');

  useEffect(() => {
    setPaymentMethodId(''); setPaymentMethods([]);
    Promise.all([getCustomers(), getProducts(), getWarehouses(), getPaymentMethods(), getSalesReturnNextNo()])
      .then(([cust, prod, wh, pm, vn]) => {
        setCustomers(cust); setProducts(prod); setWarehouses(wh); setPaymentMethods(pm); setVoucherNo(vn.voucherNo);
      }).catch(() => setError('Failed to load form data'));
  }, [activeBranch?.id]);

  const fetchRowStock = async (id, productId, warehouseId) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, loadingQty: true, availableQty: null } : r));
    try {
      const data = await getStockQty(productId, warehouseId);
      setRows(prev => prev.map(r => r.id === id ? { ...r, availableQty: data.qty ?? 0, loadingQty: false } : r));
    } catch {
      setRows(prev => prev.map(r => r.id === id ? { ...r, availableQty: null, loadingQty: false } : r));
    }
  };

  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (id) => { if (rows.length > 1) setRows(prev => prev.filter(r => r.id !== id)); };

  const updateRow = (id, field, value) => {
    let shouldFetch = false;
    let fetchPid, fetchWid;

    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      updated.amount = parseFloat(updated.qty || 0) * parseFloat(updated.rate || 0);
      if (field === 'productId' || field === 'warehouseId') {
        updated.availableQty = null;
        fetchPid = field === 'productId'   ? value : r.productId;
        fetchWid = field === 'warehouseId' ? value : r.warehouseId;
        shouldFetch = !!(fetchPid && fetchWid);
      }
      return updated;
    }));

    if (shouldFetch) fetchRowStock(id, fetchPid, fetchWid);
  };

  const totalAmount = rows.reduce((s, r) => s + r.amount, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!customerId)      return setError('Please select a customer');
    if (!paymentMethodId) return setError('Please select a payment method');
    const validItems = rows.filter(r => r.productId && parseFloat(r.qty) > 0);
    if (!validItems.length) return setError('Please add at least one product with quantity');
    setSaving(true);
    try {
      const voucher = await saveSalesReturnVoucher({
        date,
        customerId:      parseInt(customerId),
        paymentMethodId: parseInt(paymentMethodId),
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
      setRows([emptyRow()]); setCustomerId(''); setPaymentMethodId(''); setNarration('');
      const vn = await getSalesReturnNextNo();
      setVoucherNo(vn.voucherNo);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setRows([emptyRow()]); setCustomerId(''); setPaymentMethodId(''); setNarration('');
    setError(''); setSuccess('');
  };

  return (
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
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Customer Name</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer"
                value={customerId} onChange={e => setCustomerId(e.target.value)} required>
                <option value="" disabled>Select Customer</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method</label>
          <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
            <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer"
              value={paymentMethodId} onChange={e => setPaymentMethodId(e.target.value)} required>
              <option value="" disabled>Select Payment Method</option>
              {paymentMethods.map(pm => <option key={pm.id} value={pm.id}>{pm.name}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
          </div>
        </div>

        {/* Product Table — warehouse + available per row */}
        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Product Details</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted w-40">Return to Warehouse</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Qty</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Rate</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map(row => {
                  const avail = row.availableQty;
                  return (
                    <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">

                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <select className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer font-medium"
                            value={row.productId} onChange={e => updateRow(row.id, 'productId', e.target.value)}>
                            <option value="">Select Product</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none flex-shrink-0" />
                        </div>
                      </td>

                      {/* Warehouse */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <select className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer text-xs"
                            value={row.warehouseId} onChange={e => updateRow(row.id, 'warehouseId', e.target.value)}>
                            <option value="">Select Warehouse</option>
                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                          </select>
                          <ChevronDown className="w-3.5 h-3.5 text-stone-400 pointer-events-none flex-shrink-0" />
                        </div>
                      </td>

                      {/* Qty + available (informational for returns) */}
                      <td className="px-4 py-3 text-right">
                        <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none"
                          type="number" min="0" value={row.qty}
                          onChange={e => updateRow(row.id, 'qty', parseFloat(e.target.value) || 0)} />
                        {row.loadingQty && <div className="text-[10px] text-stone-400 text-right">checking…</div>}
                        {!row.loadingQty && avail !== null && (
                          <div className="text-[10px] text-right font-medium text-stone-400">
                            in stock: {avail}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <input className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none"
                          type="number" min="0" value={row.rate}
                          onChange={e => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)} />
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rs-text-primary">
                        ₹ {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                ₹ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
  );
};

export default SalesReturnVoucherForm;
