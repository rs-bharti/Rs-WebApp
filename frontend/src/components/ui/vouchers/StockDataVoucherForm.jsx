import React, { useState } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';

const StockDataVoucherForm = () => {
  const type = 'Stock Data';

  const [rows, setRows] = useState([{ id: 1, product: '', qty: 1 }]);

  const addRow = () => {
    setRows(prev => [...prev, { id: Date.now(), product: '', qty: 1 }]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(prev => prev.filter(row => row.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const totalQty = rows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0);

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New {type} Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: SDV-2026-001
        </span>
      </div>

      <form className="p-8 space-y-10" onSubmit={(e) => e.preventDefault()}>
        {/* Header Row: Date, Voucher No, Warehouse */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Date</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <input
                className="w-full bg-transparent text-sm font-medium outline-none"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Voucher No</label>
            <div className="relative border-b border-stone-100 pb-1">
              <input
                className="w-full bg-transparent text-sm font-bold text-rs-text-primary outline-none"
                readOnly
                type="text"
                value="SDV-2026-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Warehouse</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer">
                <option value="" disabled selected>Select Warehouse</option>
                <option>Main Warehouse</option>
                <option>North Zone Warehouse</option>
                <option>South Zone Warehouse</option>
                <option>Central Depot</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Product Table */}
        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Stock Items</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">#</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Quantity</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map((row, index) => (
                  <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">
                    <td className="px-4 py-4 text-rs-text-muted font-bold text-xs w-10">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <select
                          className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer font-medium"
                          value={row.product}
                          onChange={(e) => updateRow(row.id, 'product', e.target.value)}
                        >
                          <option value="">Select Product</option>
                          <option value="notebook">Premium Leather Notebook</option>
                          <option value="ink">Archival Grade Blue Ink</option>
                          <option value="pen">Calligraphy Pen Set</option>
                          <option value="paper">Bond Paper Ream</option>
                          <option value="stapler">Heavy Duty Stapler</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none flex-shrink-0" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input
                        className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none font-bold text-rs-text-primary"
                        type="number"
                        min="0"
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, 'qty', e.target.value)}
                      />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="text-stone-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-2 text-rs-text-primary font-bold text-[10px] uppercase tracking-widest mt-4 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Product Row
          </button>
        </div>

        {/* Bottom: Narration + Total Qty */}
        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea
              className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors"
              placeholder="Enter additional details..."
              rows="4"
            ></textarea>
          </div>

          <div className="w-full md:w-72 flex flex-col justify-end">
            <div className="bg-rs-cream/40 rounded-xl p-5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">Total Quantity</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {totalQty.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-8 pt-8 border-t border-stone-100">
          <button
            className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer"
            type="reset"
          >
            Discard
          </button>
          <button
            className="bg-rs-text-primary text-white px-12 py-4 rounded-lg font-bold text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-sm cursor-pointer"
            type="submit"
          >
            Save {type} Voucher
          </button>
        </div>
      </form>
    </section>
  );
};

export default StockDataVoucherForm;
