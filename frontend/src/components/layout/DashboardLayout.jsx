import React from 'react';
import Sidebar from '../ui/Sidebar';
import { MoreVertical, TrendingUp, Building2, TrendingDown, Wallet, CreditCard, Landmark } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
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
  const { user } = useAuth();
  const userName = user?.name || 'Admin User';

  return (
    <div className={cn(
      "h-screen flex overflow-hidden transition-colors duration-300",
      userRole === 'admin' ? "bg-brand-bg" : "bg-white"
    )}>
      <Sidebar role={userRole} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navigation Bar */}
        <header className={cn(
          "h-16 border-b flex items-center justify-between px-8 flex-shrink-0 transition-colors",
          userRole === 'admin' ? "bg-brand-sidebar/50 border-brand-card" : "bg-white border-stone-100"
        )}>
          <div className="flex items-center space-x-4">
            <span className={cn(
              "text-lg transition-all",
              userRole === 'admin' ? "font-serif text-brand-primary" : "font-user-serif font-bold text-rs-text-primary"
            )}>{userName}</span>
            <span className={cn("h-4 w-[1px]", userRole === 'admin' ? "bg-brand-primary/20" : "bg-stone-200")}></span>
            <span className={cn(
              "text-sm font-medium",
              userRole === 'admin' ? "text-brand-primary/60" : "text-rs-text-muted"
            )}>
              {userRole === 'admin' ? 'Financial Overview' : 'Operational Workspace'}
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-stone-400 hover:text-brand-primary cursor-pointer transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Persistent Stat Cards Section */}
        <section className="px-8 pt-8 flex-shrink-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 mt-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
