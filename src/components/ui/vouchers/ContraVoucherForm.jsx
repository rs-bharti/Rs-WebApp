import React, { useState } from 'react';
import { cn } from '../../../lib/utils';
import { Calendar, ChevronDown } from 'lucide-react';

const ContraVoucherForm = () => {
  const type = 'Contra';

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center">
        <h2 className="text-2xl font-user-serif font-bold text-rs-text-primary">New {type} Voucher</h2>
        <span className="text-[10px] font-bold text-rs-text-muted uppercase tracking-widest bg-rs-cream px-3 py-1 rounded-full">
          Ref: {type.charAt(0)}V-2026-001
        </span>
      </div>

      <form className="p-8 space-y-10" onSubmit={(e) => e.preventDefault()}>

        {/* Transfer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* From Section */}
          <div className="space-y-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h3 className="text-sm font-bold text-rs-text-primary uppercase tracking-widest">From</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method 1</label>
                <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
                  <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer">
                    <option disabled selected>Select Account</option>
                    <option>Cash Account</option>
                    <option>Main Bank Account</option>
                    <option>Secondary Bank Account</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
                <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
                  <span className="absolute left-0 top-0 text-stone-400 text-sm font-semibold">₹</span>
                  <input 
                    className="w-full bg-transparent pl-4 text-sm font-bold text-rs-text-primary outline-none" 
                    placeholder="0.00" 
                    type="number"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* To Section */}
          <div className="space-y-6 bg-stone-50 p-6 rounded-xl border border-stone-100">
            <h3 className="text-sm font-bold text-rs-text-primary uppercase tracking-widest">To</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Payment Method 2</label>
                <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors flex items-center">
                  <select className="w-full bg-transparent text-sm font-medium outline-none appearance-none cursor-pointer">
                    <option disabled selected>Select Account</option>
                    <option>Cash Account</option>
                    <option>Main Bank Account</option>
                    <option>Secondary Bank Account</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-rs-text-muted tracking-widest block">Amount</label>
                <div className="relative border-b border-stone-200 pb-1 focus-within:border-rs-text-primary transition-colors">
                  <span className="absolute left-0 top-0 text-stone-400 text-sm font-semibold">₹</span>
                  <input 
                    className="w-full bg-transparent pl-4 text-sm font-bold text-rs-text-primary outline-none" 
                    placeholder="0.00" 
                    type="number"
                  />
                </div>
              </div>
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
            Submit
          </button>
        </div>
      </form>
    </section>
  );
};

export default ContraVoucherForm;
