import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    // Clear any stale localStorage auth data from the old storage strategy
    ['token', 'user', 'userRole', 'userName', 'activeBranch'].forEach(k => localStorage.removeItem(k));

    const storedToken  = sessionStorage.getItem('token');
    const storedUser   = sessionStorage.getItem('user');
    const storedBranch = sessionStorage.getItem('activeBranch');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedBranch) setActiveBranch(JSON.parse(storedBranch));
      } catch {
        sessionStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    sessionStorage.setItem('token', authToken);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('userRole', userData.role);
    sessionStorage.setItem('userName', userData.name);
  };

  const selectBranch = (branch) => {
    setActiveBranch(branch);
    sessionStorage.setItem('activeBranch', JSON.stringify(branch));
  };

  const clearBranch = () => {
    setActiveBranch(null);
    sessionStorage.removeItem('activeBranch');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveBranch(null);
    sessionStorage.clear();
  };

  const isAdmin = user?.role === 'admin';
  const permissions = user?.permissions || {};

  // Check if this user can access a specific voucher
  const canAccessVoucher = (name) => {
    if (isAdmin) return true;
    return permissions?.vouchers?.[name] === true;
  };

  // Check if this user can access a specific master
  const canAccessMaster = (name) => {
    if (isAdmin) return true;
    return permissions?.masters?.[name] === true;
  };

  // Check if this user can access a specific "Other" report
  const canAccessOther = (name) => {
    if (isAdmin) return true;
    return permissions?.others?.[name] === true;
  };

  // Check if this user can access a specific branch (by branch id)
  const canAccessBranch = (branchId) => {
    if (isAdmin) return true;
    const allowed = permissions?.branches;
    if (!allowed || allowed.length === 0) return false;
    return allowed.includes(Number(branchId));
  };

  // Returns only the branches the user is allowed to see
  const filterBranches = (branchList) => {
    if (isAdmin) return branchList;
    const allowed = permissions?.branches || [];
    return branchList.filter(b => allowed.includes(Number(b.id)));
  };

  // Currency symbol derived from the active branch's country
  const currencySymbol = activeBranch?.country?.currency || '₹';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeBranch,
        selectBranch,
        clearBranch,
        login,
        logout,
        loading,
        isAdmin,
        isAuthenticated: !!user,
        permissions,
        canAccessVoucher,
        canAccessMaster,
        canAccessOther,
        canAccessBranch,
        filterBranches,
        currencySymbol,
        // List of branches this user can access [{id, name}]
        allowedBranches: isAdmin
          ? []   // admin sees all — handled separately via API
          : (permissions?.branches || []).map((id, i) => ({
              id,
              name: permissions?.branchNames?.[i] || `Branch ${id}`,
            })),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
