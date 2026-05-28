import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Plus, X, Calendar, ChevronDown } from 'lucide-react';

const SalesVoucherForm = () => {
  const type = 'Sales';
  const [rows, setRows] = useState([{ id: 1, product: '', qty: 1, rate: 0, amount: 0 }]);

  const addRow = () => {
    setRows([...rows, { id: Date.now(), product: '', qty: 1, rate: 0, amount: 0 }]);
  };

  const removeRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        // Recalculate derived fields
        updatedRow.amount = updatedRow.qty * updatedRow.rate;
        return updatedRow;
      }
      return row;
    }));
  };

  const totals = rows.reduce((acc, row) => {
    acc.totalAmount += row.amount;
    return acc;
  }, { totalAmount: 0 });

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New {type} Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: {type.charAt(0)}V-2026-001
        </span>
      </div>

      <form className="p-8 space-y-10" onSubmit={(e) => e.preventDefault()}>
        {/* Header Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Date</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <input className="w-full bg-transparent text-sm font-medium outline-none" type="date" defaultValue={new Date().toISOString().split('T')[0]}/>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Voucher No</label>
            <div className="relative border-b border-stone-100 pb-1">
              <input className="w-full bg-transparent text-sm font-bold text-rs-text-primary outline-none" readOnly type="text" value={`${type.charAt(0)}V-2026-001`}/>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Customer Name</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
              <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer">
                <option disabled selected>Select Entity</option>
                <option>Elite Paper Supplies Co.</option>
                <option>Global Logistics Ltd.</option>
                <option>Vintage Ink Manufacturers</option>
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Transactional Table Section */}
        <div className="space-y-4">
          <h5 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Product Details</h5>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-rs-cream/30 border-b border-stone-100">
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted">Product Name</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-20">Qty</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-24">Rate</th>
                  <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-widest text-rs-text-muted text-right w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {rows.map((row) => (
                  <tr key={row.id} className="group hover:bg-rs-cream/10 transition-colors">
                    <td className="px-4 py-4">
                      <select 
                        className="w-full bg-transparent border-none p-0 focus:ring-0 outline-none cursor-pointer font-medium"
                        onChange={(e) => updateRow(row.id, 'product', e.target.value)}
                      >
                        <option value="">Select Product</option>
                        <option value="notebook">Premium Leather Notebook</option>
                        <option value="ink">Archival Grade Blue Ink</option>
                        <option value="pen">Calligraphy Pen Set</option>
                      </select>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input 
                        className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none" 
                        type="number" 
                        value={row.qty}
                        onChange={(e) => updateRow(row.id, 'qty', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <input 
                        className="w-full text-right bg-transparent border-none p-0 focus:ring-0 outline-none" 
                        type="number" 
                        value={row.rate}
                        onChange={(e) => updateRow(row.id, 'rate', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-4 py-4 text-right font-bold text-rs-text-primary">
                      ₹ {row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

        {/* Bottom Section: Narration & Totals */}
        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Narration (Remarks)</label>
            <textarea 
              className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors" 
              placeholder="Enter additional details..." 
              rows="4"
            ></textarea>
          </div>
          
          <div className="w-full md:w-80 space-y-4">
            <div className="flex justify-between items-end">
              <span className="font-bold text-rs-text-primary text-sm uppercase tracking-widest">Grand Total</span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                ₹ {totals.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end items-center gap-8 pt-8 border-t border-stone-100">
          <button className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest hover:text-rs-text-primary transition-colors cursor-pointer" type="reset">
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

export default SalesVoucherForm;
