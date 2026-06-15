import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../ui/Sidebar';
import { MoreVertical, TrendingUp, Building2, TrendingDown, Wallet, Landmark, Menu, ChevronDown, Sun, Moon, Pencil, X, Check, Loader2 } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getDashboardBalance, updateDashboardBalance } from '../../api/masters';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

const fmt = (n, symbol) => {
  if (n === null || n === undefined) return `${symbol}—`;
  const abs  = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 10000000) return `${sign}${symbol}${(abs / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000)   return `${sign}${symbol}${(abs / 100000).toFixed(2)}L`;
  return `${sign}${symbol}${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const StatCard = ({ title, amount, sub, trendType, role, onEdit, loading }) => (
  <article className={cn(
    "p-6 shadow-sm border transition-all duration-300 relative",
    role === 'admin'
      ? "bg-white dark:bg-brand-card border-brand-primary/10 border-b-4 rounded-sm"
      : "bg-rs-cream border-stone-100 rounded-2xl hover:shadow-md"
  )}>
    {onEdit && (
      <button
        onClick={onEdit}
        className="absolute top-3 right-3 p-1.5 rounded-lg text-brand-primary/30 hover:text-brand-primary hover:bg-brand-primary/10 transition-all cursor-pointer"
        title="Edit opening balance"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
    )}
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1 pr-6">
        <h4 className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em]",
          role === 'admin' ? "text-brand-primary/50" : "text-rs-text-muted"
        )}>{title}</h4>
        {loading ? (
          <div className="flex items-center gap-2 mt-1">
            <Loader2 className="w-5 h-5 animate-spin text-brand-primary/40" />
          </div>
        ) : (
          <h3 className={cn(
            "text-3xl mt-1 tracking-brand-tight",
            role === 'admin' ? "font-serif text-brand-primary" : "font-user-serif font-bold text-rs-text-primary"
          )}>{amount}</h3>
        )}
      </div>
    </div>
    <div className={cn(
      "flex items-center text-[10px] font-semibold",
      trendType === 'up' ? "text-emerald-600" :
      trendType === 'down' ? "text-rose-600" : "text-stone-400"
    )}>
      {trendType === 'up'   && <TrendingUp   className="w-3 h-3 mr-1" />}
      {trendType === 'down' && <TrendingDown  className="w-3 h-3 mr-1" />}
      <span className="uppercase">{sub}</span>
    </div>
  </article>
);

const EditModal = ({ title, field, currentOpening, onSave, onClose }) => {
  const [value, setValue] = useState(String(currentOpening ?? 0));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirming, setConfirming] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num)) return setErr('Enter a valid number');
    if (!confirming) { setConfirming(true); return; }
    setSaving(true);
    try {
      await onSave({ [field]: num });
      onClose();
    } catch (e) {
      setErr(e.message || 'Failed to save');
      setConfirming(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-brand-card rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-serif font-bold text-brand-primary">Edit {title}</h3>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {confirming ? (
          <>
            <p className="text-sm text-stone-600 mb-1">Are you sure you want to update the opening balance to</p>
            <p className="text-xl font-bold text-brand-primary mb-6">&#8377;{parseFloat(value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-6">This will affect the running balance calculations for this branch.</p>
            {err && <p className="text-xs text-rose-500 mb-3">{err}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirming(false)} className="px-5 py-2.5 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer">
                Back
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-brand-primary hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Confirm Save
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-stone-400 mb-4 uppercase tracking-widest">Opening / Starting Balance</p>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={e => { setValue(e.target.value); setErr(''); }}
              className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-brand-primary"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            {err && <p className="text-xs text-rose-500 mt-2">{err}</p>}
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 rounded-lg text-sm font-bold text-white bg-brand-primary hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const DashboardLayout = ({ userRole = 'admin' }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, activeBranch, allowedBranches, isAdmin, currencySymbol } = useAuth();
  const userName = user?.name || 'Admin User';
  const { isDark, toggle: toggleTheme } = useTheme();
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

  // Dashboard balance state
  const [balance, setBalance] = useState(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [editModal, setEditModal] = useState(null); // { title, field, currentOpening }

  const fetchBalance = useCallback(async () => {
    if (!activeBranch) return;
    setLoadingBalance(true);
    try {
      const data = await getDashboardBalance();
      setBalance(data);
    } catch {
      setBalance(null);
    } finally {
      setLoadingBalance(false);
    }
  }, [activeBranch]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);
  useAutoRefresh(fetchBalance, 15000);

  const handleSaveOpening = async (body) => {
    await updateDashboardBalance(body);
    await fetchBalance();
  };

  const cashAmount  = balance ? fmt(balance.currentCash,      currencySymbol) : '—';
  const bankAmount  = balance ? fmt(balance.currentBank,      currencySymbol) : '—';
  const recvAmount  = balance ? fmt(balance.totalReceivables, currencySymbol) : '—';

  const cashTrend  = balance ? (balance.currentCash      >= 0 ? 'up' : 'down') : 'neutral';
  const bankTrend  = balance ? (balance.currentBank      >= 0 ? 'up' : 'down') : 'neutral';
  const recvTrend  = balance ? (balance.totalReceivables >  0 ? 'up' : 'neutral') : 'neutral';

  return (
    <div className={cn(
      "h-screen flex overflow-hidden transition-colors duration-300",
      userRole === 'admin' ? "bg-brand-bg" : "bg-white dark:bg-brand-bg"
    )}>
      <Sidebar role={userRole} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className={cn(
          "h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-8 flex-shrink-0 transition-colors",
          userRole === 'admin' ? "bg-brand-sidebar/50 border-brand-card" : "bg-white dark:bg-brand-sidebar border-stone-100 dark:border-brand-card"
        )}>
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-stone-500 hover:text-brand-primary">
              <Menu className="w-6 h-6" />
            </button>
            <span className={cn(
              "text-lg transition-all",
              userRole === 'admin' ? "font-serif text-brand-primary" : "font-user-serif font-bold text-rs-text-primary"
            )}>{userName}</span>
            <span className={cn("hidden md:block h-4 w-[1px]", userRole === 'admin' ? "bg-brand-primary/20" : "bg-stone-200")}></span>
            <span className={cn(
              "hidden md:inline text-sm font-medium",
              userRole === 'admin' ? "text-brand-primary/60" : "text-rs-text-muted"
            )}>
              {userRole === 'admin' ? 'Financial Overview' : 'Operational Workspace'}
            </span>

            {activeBranch && (
              <>
                <span className={cn("hidden md:block h-4 w-[1px]", "bg-stone-200")}></span>
                <div className="flex items-center gap-2">
                  <Building2 className="hidden md:block w-4 h-4 text-brand-primary/60" />
                  <span className="text-sm font-semibold text-brand-primary">
                    {activeBranch.name}
                  </span>
                  {(isAdmin || allowedBranches.length > 1) && (
                    <button
                      onClick={() => setShowSwitchConfirm(true)}
                      className="text-[10px] uppercase tracking-widest text-brand-primary/50 hover:text-brand-primary border border-brand-primary/20 hover:border-brand-primary/50 px-2 py-0.5 rounded transition-all"
                    >
                      Switch
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className={cn(
                'p-2 rounded-lg transition-colors cursor-pointer',
                userRole === 'admin'
                  ? 'text-brand-primary/60 hover:text-brand-primary hover:bg-brand-primary/5'
                  : 'text-rs-text-muted hover:text-rs-text-primary hover:bg-rs-accent-bg'
              )}
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button className="text-stone-400 hover:text-brand-primary cursor-pointer transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Collapsible Stat Cards Section */}
        <section className="px-4 md:px-8 pt-4 md:pt-6 flex-shrink-0">
          <button
            onClick={() => setStatsOpen(prev => !prev)}
            className="w-full flex items-center justify-between py-1 mb-2 group cursor-pointer"
          >
            <span className={cn(
              'text-[10px] font-bold uppercase tracking-widest',
              userRole === 'admin' ? 'text-brand-primary/40' : 'text-rs-text-muted'
            )}>
              Financial Overview
            </span>
            <ChevronDown className={cn(
              'w-4 h-4 transition-transform duration-300',
              userRole === 'admin' ? 'text-brand-primary/40' : 'text-rs-text-muted',
              statsOpen ? 'rotate-180' : 'rotate-0'
            )} />
          </button>
          <div className={cn(
            'grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 overflow-hidden transition-all duration-300 ease-in-out',
            statsOpen ? 'max-h-[600px] opacity-100 pb-2 md:pb-4' : 'max-h-0 opacity-0'
          )}>
            <StatCard
              title="Cash Position"
              amount={cashAmount}
              sub={balance ? `Opening: ${fmt(balance.openingCash, currencySymbol)}` : 'CASH PAYMENT METHODS'}
              trendType={cashTrend}
              role={userRole}
              loading={loadingBalance}
              onEdit={isAdmin ? () => setEditModal({ title: 'Cash Position', field: 'openingCash', currentOpening: balance?.openingCash ?? 0 }) : undefined}
            />
            <StatCard
              title="Bank Balance"
              amount={bankAmount}
              sub={balance ? `Opening: ${fmt(balance.openingBank, currencySymbol)}` : 'BANK PAYMENT METHODS'}
              trendType={bankTrend}
              role={userRole}
              loading={loadingBalance}
              onEdit={isAdmin ? () => setEditModal({ title: 'Bank Balance', field: 'openingBank', currentOpening: balance?.openingBank ?? 0 }) : undefined}
            />
            <StatCard
              title="Total Receivables"
              amount={recvAmount}
              sub={balance ? `Opening: ${fmt(balance.openingReceivables, currencySymbol)}` : 'OUTSTANDING FROM CLIENTS'}
              trendType={recvTrend}
              role={userRole}
              loading={loadingBalance}
              onEdit={isAdmin ? () => setEditModal({ title: 'Total Receivables', field: 'openingReceivables', currentOpening: balance?.openingReceivables ?? 0 }) : undefined}
            />
          </div>
        </section>

        {/* Scrollable Sub-Page Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8 mt-2 md:mt-4">
          <Outlet />
        </div>
      </main>

      {showSwitchConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-brand-card rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className={cn('text-lg font-bold mb-2', userRole === 'admin' ? 'text-brand-primary' : 'text-rs-text-primary')}>Switch Branch?</h3>
            <p className="text-sm text-stone-500 dark:text-rs-text-muted mb-8">Are you sure you want to switch to a different branch?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowSwitchConfirm(false)}
                className="px-5 py-2.5 text-sm font-semibold text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowSwitchConfirm(false); navigate('/select-branch'); }}
                className={cn(
                  'px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all hover:brightness-110 cursor-pointer',
                  userRole === 'admin' ? 'bg-brand-primary' : 'bg-rs-text-primary'
                )}
              >
                Yes, Switch
              </button>
            </div>
          </div>
        </div>
      )}

      {editModal && (
        <EditModal
          title={editModal.title}
          field={editModal.field}
          currentOpening={editModal.currentOpening}
          onSave={handleSaveOpening}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;
