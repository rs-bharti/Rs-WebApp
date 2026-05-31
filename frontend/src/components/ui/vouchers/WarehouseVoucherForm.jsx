import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

const WarehouseVoucherForm = () => {
  const type = 'Warehouse';

  const [warehouses, setWarehouses] = useState([
    { id: 1, name: '', area: '', address: '' }
  ]);

  const addWarehouse = () => {
    setWarehouses(prev => [...prev, { id: Date.now(), name: '', area: '', address: '' }]);
  };

  const removeWarehouse = (id) => {
    if (warehouses.length > 1) {
      setWarehouses(prev => prev.filter(w => w.id !== id));
    }
  };

  const updateWarehouse = (id, field, value) => {
    setWarehouses(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New {type} Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: WV-2026-001
        </span>
      </div>

      <form className="p-8 space-y-10" onSubmit={(e) => e.preventDefault()}>
        {/* Header Row: Date, Voucher No, Location */}
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
                value="WV-2026-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Location</label>
            <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
              <input
                className="w-full bg-transparent text-sm font-medium outline-none"
                type="text"
                placeholder="Enter location..."
              />
            </div>
          </div>
        </div>

        {/* Warehouses Section */}
        <div className="space-y-5">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest">Warehouses</h3>
            <button
              type="button"
              onClick={addWarehouse}
              className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-rs-text-primary bg-rs-cream px-4 py-2 rounded-lg hover:bg-rs-accent-bg transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              Add Warehouse
            </button>
          </div>

          <div className="space-y-4">
            {warehouses.map((warehouse, index) => (
              <div
                key={warehouse.id}
                className="border border-stone-100 rounded-xl p-6 bg-rs-cream/10 space-y-5"
              >
                {/* Row label + remove button */}
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">
                    Warehouse #{index + 1}
                  </span>
                  {warehouses.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeWarehouse(warehouse.id)}
                      className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  )}
                </div>

                {/* Name, Area, Address */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">
                      Warehouse Name
                    </label>
                    <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
                      <input
                        className="w-full bg-transparent text-sm font-medium outline-none"
                        type="text"
                        placeholder="Enter warehouse name..."
                        value={warehouse.name}
                        onChange={(e) => updateWarehouse(warehouse.id, 'name', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">
                      Area
                    </label>
                    <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
                      <select
                        className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer"
                        value={warehouse.area}
                        onChange={(e) => updateWarehouse(warehouse.id, 'area', e.target.value)}
                      >
                        <option value="" disabled>Select Area</option>
                        <option>North Zone</option>
                        <option>South Zone</option>
                        <option>East Zone</option>
                        <option>West Zone</option>
                        <option>Central Zone</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">
                      Area Address
                    </label>
                    <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
                      <input
                        className="w-full bg-transparent text-sm font-medium outline-none"
                        type="text"
                        placeholder="Enter full address..."
                        value={warehouse.address}
                        onChange={(e) => updateWarehouse(warehouse.id, 'address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Section: Narration + Summary */}
        <div className="flex flex-col md:flex-row gap-12 pt-6 border-t border-stone-50">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">
              Narration (Remarks)
            </label>
            <textarea
              className="w-full bg-rs-cream/20 border border-stone-200 rounded-lg p-4 text-sm resize-none outline-none focus:border-rs-text-primary transition-colors"
              placeholder="Enter additional details..."
              rows="4"
            ></textarea>
          </div>

          <div className="w-full md:w-72 flex flex-col justify-end">
            <div className="bg-rs-cream/40 rounded-xl p-5 flex justify-between items-center">
              <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest">
                Total Warehouses
              </span>
              <span className="text-3xl font-user-serif font-bold text-rs-text-primary tracking-tight">
                {warehouses.length}
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

export default WarehouseVoucherForm;
