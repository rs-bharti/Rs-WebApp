import React, { useState } from 'react';
import Sidebar from '../ui/Sidebar';
import { MoreVertical, TrendingUp, Building2, TrendingDown, Wallet, CreditCard, Landmark, Menu, ChevronDown } from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, amount, trend, trendType, role }) => (
  <article className={cn(
    "p-6 shadow-sm border transition-all duration-300",
    role === 'admin' 
      ? "bg-white border-brand-primary/10 border-b-4 rounded-sm" 
      : "bg-rs-cream border-stone-100 rounded-2xl hover:shadow-md"
  )}>
    <div className="flex justify-between items-start mb-4">
      <div>
        <h4 className={cn(
          "text-[10px] font-bold uppercase tracking-[0.2em]",
          role === 'admin' ? "text-brand-primary/50" : "text-rs-text-muted"
        )}>{title}</h4>
        <h3 className={cn(
          "text-3xl mt-1 tracking-brand-tight",
          role === 'admin' ? "font-serif text-brand-primary" : "font-user-serif font-bold text-rs-text-primary"
        )}>{amount}</h3>
      </div>
      {role === 'user' && (
        <div className="bg-white p-2 rounded-lg shadow-sm">
          {title.includes('Cash') && <Wallet className="w-6 h-6 text-rs-text-primary" />}
          {title.includes('Bank') && <Landmark className="w-6 h-6 text-rs-text-primary" />}
          {title.includes('Wallet') && <CreditCard className="w-6 h-6 text-rs-text-primary" />}
        </div>
      )}
    </div>
    <div className={cn(
      "flex items-center text-[10px] font-semibold",
      trendType === 'up' ? "text-emerald-600" : 
      trendType === 'down' ? "text-rose-600" : "text-stone-400"
    )}>
      {trendType === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
      {trendType === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
      <span className="uppercase">{trend}</span>
      {role === 'user' && trendType === 'neutral' && (
        <span className="text-rs-text-muted">Main Operating Wallet</span>
      )}
    </div>
  </article>
);

const DashboardLayout = ({ userRole = 'admin' }) => {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, activeBranch, allowedBranches, isAdmin } = useAuth();
  const userName = user?.name || 'Admin User';
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Collapsed by default on mobile, open on desktop
  const [statsOpen, setStatsOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);

  return (
    <div className={cn(
      "h-screen flex overflow-hidden transition-colors duration-300",
      userRole === 'admin' ? "bg-brand-bg" : "bg-white"
    )}>
      <Sidebar role={userRole} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className={cn(
          "h-14 md:h-16 border-b flex items-center justify-between px-4 md:px-8 flex-shrink-0 transition-colors",
          userRole === 'admin' ? "bg-brand-sidebar/50 border-brand-card" : "bg-white border-stone-100"
        )}>
          <div className="flex items-center space-x-4">
            {/* Hamburger — mobile only */}
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

            {/* Active Branch indicator — shown for both admin and user */}
            {activeBranch && (
              <>
                <span className={cn("hidden md:block h-4 w-[1px]", "bg-stone-200")}></span>
                <div className="flex items-center gap-2">
                  <Building2 className="hidden md:block w-4 h-4 text-brand-primary/60" />
                  <span className="text-sm font-semibold text-brand-primary">
                    {activeBranch.name}
                  </span>
                  {/* Admin always gets switch, user only if multiple branches */}
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
          <div className="flex items-center space-x-4">
            <button className="text-stone-400 hover:text-brand-primary cursor-pointer transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Collapsible Stat Cards Section */}
        <section className="px-4 md:px-8 pt-4 md:pt-6 flex-shrink-0">
          <button
            onClick={() => setStatsOpen(prev => !prev)}
            className={cn(
              'w-full flex items-center justify-between py-1 mb-2 group cursor-pointer',
            )}
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
              title={userRole === 'admin' ? "Cash Position" : "Cash Balance"}
              amount={userRole === 'admin' ? "$42,850.00" : "$12,450.80"}
              trend="+2.4% FROM LAST MONTH"
              trendType="up"
              role={userRole}
            />
            <StatCard
              title="Bank Balance"
              amount={userRole === 'admin' ? "$1,284,900.00" : "$84,120.00"}
              trend={userRole === 'admin' ? "PRIMARY SAVINGS & ESCROW" : "LAST SYNCED: 2 MINS AGO"}
              trendType={userRole === 'admin' ? "neutral" : "up"}
              role={userRole}
            />
            <StatCard
              title={userRole === 'admin' ? "Digital Assets" : "Digital Wallet"}
              amount={userRole === 'admin' ? "$156,220.00" : "$3,205.50"}
              trend={userRole === 'admin' ? "-0.8% MARKET VOLATILITY" : "Main Operating Wallet"}
              trendType={userRole === 'admin' ? "down" : "neutral"}
              role={userRole}
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
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 animate-in fade-in zoom-in-95 duration-200">
            <h3 className={cn('text-lg font-bold mb-2', userRole === 'admin' ? 'text-brand-primary' : 'text-rs-text-primary')}>Switch Branch?</h3>
            <p className="text-sm text-stone-500 mb-8">Are you sure you want to switch to a different branch?</p>
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
    </div>
  );
};

export default DashboardLayout;
