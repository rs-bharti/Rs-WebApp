import React from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, Search } from 'lucide-react';

const MasterForm = ({ type = 'Customer', userRole = 'admin' }) => {
  const isDetailed = ['Customer', 'Supplier'].includes(type);
  const isProduct = type === 'Product';
  const isBranch = ['Branches', 'Branch'].includes(type);
  const isAdmin = userRole === 'admin';

  // Field configuration based on Master Type
  const renderFields = () => {
    if (isDetailed) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Name</label>
              <input className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none", isAdmin ? "border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary")} type="text" placeholder={`Enter ${type.toLowerCase()} full name`}/>
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Address</label>
              <textarea className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none resize-none", isAdmin ? "border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary")} placeholder="Enter full postal address" rows="5"></textarea>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {['Area', 'City', 'State', 'Country'].map((loc) => (
              <div key={loc} className="space-y-2">
                <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>{loc}</label>
                <div className="relative">
                  <select className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none appearance-none cursor-pointer", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                    <option value="">Select {loc}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (isProduct) {
      return (
        <div className="space-y-8 max-w-5xl">
          <div className="space-y-2">
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Product Name</label>
            <input className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none", isAdmin ? "border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary")} type="text" placeholder="Enter product name"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Category</label>
              <div className="relative">
                <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                  <option>Select Category</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Supplier</label>
              <div className="relative">
                <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                  <option>Select Supplier</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Unit</label>
              <div className="relative">
                <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                  <option>Select Unit</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              </div>
            </div>
            <div className="space-y-2">
              <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Lowest Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">₹</span>
                <input className={cn("w-full rounded-lg border pl-10 pr-4 py-3 text-sm", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")} type="number" placeholder="0.00"/>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (isBranch) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="space-y-2">
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Branch Name</label>
            <input className={cn("w-full rounded-lg border px-4 py-3 text-sm", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")} type="text" placeholder="Enter branch name"/>
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Country Name</label>
            <div className="relative">
              <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                <option>Select Country</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>State Name</label>
            <div className="relative">
              <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                <option>Select State</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>
      );
    }

    // Simple Masters
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2">
          <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>{type} Name</label>
          <input className={cn("w-full rounded-lg border px-4 py-3 text-sm", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")} type="text" placeholder={`Enter ${type.toLowerCase()} name`}/>
        </div>
        {type !== 'Country' && type !== 'State' && (
          <div className="space-y-2">
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Parent Selection</label>
            <div className="relative">
              <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                <option>Select Parent</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <section className={cn(
      "rounded-2xl shadow-sm border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500",
      isAdmin ? "bg-white border-brand-bg" : "bg-white border-stone-100"
    )}>
      <div className={cn(
        "px-8 py-6 border-b flex justify-between items-center",
        isAdmin ? "border-brand-bg" : "border-stone-100",
        isProduct && "bg-[#FDFCFB]"
      )}>
        <h2 className={cn(
          "text-2xl font-bold",
          isAdmin ? (isProduct ? "font-product-serif text-brand-primary" : "font-admin-serif text-brand-primary") : "font-user-serif text-rs-text-primary"
        )}>{type} {isBranch ? 'Details' : 'Master'}</h2>
        <div className="flex items-center gap-4">
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-widest opacity-60",
            isAdmin ? "text-brand-primary" : "text-rs-text-muted"
          )}>Form ID: {type.substring(0, 2).toUpperCase()}-{(Math.random() * 9999).toFixed(0)}</span>
        </div>
      </div>

      <form className="p-8 space-y-12" onSubmit={(e) => e.preventDefault()}>
        <div className="min-h-[250px]">
          {renderFields()}
        </div>

        <div className={cn(
          "flex justify-end items-center gap-8 pt-8 border-t",
          isAdmin ? "border-brand-bg" : "border-stone-100"
        )}>
          <button className={cn("text-sm font-semibold", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")} type="reset">Discard</button>
          <button className={cn("px-10 py-3 rounded-lg font-bold text-sm shadow-md", isAdmin ? "bg-brand-primary text-ivory" : "bg-rs-text-primary text-white")}>Save {type}</button>
        </div>
      </form>
    </section>
  );
};

export default MasterForm;
