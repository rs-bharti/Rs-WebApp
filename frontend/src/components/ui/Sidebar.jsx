import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus, FileText, CreditCard, Menu, RotateCcw, ShoppingCart,
  Repeat, Undo2, LogOut, Users, MapPin, Building, Globe,
  Database, Truck, Package, Layers, Box
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, children, role }) => (
  <NavLink
    to={to}
    className={({ isActive }) => cn(
      'flex items-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md',
      role === 'admin'
        ? (isActive ? 'text-brand-primary bg-brand-primary/5 pl-5' : 'text-brand-primary/80 hover:bg-brand-primary/5 hover:pl-5')
        : (isActive ? 'bg-rs-accent-bg text-rs-text-primary font-semibold' : 'text-rs-text-muted hover:bg-rs-accent-bg hover:text-rs-text-primary')
    )}
  >
    {Icon && <Icon className={cn('w-4 h-4 mr-3 transition-opacity', role === 'admin' ? 'opacity-60' : 'opacity-100')} />}
    {children}
  </NavLink>
);

// Voucher label → route slug mapping
const VOUCHER_ROUTES = {
  'Receipt':         { slug: 'receipt',         icon: FileText },
  'Payment':         { slug: 'payment',          icon: CreditCard },
  'Sales':           { slug: 'sales',            icon: Menu },
  'Sales Return':    { slug: 'sales-return',     icon: RotateCcw },
  'Purchase':        { slug: 'purchase',         icon: ShoppingCart },
  'Contra':          { slug: 'contra',           icon: Repeat },
  'Purchase Return': { slug: 'purchase-return',  icon: Undo2 },
};

// Master label → route slug mapping
const MASTER_ROUTES = {
  'Customer':       { slug: 'customer',       icon: Users },
  'Country':        { slug: 'country',        icon: Globe },
  'State':          { slug: 'state',          icon: Globe },
  'City':           { slug: 'city',           icon: Building },
  'Area':           { slug: 'area',           icon: MapPin },
  'Branches':       { slug: 'branches',       icon: Database },
  'Supplier':       { slug: 'supplier',       icon: Truck },
  'Product':        { slug: 'product',        icon: Package },
  'Category':       { slug: 'category',       icon: Layers },
  'Unit':           { slug: 'unit',           icon: Box },
  'Payment Method': { slug: 'payment-method', icon: CreditCard },
};

const Sidebar = ({ role = 'admin' }) => {
  const navigate = useNavigate();
  const { logout, canAccessVoucher, canAccessMaster, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={cn(
      'w-64 flex-shrink-0 border-r border-stone-200/50 flex flex-col h-screen overflow-hidden transition-colors duration-300',
      role === 'admin' ? 'bg-brand-sidebar' : 'bg-rs-sidebar'
    )}>
      {/* Header */}
      <div className="p-8 pb-4 flex-shrink-0">
        <h1 className={cn('text-2xl tracking-tight transition-all', role === 'admin' ? 'font-serif text-brand-primary' : 'font-user-serif font-bold text-rs-text-primary')}>
          RS Bharti
        </h1>
        <p className={cn('text-[10px] uppercase tracking-[0.2em] font-semibold mt-1', role === 'admin' ? 'text-brand-primary/60' : 'text-rs-text-muted')}>
          {role === 'admin' ? 'Admin Dashboard' : 'Institutional Portal'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">

        {/* Admin-only: Add User */}
        {isAdmin && (
          <div className="space-y-1">
            <NavLink to="/dashboard/registration"
              className={({ isActive }) => cn(
                'flex items-center px-4 py-3 rounded-lg font-semibold shadow-sm border transition-all duration-200',
                isActive ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-primary border-stone-200 hover:bg-stone-50'
              )}>
              <UserPlus className="w-5 h-5 mr-3" />
              Add User
            </NavLink>
            <NavLink to="/dashboard/master/branches"
              className={({ isActive }) => cn(
                'flex items-center px-4 py-3 rounded-lg font-semibold shadow-sm border transition-all duration-200 mt-2',
                isActive ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-brand-primary border-stone-200 hover:bg-stone-50'
              )}>
              <Database className="w-5 h-5 mr-3" />
              Branch Master
            </NavLink>
          </div>
        )}

        {/* Voucher Entry */}
        {(() => {
          const allowed = Object.entries(VOUCHER_ROUTES).filter(([name]) => canAccessVoucher(name));
          if (allowed.length === 0) return null;
          return (
            <div className="space-y-1">
              <h3 className={cn('px-4 text-[10px] font-bold uppercase tracking-widest mb-3', role === 'admin' ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                Voucher Entry
              </h3>
              <ul className="space-y-1">
                {allowed.map(([name, { slug, icon }]) => (
                  <SidebarItem key={slug} to={`/dashboard/${slug}`} icon={icon} role={role}>
                    {name} Voucher
                  </SidebarItem>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Master */}
        {(() => {
          const allowed = Object.entries(MASTER_ROUTES).filter(([name]) => canAccessMaster(name));
          if (allowed.length === 0) return null;
          return (
            <div className="space-y-1">
              <h3 className={cn('px-4 text-[10px] font-bold uppercase tracking-widest mb-3', role === 'admin' ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                Master
              </h3>
              <ul className="space-y-1">
                {allowed.map(([name, { slug, icon }]) => (
                  <SidebarItem key={slug} to={`/dashboard/master/${slug}`} icon={icon} role={role}>
                    {name} Master
                  </SidebarItem>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Other — visible to all */}
        <div className="space-y-1 pb-8">
          <h3 className={cn('px-4 text-[10px] font-bold uppercase tracking-widest mb-3', role === 'admin' ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
            Other
          </h3>
          <ul className="space-y-1">
            <SidebarItem to="/dashboard/other/client-ledger"     icon={FileText}  role={role}>Client Ledger</SidebarItem>
            <SidebarItem to="/dashboard/other/stock-ledger"      icon={FileText}  role={role}>Stock Ledger</SidebarItem>
            <SidebarItem to="/dashboard/other/client-balance"    icon={CreditCard} role={role}>Client Balance</SidebarItem>
            <SidebarItem to="/dashboard/other/stock-quantity"    icon={Package}   role={role}>Stock Quantity</SidebarItem>
            <SidebarItem to="/dashboard/other/product-statement" icon={FileText}  role={role}>Product Statement</SidebarItem>
            <SidebarItem to="/dashboard/other/customer-statement" icon={FileText} role={role}>Customer Statement</SidebarItem>
            <SidebarItem to="/dashboard/other/all-customer-balance" icon={Users}  role={role}>All Customer Balance</SidebarItem>
            <SidebarItem to="/dashboard/other/all-balance-stock" icon={Database}  role={role}>All Balance Stock</SidebarItem>
          </ul>
        </div>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-stone-200/50 flex-shrink-0">
        <button onClick={handleLogout}
          className={cn(
            'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all group cursor-pointer',
            role === 'admin' ? 'text-brand-primary hover:bg-brand-primary/5' : 'text-rs-text-primary border border-dashed border-stone-300 hover:bg-rs-accent-bg'
          )}>
          <LogOut className="w-4 h-4 mr-3 transition-transform group-hover:-translate-x-1" />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
