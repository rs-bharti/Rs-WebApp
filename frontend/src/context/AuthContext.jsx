import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [token, setToken]             = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    const storedToken  = localStorage.getItem('token');
    const storedUser   = localStorage.getItem('user');
    const storedBranch = localStorage.getItem('activeBranch');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedBranch) setActiveBranch(JSON.parse(storedBranch));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('userRole', userData.role);
    localStorage.setItem('userName', userData.name);
  };

  const selectBranch = (branch) => {
    setActiveBranch(branch);
    localStorage.setItem('activeBranch', JSON.stringify(branch));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setActiveBranch(null);
    localStorage.clear();
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

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        activeBranch,
        selectBranch,
        login,
        logout,
        loading,
        isAdmin,
        isAuthenticated: !!user,
        permissions,
        canAccessVoucher,
        canAccessMaster,
        canAccessBranch,
        filterBranches,
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
