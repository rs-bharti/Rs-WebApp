import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown, Search, PlusCircle, Trash2 } from 'lucide-react';

const MasterForm = ({ type = 'Customer', userRole = 'admin' }) => {
  const isDetailed = ['Supplier'].includes(type);
  const isCustomer = type === 'Customer';
  const isProduct = type === 'Product';
  const isBranch = ['Branches', 'Branch'].includes(type);
  const isAdmin = userRole === 'admin';

  // State for Contact Persons
  const [contacts, setContacts] = useState([{ id: 1, name: '', phone: '', designation: '', dob: '' }]);

  const handleAddContact = () => {
    setContacts([...contacts, { id: Date.now(), name: '', phone: '', designation: '', dob: '' }]);
  };

  const handleRemoveContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const updateContact = (id, field, value) => {
    setContacts(contacts.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  // Field configuration based on Master Type
  const renderFields = () => {
    if (isCustomer) {
      return (
        <div className="space-y-12">
          {/* Customer Details Section */}
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Area</label>
                <div className="relative">
                  <select className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none appearance-none cursor-pointer", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                    <option value="">Select Area</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>City</label>
                <div className="relative">
                  <select className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none appearance-none cursor-pointer", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                    <option value="">Select City</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>State</label>
                <div className="relative">
                  <select className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none appearance-none cursor-pointer", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                    <option value="">Select State</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Address</label>
                <textarea className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none resize-none h-[100px]", isAdmin ? "border-brand-bg bg-brand-bg/20 focus:border-brand-primary text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 focus:border-rs-text-primary text-rs-text-primary")} placeholder="Enter full postal address"></textarea>
              </div>
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Country</label>
                <div className="relative">
                  <select className={cn("w-full rounded-lg border px-4 py-3 text-sm transition-all outline-none appearance-none cursor-pointer", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                    <option value="">Select Country</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Persons Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-2">
              <h3 className={cn("text-xl font-bold", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Contact Persons</h3>
              <button type="button" onClick={handleAddContact} className={cn("flex items-center text-xs font-bold uppercase tracking-wider transition-colors", isAdmin ? "text-brand-primary hover:text-brand-primary/80" : "text-rs-text-primary hover:text-rs-text-primary/80")}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Contact
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={cn("border-b", isAdmin ? "border-brand-bg bg-brand-bg/10" : "border-rs-accent-bg bg-rs-cream/20")}>
                    <th className={cn("p-4 text-[10px] font-bold uppercase tracking-widest", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Name</th>
                    <th className={cn("p-4 text-[10px] font-bold uppercase tracking-widest", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Phone Number</th>
                    <th className={cn("p-4 text-[10px] font-bold uppercase tracking-widest", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Designation</th>
                    <th className={cn("p-4 text-[10px] font-bold uppercase tracking-widest", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Date of Birth (DOB)</th>
                    <th className={cn("p-4 text-[10px] font-bold uppercase tracking-widest text-center", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}></th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className={cn("border-b transition-colors", isAdmin ? "border-brand-bg/50 hover:bg-brand-bg/5" : "border-rs-accent-bg/50 hover:bg-rs-cream/10")}>
                      <td className="p-2">
                        <input type="text" value={contact.name} onChange={(e) => updateContact(contact.id, 'name', e.target.value)} placeholder="Full Name" className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm transition-colors" />
                      </td>
                      <td className="p-2">
                        <input type="tel" value={contact.phone} onChange={(e) => updateContact(contact.id, 'phone', e.target.value)} placeholder="+91 ..." className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm transition-colors" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={contact.designation} onChange={(e) => updateContact(contact.id, 'designation', e.target.value)} placeholder="e.g. Manager" className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm transition-colors" />
                      </td>
                      <td className="p-2">
                        <input type="text" onFocus={(e) => (e.target.type = "date")} onBlur={(e) => (e.target.type = "text")} value={contact.dob} onChange={(e) => updateContact(contact.id, 'dob', e.target.value)} placeholder="dd-mm-yyyy" className="w-full bg-transparent border-b border-transparent focus:border-stone-300 px-2 py-2 outline-none text-sm transition-colors text-stone-500" />
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" onClick={() => handleRemoveContact(contact.id)} className="text-red-500 hover:text-red-600 transition-colors p-2" title="Remove Contact">
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tax & Statutory Information Section */}
          <div className="space-y-6 pt-6">
            <h3 className={cn("text-xl font-bold", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Tax & Statutory Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Tax ID</label>
                <input type="text" placeholder="Enter Tax ID" className={cn("w-full bg-transparent border-b px-2 py-3 outline-none text-sm transition-colors focus:border-stone-500", isAdmin ? "border-brand-bg text-brand-primary" : "border-rs-accent-bg text-rs-text-primary")} />
              </div>
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>Weight No</label>
                <input type="text" placeholder="Enter Weight Number" className={cn("w-full bg-transparent border-b px-2 py-3 outline-none text-sm transition-colors focus:border-stone-500", isAdmin ? "border-brand-bg text-brand-primary" : "border-rs-accent-bg text-rs-text-primary")} />
              </div>
              <div className="space-y-2">
                <label className={cn("block text-[10px] uppercase tracking-widest font-bold mb-2", isAdmin ? "text-brand-primary/60" : "text-rs-text-muted")}>TIN No</label>
                <input type="text" placeholder="Enter TIN Number" className={cn("w-full bg-transparent border-b px-2 py-3 outline-none text-sm transition-colors focus:border-stone-500", isAdmin ? "border-brand-bg text-brand-primary" : "border-rs-accent-bg text-rs-text-primary")} />
              </div>
            </div>
          </div>
        </div>
      );
    }

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
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>Currency Type</label>
            <div className="relative">
              <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                <option>Select Currency</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            </div>
          </div>
        </div>
      );
    }

    // Simple Masters
    const getSecondFieldLabel = (masterType) => {
      switch (masterType) {
        case 'Area': return 'City Name';
        case 'City': return 'State Name';
        case 'State': return 'Country Name';
        default: return null;
      }
    };

    const secondFieldLabel = getSecondFieldLabel(type);

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-3xl">
        <div className="space-y-2">
          <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>{type} Name</label>
          <input className={cn("w-full rounded-lg border px-4 py-3 text-sm", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")} type="text" placeholder={`Enter ${type.toLowerCase()} name`}/>
        </div>
        {secondFieldLabel && (
          <div className="space-y-2">
            <label className={cn("block text-sm font-semibold mb-2", isAdmin ? "text-brand-primary" : "text-rs-text-primary")}>{secondFieldLabel}</label>
            <div className="relative">
              <select className={cn("w-full rounded-lg border px-4 py-3 text-sm appearance-none", isAdmin ? "border-brand-bg bg-brand-bg/20 text-brand-primary" : "border-rs-accent-bg bg-rs-cream/10 text-rs-text-primary")}>
                <option>Select {secondFieldLabel.replace(' Name', '')}</option>
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
        )}>{type === 'Customer' ? 'Customer Details' : `${type} ${isBranch ? 'Details' : 'Master'}`}</h2>
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
