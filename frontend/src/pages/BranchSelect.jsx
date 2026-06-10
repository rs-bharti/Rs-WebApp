import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, LogOut, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getBranches } from '../api/users';
import { getMasterBranches } from '../api/masters';

const BranchSelect = () => {
  const navigate = useNavigate();
  const { user, allowedBranches, selectBranch, logout, isAdmin } = useAuth();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [branches, setBranches] = useState([]);
  const [search, setSearch]     = useState('');
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        if (isAdmin) {
          // Admin → fetch all branches with full location data from DB
          const all = await getBranches();
          setBranches(all);
        } else {
          // User → fetch full branch data then filter by their allowed branches
          const all = await getMasterBranches();
          const allowedIds = allowedBranches.map(b => b.id);
          const filtered = all.filter(b => allowedIds.includes(b.id));
          setBranches(filtered.length > 0 ? filtered : allowedBranches);
        }
      } catch {
        setBranches(isAdmin ? [] : allowedBranches);
      }
      setLoading(false);
    };
    load();
  }, [isAdmin, allowedBranches]);

  const filtered = branches.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (branch) => {
    selectBranch(branch); // pass full object so country/state/city is available app-wide
    navigate('/dashboard');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      <header className="w-full px-4 py-4 md:px-8 md:py-6 flex justify-between items-center border-b border-stone-200/50">
        <div className="text-2xl font-serif tracking-wide text-brand-primary">RS Bharti</div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-stone-500">
            {user?.name} &nbsp;·&nbsp;
            <span className="capitalize font-medium text-brand-primary">{user?.role}</span>
          </span>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-stone-400 hover:text-brand-primary hover:bg-brand-primary/5 transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-stone-400 hover:text-brand-primary transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 rounded-full mb-4">
              <Building2 className="w-8 h-8 text-brand-primary" />
            </div>
            <h1 className="text-3xl font-serif text-brand-primary mb-2">Select Branch</h1>
            <p className="text-stone-500 text-sm">
              Welcome, <span className="font-semibold text-brand-primary">{user?.name}</span>.
              {isAdmin
                ? ' You have access to all branches.'
                : ` You have access to ${branches.length} branch${branches.length !== 1 ? 'es' : ''}.`}
            </p>
          </div>

          {/* Search — show only if many branches */}
          {branches.length > 6 && (
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Search branch..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary bg-white"
              />
            </div>
          )}

          {loading ? (
            <div className="text-center text-stone-400 py-12">Loading branches...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-stone-400 py-12">No branches found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
              {filtered.map((branch, idx) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch)}
                  className="group flex items-start gap-4 p-5 bg-white border-2 border-stone-200 rounded-xl hover:border-brand-primary hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-primary/20 transition-colors">
                    <span className="text-xs font-bold text-brand-primary">#{idx + 1}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-brand-primary text-sm truncate">{branch.name}</p>
                    {(branch.country?.name || branch.state?.name || branch.city?.name) && (
                      <p className="text-[10px] text-stone-500 mt-1 truncate">
                        {[branch.city?.name, branch.state?.name, branch.country?.name].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="text-[10px] text-stone-400 mt-0.5 uppercase tracking-wider">Click to enter</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default BranchSelect;
