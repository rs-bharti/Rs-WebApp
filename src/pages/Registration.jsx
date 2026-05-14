import React, { useState } from 'react';
import Button from '../components/ui/Button';
import { Eye, ShieldCheck, FileText, Database, Building2 } from 'lucide-react';
import { cn } from '../lib/utils';

const Registration = () => {
  const [selectedRole, setSelectedRole] = useState('user');
  
  // Generating 25 branches
  const branches = Array.from({ length: 25 }, (_, i) => `Branch ${i + 1}`);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="font-serif text-3xl mb-1 text-brand-primary">New User Registration</h2>
        <p className="text-stone-500 text-sm">Configure profile details and application-wide permissions.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start pb-12">
        {/* Left Side: User Identity & Tip */}
        <div className="w-full lg:w-1/3 space-y-6">
          {/* Identity Card */}
          <div className="bg-brand-card p-6 rounded-xl border border-stone-200 shadow-sm">
            <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-6">User Identity</h4>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-brand-accent uppercase mb-1 block">Name of User</label>
                <input className="w-full border-stone-200 rounded-md py-2 px-3 text-sm focus:ring-brand-primary focus:border-brand-primary bg-white outline-none" placeholder="e.g. Rahul Sharma" type="text"/>
              </div>
              <div>
                <label className="text-[10px] font-bold text-brand-accent uppercase mb-1 block">Email of User</label>
                <input className="w-full border-stone-200 rounded-md py-2 px-3 text-sm focus:ring-brand-primary focus:border-brand-primary bg-white outline-none" placeholder="rahul.s@rsbharti.com" type="email"/>
              </div>
              <div className="relative">
                <label className="text-[10px] font-bold text-brand-accent uppercase mb-1 block">Password</label>
                <input className="w-full border-stone-200 rounded-md py-2 px-3 text-sm focus:ring-brand-primary focus:border-brand-primary bg-white outline-none" type="password" value="............" readOnly/>
                <button className="absolute right-3 top-7 text-stone-400" type="button">
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              {/* Primary Role Selection */}
              <div>
                <label className="text-[10px] font-bold text-brand-accent uppercase mb-3 block">Primary Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['admin', 'user'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role)}
                      className={cn(
                        "py-2 px-4 rounded-md text-xs font-bold uppercase tracking-widest transition-all border",
                        selectedRole === role 
                          ? "bg-brand-primary text-white border-brand-primary shadow-sm" 
                          : "bg-white text-stone-400 border-stone-200 hover:border-brand-primary/30"
                      )}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Security Tip */}
          <div className="bg-brand-primary text-white p-6 rounded-xl relative overflow-hidden shadow-lg border-b-4 border-brand-accent/20">
            <h4 className="text-xl font-serif mb-3">Security Tip</h4>
            <p className="text-stone-300 text-xs leading-relaxed">
              Ensure users have appropriate access to master data to prevent unauthorized ledger modifications.
            </p>
            <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
          </div>
        </div>

        {/* Right Side: Roles Card */}
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white border border-stone-100 shadow-brand-card p-8 rounded-xl flex flex-col">
            <h3 className="font-serif text-2xl mb-8 text-brand-primary border-b border-stone-50 pb-4">Role of User & Permissions</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Voucher Category */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <FileText className="w-4 h-4 text-brand-accent" />
                  <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Voucher Access</h4>
                </div>
                <div className="space-y-3">
                  {['Receipt', 'Payment', 'Sales', 'Sales Return', 'Purchase', 'Contra', 'Purchase Return'].map(role => (
                    <label key={role} className="flex items-center text-sm text-stone-600 cursor-pointer group">
                      <input className="rounded text-brand-primary focus:ring-brand-primary mr-3 border-stone-300 transition-colors group-hover:border-brand-primary" type="checkbox"/>
                      <span className="group-hover:text-brand-primary transition-colors">{role}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Master Category */}
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Database className="w-4 h-4 text-brand-accent" />
                  <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Master Access</h4>
                </div>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                  {['Customer', 'Area', 'City', 'State', 'Branches', 'Country', 'Payment Method', 'Supplier', 'Product', 'Category', 'Unit'].map(role => (
                    <label key={role} className="flex items-center text-sm text-stone-600 cursor-pointer group">
                      <input className="rounded text-brand-primary focus:ring-brand-primary mr-3 border-stone-300 transition-colors group-hover:border-brand-primary" type="checkbox"/>
                      <span className="group-hover:text-brand-primary transition-colors">{role}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Branch Access Section */}
            <div className="mt-12 pt-8 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-6">
                <Building2 className="w-4 h-4 text-brand-accent" />
                <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Branch Access Control</h4>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-4 gap-x-2">
                {branches.map(branch => (
                  <label key={branch} className="flex items-center text-[11px] text-stone-600 cursor-pointer group bg-stone-50/50 p-2 rounded hover:bg-brand-primary/5 transition-all border border-transparent hover:border-brand-primary/10">
                    <input className="rounded text-brand-primary focus:ring-brand-primary mr-2 border-stone-300 transition-colors" type="checkbox"/>
                    <span className="group-hover:text-brand-primary transition-colors font-medium">{branch}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-12 pt-8 border-t border-stone-100 flex justify-end gap-4">
              <button className="px-8 py-2 border border-stone-300 rounded text-stone-600 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer">Cancel</button>
              <button className="px-8 py-2 bg-brand-primary text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md hover:shadow-lg active:scale-95 cursor-pointer">Save User Profile</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
