import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus, FileText, CreditCard, Menu, RotateCcw, ShoppingCart,
  Repeat, Undo2, LogOut, Users, Building, Globe,
  Database, Truck, Package, Layers, Box, Warehouse,
  ClipboardList, ArrowLeftRight, X
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, children, role, onClose }) => (
  <NavLink
    to={to}
    onClick={onClose}
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

const VOUCHER_ROUTES = {
  'Receipt':         { slug: 'receipt',        icon: FileText },
  'Payment':         { slug: 'payment',         icon: CreditCard },
  'Sales':           { slug: 'sales',           icon: Menu },
  'Sales Return':    { slug: 'sales-return',    icon: RotateCcw },
  'Purchase':        { slug: 'purchase',        icon: ShoppingCart },
  'Contra':          { slug: 'contra',          icon: Repeat },
  'Purchase Return': { slug: 'purchase-return', icon: Undo2 },
  'Stock Data':     { slug: 'stock-data',     icon: ClipboardList },
  'Stock Transfer': { slug: 'stock-transfer', icon: ArrowLeftRight },
};

const MASTER_ROUTES = {
  'Customer':        { slug: 'customer',       icon: Users },
  'Warehouse':       { slug: 'warehouse',      icon: Warehouse },
  'Supplier':        { slug: 'supplier',       icon: Truck },
  'Product':         { slug: 'product',        icon: Package },
  'Category':        { slug: 'category',       icon: Layers },
  'Unit':            { slug: 'unit',           icon: Box },
  'Payment Method':  { slug: 'payment-method', icon: CreditCard },
};

const OTHER_ROUTES = {
  'Client Ledger':        { slug: 'other/client-ledger',          icon: FileText },
  'Stock Ledger':         { slug: 'other/stock-ledger',           icon: FileText },
  'Client Balance':       { slug: 'other/client-balance',         icon: CreditCard },
  'Stock Quantity':       { slug: 'other/stock-quantity',         icon: Package },
  'Product Statement':    { slug: 'other/product-statement',      icon: FileText },
  'Customer Statement':   { slug: 'other/customer-statement',     icon: FileText },
  'All Customer Balance': { slug: 'other/all-customer-balance',   icon: Users },
  'All Balance Stock':    { slug: 'other/all-balance-stock',      icon: Database },
};

const Sidebar = ({ role = 'admin', open = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { logout, canAccessVoucher, canAccessMaster, canAccessOther, isAdmin } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    onClose();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'flex flex-col h-screen overflow-hidden transition-all duration-300',
        'fixed inset-y-0 left-0 z-40 w-72',
        open ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:translate-x-0 md:w-64 md:flex-shrink-0 md:z-auto',
        'border-r border-stone-200/50',
        role === 'admin' ? 'bg-brand-sidebar' : 'bg-rs-sidebar'
      )}>
      <div className="p-8 pb-4 flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className={cn('text-2xl tracking-tight transition-all', role === 'admin' ? 'font-serif text-brand-primary' : 'font-user-serif font-bold text-rs-text-primary')}>
            RS Bharti
          </h1>
          <p className={cn('text-[10px] uppercase tracking-[0.2em] font-semibold mt-1', role === 'admin' ? 'text-brand-primary/60' : 'text-rs-text-muted')}>
            {role === 'admin' ? 'Admin Dashboard' : 'Institutional Portal'}
          </p>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onClose}
          className={cn('md:hidden p-1 rounded-md transition-colors', role === 'admin' ? 'text-brand-primary/60 hover:text-brand-primary hover:bg-brand-primary/5' : 'text-rs-text-muted hover:text-rs-text-primary hover:bg-rs-accent-bg')}
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar">

        {isAdmin && (
          <div className="space-y-1">
            <NavLink to="/dashboard/registration"
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center px-4 py-3 rounded-lg font-semibold shadow-sm border transition-all duration-200',
                isActive ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-brand-card text-brand-primary border-stone-200 dark:border-brand-card hover:bg-stone-50 dark:hover:bg-brand-sidebar'
              )}>
              <UserPlus className="w-5 h-5 mr-3" />
              Add User
            </NavLink>
            <NavLink to="/dashboard/manage-users"
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center px-4 py-3 rounded-lg font-semibold shadow-sm border transition-all duration-200 mt-2',
                isActive ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-brand-card text-brand-primary border-stone-200 dark:border-brand-card hover:bg-stone-50 dark:hover:bg-brand-sidebar'
              )}>
              <Users className="w-5 h-5 mr-3" />
              Manage Users
            </NavLink>
            <NavLink to="/dashboard/master/branches"
              onClick={onClose}
              className={({ isActive }) => cn(
                'flex items-center px-4 py-3 rounded-lg font-semibold shadow-sm border transition-all duration-200 mt-2',
                isActive ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white dark:bg-brand-card text-brand-primary border-stone-200 dark:border-brand-card hover:bg-stone-50 dark:hover:bg-brand-sidebar'
              )}>
              <Database className="w-5 h-5 mr-3" />
              Branch Master
            </NavLink>
          </div>
        )}

        {/* Voucher Entry — permission filtered */}
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
                  <SidebarItem key={slug} to={`/dashboard/${slug}`} icon={icon} role={role} onClose={onClose}>
                    {name} Voucher
                  </SidebarItem>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Master — permission filtered */}
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
                  <SidebarItem key={slug} to={`/dashboard/master/${slug}`} icon={icon} role={role} onClose={onClose}>
                    {name} Master
                  </SidebarItem>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* Other — permission filtered */}
        {(() => {
          const allowed = Object.entries(OTHER_ROUTES).filter(([name]) => canAccessOther(name));
          if (allowed.length === 0) return null;
          return (
            <div className="space-y-1 pb-8">
              <h3 className={cn('px-4 text-[10px] font-bold uppercase tracking-widest mb-3', role === 'admin' ? 'text-brand-primary/40' : 'text-rs-text-muted')}>
                Other
              </h3>
              <ul className="space-y-1">
                {allowed.map(([name, { slug, icon }]) => (
                  <SidebarItem key={slug} to={`/dashboard/${slug}`} icon={icon} role={role} onClose={onClose}>
                    {name}
                  </SidebarItem>
                ))}
              </ul>
            </div>
          );
        })()}
      </nav>

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

<<<<<<< HEAD
      </aside>

=======
>>>>>>> ce3035479a71b2e52b5c522e9559edada3dfb198
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-brand-card rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className={cn('text-lg font-bold mb-2', role === 'admin' ? 'text-brand-primary' : 'text-rs-text-primary')}>Confirm Logout</h3>
            <p className="text-sm text-stone-500 dark:text-rs-text-muted mb-8">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-5 py-2.5 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 cursor-pointer',
                  role === 'admin' ? 'bg-brand-primary' : 'bg-rs-text-primary'
                )}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
<<<<<<< HEAD
=======
      </aside>
>>>>>>> ce3035479a71b2e52b5c522e9559edada3dfb198
    </>
  );
};

export default Sidebar;
