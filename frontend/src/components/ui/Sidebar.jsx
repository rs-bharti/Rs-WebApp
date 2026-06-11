import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import {
  UserPlus, FileText, CreditCard, Menu, RotateCcw, ShoppingCart,
  Repeat, Undo2, LogOut, Users,
  Database, Truck, Package, Warehouse,
  ClipboardList, ArrowLeftRight, X, Receipt,
  ChevronDown, BookOpen, LayoutGrid, BookMarked, CalendarDays,
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
    {Icon && <Icon className={cn('w-4 h-4 mr-3 flex-shrink-0 transition-opacity', role === 'admin' ? 'opacity-60' : 'opacity-100')} />}
    {children}
  </NavLink>
);

const VOUCHER_ROUTES = {
  'Receipt':         { slug: 'receipt',        icon: FileText },
  'Payment':         { slug: 'payment',         icon: CreditCard },
  'Expense':         { slug: 'expense',         icon: Receipt },
  'Sales':           { slug: 'sales',           icon: Menu },
  'Sales Return':    { slug: 'sales-return',    icon: RotateCcw },
  'Purchase':        { slug: 'purchase',        icon: ShoppingCart },
  'Contra':          { slug: 'contra',          icon: Repeat },
  'Purchase Return': { slug: 'purchase-return', icon: Undo2 },
  'Stock Data':      { slug: 'stock-data',      icon: ClipboardList },
  'Stock Transfer':  { slug: 'stock-transfer',  icon: ArrowLeftRight },
};

const MASTER_ROUTES = {
  'Customer':  { slug: 'customer',  icon: Users },
  'Warehouse': { slug: 'warehouse', icon: Warehouse },
  'Supplier':  { slug: 'supplier',  icon: Truck },
  'Product':   { slug: 'product',   icon: Package },
};

const OTHER_ROUTES = {
  'DSR':               { slug: 'other/day-book',          icon: CalendarDays },
  'Client Ledger':     { slug: 'other/client-ledger',     icon: FileText },
  'Supplier Ledger':   { slug: 'other/supplier-ledger',   icon: Truck },
  'Stock Ledger':      { slug: 'other/stock-quantity',    icon: Package },
};

const SidebarGroup = ({ label, icon: GroupIcon, items, role, onClose, isItemActive, renderItem }) => {
  const hasActive = items.some(([, { slug }]) => isItemActive(slug));
  const [open, setOpen] = useState(hasActive);

  // Open automatically when navigating to a route inside this group
  useEffect(() => {
    if (hasActive) setOpen(true);
  }, [hasActive]);

  if (items.length === 0) return null;

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
          role === 'admin'
            ? (open || hasActive ? 'text-brand-primary bg-brand-primary/8' : 'text-brand-primary/70 hover:bg-brand-primary/5')
            : (open || hasActive ? 'text-rs-text-primary bg-rs-accent-bg' : 'text-rs-text-muted hover:bg-rs-accent-bg hover:text-rs-text-primary')
        )}
      >
        <span className="flex items-center gap-3">
          <GroupIcon className="w-4 h-4 flex-shrink-0" />
          {label}
        </span>
        <ChevronDown className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', open ? 'rotate-180' : '')} />
      </button>

      {open && (
        <ul className="space-y-0.5 pt-0.5 pb-1 ml-2 pl-3 border-l border-stone-200/70">
          {items.map(([name, { slug, icon }]) => (
            <li key={slug}>
              {renderItem(name, slug, icon)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const Sidebar = ({ role = 'admin', open = false, onClose = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, canAccessVoucher, canAccessMaster, canAccessOther, isAdmin } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isItemActive = (slug) => location.pathname.includes(`/dashboard/${slug}`);

  const handleLogout = () => {
    onClose();
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
  };

  const allowedVouchers = Object.entries(VOUCHER_ROUTES).filter(([name]) => canAccessVoucher(name));
  const allowedMasters  = Object.entries(MASTER_ROUTES).filter(([name]) => canAccessMaster(name));
  const allowedOther    = Object.entries(OTHER_ROUTES).filter(([name]) => canAccessOther(name));

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
          <button
            onClick={onClose}
            className={cn('md:hidden p-1 rounded-md transition-colors', role === 'admin' ? 'text-brand-primary/60 hover:text-brand-primary hover:bg-brand-primary/5' : 'text-rs-text-muted hover:text-rs-text-primary hover:bg-rs-accent-bg')}
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">

          {isAdmin && (
            <div className="space-y-1 pb-3 mb-1 border-b border-stone-200/50">
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

          {/* Vouchers */}
          <SidebarGroup
            label="Vouchers"
            icon={BookOpen}
            items={allowedVouchers}
            role={role}
            onClose={onClose}
            isItemActive={isItemActive}
            renderItem={(name, slug, icon) => (
              <SidebarItem to={`/dashboard/${slug}`} icon={icon} role={role} onClose={onClose}>
                {name} Voucher
              </SidebarItem>
            )}
          />

          {/* Masters */}
          <SidebarGroup
            label="Masters"
            icon={LayoutGrid}
            items={allowedMasters}
            role={role}
            onClose={onClose}
            isItemActive={isItemActive}
            renderItem={(name, slug, icon) => (
              <SidebarItem to={`/dashboard/master/${slug}`} icon={icon} role={role} onClose={onClose}>
                {name} Master
              </SidebarItem>
            )}
          />

          {/* Ledger */}
          <SidebarGroup
            label="Ledger"
            icon={BookMarked}
            items={allowedOther}
            role={role}
            onClose={onClose}
            isItemActive={isItemActive}
            renderItem={(name, slug, icon) => (
              <SidebarItem to={`/dashboard/${slug}`} icon={icon} role={role} onClose={onClose}>
                {name}
              </SidebarItem>
            )}
          />

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

      </aside>

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
    </>
  );
};

export default Sidebar;
