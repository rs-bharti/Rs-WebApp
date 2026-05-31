import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ShieldCheck, FileText, Database, Building2, X, CheckCircle, User, Mail, Lock, Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import { createUser, getBranches, getRoles } from '../api/users';

// ── Success Popup ──────────────────────────────────────────────
const SuccessPopup = ({ data, onClose }) => {
  if (!data) return null;

  const grantedVouchers = Object.entries(data.permissions.vouchers || {})
    .filter(([, v]) => v).map(([k]) => k);
  const grantedMasters = Object.entries(data.permissions.masters || {})
    .filter(([, v]) => v).map(([k]) => k);
  const grantedBranches = data.permissions.branchNames || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-brand-primary px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-white font-serif text-xl">User Created Successfully</h2>
              <p className="text-white/60 text-[11px] uppercase tracking-widest">Share these credentials with the user</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <User className="w-3.5 h-3.5 text-brand-primary/60" />
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Name</span>
              </div>
              <p className="text-brand-primary font-semibold text-sm">{data.name}</p>
            </div>
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-3.5 h-3.5 text-brand-primary/60" />
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Role</span>
              </div>
              <p className="text-brand-primary font-semibold text-sm capitalize">{data.role}</p>
            </div>
          </div>

          <div className="bg-stone-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-3.5 h-3.5 text-brand-primary/60" />
              <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Email</span>
            </div>
            <p className="text-brand-primary font-semibold text-sm">{data.email}</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] uppercase tracking-widest text-emerald-600 font-bold">Password</span>
            </div>
            <p className="text-emerald-700 font-bold text-lg tracking-widest">{data.password}</p>
          </div>

          {/* Branches */}
          {grantedBranches.length > 0 && (
            <div className="bg-stone-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-3.5 h-3.5 text-brand-primary/60" />
                <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                  Branch Access ({grantedBranches.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {grantedBranches.map(b => (
                  <span key={b} className="bg-brand-primary/10 text-brand-primary text-[11px] px-2 py-0.5 rounded-full font-medium">{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Vouchers & Masters */}
          <div className="grid grid-cols-2 gap-3">
            {grantedVouchers.length > 0 && (
              <div className="bg-stone-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-3.5 h-3.5 text-brand-primary/60" />
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Vouchers</span>
                </div>
                <div className="space-y-1">
                  {grantedVouchers.map(v => (
                    <p key={v} className="text-[11px] text-stone-600">• {v}</p>
                  ))}
                </div>
              </div>
            )}
            {grantedMasters.length > 0 && (
              <div className="bg-stone-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-3.5 h-3.5 text-brand-primary/60" />
                  <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Masters</span>
                </div>
                <div className="space-y-1">
                  {grantedMasters.map(m => (
                    <p key={m} className="text-[11px] text-stone-600">• {m}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button onClick={onClose}
            className="w-full py-3 bg-brand-primary text-white rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

const VOUCHER_MODULES = ['Receipt', 'Payment', 'Sales', 'Sales Return', 'Purchase', 'Contra', 'Purchase Return', 'Stock Data', 'Stock Transfer'];
const MASTER_MODULES  = ['Customer', 'Area', 'City', 'State', 'Branches', 'Country', 'Payment Method', 'Supplier', 'Product', 'Category', 'Unit', 'Warehouse'];

const allFalse = (list) => list.reduce((a, k) => ({ ...a, [k]: false }), {});
const allTrue  = (list) => list.reduce((a, k) => ({ ...a, [k]: true  }), {});

// Fallback roles in case API fails
const DEFAULT_ROLES = [
  { id: 'admin', name: 'admin' },
  { id: 'user',  name: 'user'  },
];

const Registration = () => {
  const [form, setForm]               = useState({ name: '', email: '', password: '', roleId: 'user' });
  const [showPassword, setShowPassword] = useState(false);
  const [voucherAccess, setVoucherAccess] = useState(allFalse(VOUCHER_MODULES));
  const [masterAccess,  setMasterAccess]  = useState(allFalse(MASTER_MODULES));
  const [branchAccess,  setBranchAccess]  = useState({});
  const [branches, setBranches] = useState([]);
  const [roles,    setRoles]    = useState(DEFAULT_ROLES);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [popup,    setPopup]    = useState(null); // holds created user data for popup

  useEffect(() => {
    const load = async () => {
      try {
        const [b, r] = await Promise.all([getBranches(), getRoles()]);
        setBranches(b);
        if (r && r.length > 0) setRoles(r);
        setBranchAccess(b.reduce((a, br) => ({ ...a, [br.id]: false }), {}));
        const userRole = r.find((role) => role.name === 'user');
        if (userRole) setForm((p) => ({ ...p, roleId: String(userRole.id) }));
      } catch (err) {
        setError('Could not load data: ' + err.message);
      }
    };
    load();
  }, []);

  const selectedRoleName = roles.find((r) => String(r.id) === form.roleId)?.name || 'user';
  const isAdmin = selectedRoleName === 'admin';

  const handleRoleChange = (roleId) => {
    const roleName = roles.find((r) => String(r.id) === String(roleId))?.name;
    setForm((p) => ({ ...p, roleId: String(roleId) }));
    if (roleName === 'admin') {
      setVoucherAccess(allTrue(VOUCHER_MODULES));
      setMasterAccess(allTrue(MASTER_MODULES));
      setBranchAccess(branches.reduce((a, br) => ({ ...a, [br.id]: true }), {}));
    } else {
      setVoucherAccess(allFalse(VOUCHER_MODULES));
      setMasterAccess(allFalse(MASTER_MODULES));
      setBranchAccess(branches.reduce((a, br) => ({ ...a, [br.id]: false }), {}));
    }
  };

  const handleChange = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const allVoucherChecked = VOUCHER_MODULES.every((v) => voucherAccess[v]);
  const allMasterChecked  = MASTER_MODULES.every((m)  => masterAccess[m]);
  const allBranchChecked  = branches.every((b)         => branchAccess[b.id]);

  const resetForm = () => {
    setForm((p) => ({ name: '', email: '', password: '', roleId: p.roleId }));
    setVoucherAccess(allFalse(VOUCHER_MODULES));
    setMasterAccess(allFalse(MASTER_MODULES));
    setBranchAccess(branches.reduce((a, br) => ({ ...a, [br.id]: false }), {}));
    setError(''); setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    const checkedBranches = branches.filter((b) => branchAccess[b.id]);
    if (!form.name || !form.email || !form.password || !form.roleId) {
      setError('Name, email, password and role are required.');
      return;
    }
    if (!isAdmin && checkedBranches.length === 0) {
      setError('Please select at least one branch for this user.');
      return;
    }

    // Primary branchId = first selected branch (or first branch for admin)
    const primaryBranchId = isAdmin
      ? branches[0]?.id
      : checkedBranches[0]?.id;

    if (!primaryBranchId) {
      setError('No branches available. Please add a branch first.');
      return;
    }

    setLoading(true);
    try {
      const permissions = {
        vouchers:    voucherAccess,
        masters:     masterAccess,
        branches:    branches.filter((b) => branchAccess[b.id]).map((b) => b.id),
        branchNames: branches.filter((b) => branchAccess[b.id]).map((b) => b.name),
      };

      const newUser = await createUser({
        name:     form.name,
        email:    form.email,
        password: form.password,
        roleId:   Number(form.roleId),
        branchId: primaryBranchId,
        permissions,
      });

      // Show success popup with all user details
      setPopup({
        name:        form.name,
        email:       form.email,
        password:    form.password,
        role:        selectedRoleName,
        permissions,
      });
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Success Popup */}
      <SuccessPopup data={popup} onClose={() => setPopup(null)} />

      <div className="mb-8">
        <h2 className="font-serif text-3xl mb-1 text-brand-primary">New User Registration</h2>
        <p className="text-stone-500 text-sm">Create a new user and assign exactly what they can access.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="flex flex-col lg:flex-row gap-8 items-start pb-12">

          {/* ── LEFT: Identity ── */}
          <div className="w-full lg:w-1/3 space-y-6">
            <div className="bg-brand-card p-6 rounded-xl border border-stone-200 shadow-sm">
              <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest mb-6">User Identity</h4>
              <div className="space-y-5">

                <div>
                  <label className="text-[10px] font-bold text-brand-accent uppercase mb-1 block">Name of User</label>
                  <input className="w-full border border-stone-200 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-white outline-none"
                    placeholder="e.g. Rahul Sharma" type="text"
                    value={form.name} onChange={handleChange('name')} required />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-brand-accent uppercase mb-1 block">Email of User</label>
                  <input className="w-full border border-stone-200 rounded-md py-2 px-3 text-sm focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-white outline-none"
                    placeholder="rahul.s@rsbharti.com" type="email"
                    value={form.email} onChange={handleChange('email')} required />
                </div>

                <div className="relative">
                  <label className="text-[10px] font-bold text-brand-accent uppercase mb-1 block">Password</label>
                  <input className="w-full border border-stone-200 rounded-md py-2 px-3 pr-10 text-sm focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-white outline-none"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Set a strong password"
                    value={form.password} onChange={handleChange('password')} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-7 text-stone-400 hover:text-brand-primary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-brand-accent uppercase mb-3 block">Primary Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <button key={role.id} type="button" onClick={() => handleRoleChange(role.id)}
                        className={cn(
                          'py-2 px-4 rounded-md text-xs font-bold uppercase tracking-widest transition-all border',
                          String(form.roleId) === String(role.id)
                            ? 'bg-brand-primary text-white border-brand-primary shadow-sm'
                            : 'bg-white text-stone-400 border-stone-200 hover:border-brand-primary/30'
                        )}>
                        {role.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-primary text-white p-6 rounded-xl relative overflow-hidden shadow-lg">
              <h4 className="text-xl font-serif mb-3">Security Tip</h4>
              <p className="text-stone-300 text-xs leading-relaxed">
                {isAdmin
                  ? 'Admin role grants full access. The user will log in with the password you set here.'
                  : 'Select only the modules this user needs. They will only see what you allow.'}
              </p>
              <ShieldCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5" />
            </div>
          </div>

          {/* ── RIGHT: Permissions ── */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white border border-stone-100 shadow-brand-card p-8 rounded-xl">
              <h3 className="font-serif text-2xl mb-2 text-brand-primary border-b border-stone-50 pb-4">
                Role of User &amp; Permissions
              </h3>
              <p className="text-[11px] text-stone-400 mb-8">
                {isAdmin
                  ? 'Admin has full access — all permissions are granted automatically.'
                  : 'Tick exactly what this user is allowed to access. They will only see these items after login.'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Voucher Access */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-4 h-4 text-brand-accent" />
                    <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Voucher Access</h4>
                    {!isAdmin && (
                      <button type="button"
                        onClick={() => setVoucherAccess(allVoucherChecked ? allFalse(VOUCHER_MODULES) : allTrue(VOUCHER_MODULES))}
                        className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                        {allVoucherChecked ? 'Uncheck all' : 'Check all'}
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {VOUCHER_MODULES.map((item) => (
                      <label key={item} className={cn('flex items-center text-sm text-stone-600 group', !isAdmin && 'cursor-pointer')}>
                        <input type="checkbox"
                          checked={voucherAccess[item] || false}
                          onChange={() => !isAdmin && setVoucherAccess((p) => ({ ...p, [item]: !p[item] }))}
                          disabled={isAdmin}
                          className="rounded mr-3 border-stone-300 accent-brand-primary" />
                        <span className={cn(!isAdmin && 'group-hover:text-brand-primary transition-colors')}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Master Access */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Database className="w-4 h-4 text-brand-accent" />
                    <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Master Access</h4>
                    {!isAdmin && (
                      <button type="button"
                        onClick={() => setMasterAccess(allMasterChecked ? allFalse(MASTER_MODULES) : allTrue(MASTER_MODULES))}
                        className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                        {allMasterChecked ? 'Uncheck all' : 'Check all'}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                    {MASTER_MODULES.map((item) => (
                      <label key={item} className={cn('flex items-center text-sm text-stone-600 group', !isAdmin && 'cursor-pointer')}>
                        <input type="checkbox"
                          checked={masterAccess[item] || false}
                          onChange={() => !isAdmin && setMasterAccess((p) => ({ ...p, [item]: !p[item] }))}
                          disabled={isAdmin}
                          className="rounded mr-2 border-stone-300 accent-brand-primary" />
                        <span className={cn(!isAdmin && 'group-hover:text-brand-primary transition-colors')}>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Branch Access Control */}
              <div className="mt-10 pt-8 border-t border-stone-100">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4 text-brand-accent" />
                  <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Branch Access Control</h4>
                  {!isAdmin && branches.length > 0 && (
                    <button type="button"
                      onClick={() => setBranchAccess(allBranchChecked
                        ? branches.reduce((a, b) => ({ ...a, [b.id]: false }), {})
                        : branches.reduce((a, b) => ({ ...a, [b.id]: true  }), {})
                      )}
                      className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                      {allBranchChecked ? 'Uncheck all' : 'Check all'}
                    </button>
                  )}
                </div>

                {branches.length === 0 ? (
                  <p className="text-sm text-stone-400 italic">No branches found. Add branches via Branch Master first.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-y-4 gap-x-2">
                    {branches.map((branch) => (
                      <label key={branch.id}
                        className={cn(
                          'flex items-center text-[11px] text-stone-600 bg-stone-50/50 p-2 rounded border border-transparent transition-all',
                          !isAdmin && 'cursor-pointer hover:bg-brand-primary/5 hover:border-brand-primary/10 group'
                        )}>
                        <input type="checkbox"
                          checked={branchAccess[branch.id] || false}
                          onChange={() => !isAdmin && setBranchAccess((p) => ({ ...p, [branch.id]: !p[branch.id] }))}
                          disabled={isAdmin}
                          className="rounded mr-2 border-stone-300 accent-brand-primary" />
                        <span className={cn('font-medium', !isAdmin && 'group-hover:text-brand-primary transition-colors')}>
                          {branch.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Feedback */}
              {error   && <div className="mt-6 p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-600 text-sm">{error}</div>}
              {success && <div className="mt-6 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-sm">{success}</div>}

              {/* Buttons */}
              <div className="mt-8 pt-6 border-t border-stone-100 flex justify-end gap-4">
                <button type="button" onClick={resetForm}
                  className="px-8 py-2 border border-stone-300 rounded text-stone-600 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="px-8 py-2 bg-brand-primary text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                  {loading ? 'Saving...' : 'Save User Profile'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};

export default Registration;
