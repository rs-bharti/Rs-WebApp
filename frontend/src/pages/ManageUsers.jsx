import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Navigate } from 'react-router-dom';
import {
  Users, Settings2, FileText, Database, Building2, X, AlertTriangle,
  KeyRound, Eye, EyeOff, Mail, Pencil, User, ShieldOff, ShieldCheck,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getUsers, updateUserPermissions, getBranches, toggleUserActive } from '../api/users';
import { useAuth } from '../context/AuthContext';

const VOUCHER_MODULES = ['Receipt', 'Payment', 'Sales', 'Sales Return', 'Purchase', 'Contra', 'Purchase Return', 'Stock Data', 'Stock Transfer'];
const MASTER_MODULES  = ['Customer', 'Supplier', 'Product', 'Warehouse', 'Expense', 'Payment Method'];
const OTHER_MODULES   = ['DSR', 'Client Ledger', 'Supplier Ledger', 'Stock Ledger', 'Money Ledger'];

const allFalse = (list) => list.reduce((a, k) => ({ ...a, [k]: false }), {});
const allTrue  = (list) => list.reduce((a, k) => ({ ...a, [k]: true  }), {});


// ── Edit Permissions Modal ─────────────────────────────────────────────────
const EditPermissionsModal = ({ user, branches, onSave, onCancel }) => {
  // Parse permissions — backend may return a JSON string or a plain object
  const perms = (() => {
    const raw = user.permissions;
    if (!raw) return {};
    if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
    return raw;
  })();

  const init = (mods, stored) => mods.reduce((a, k) => ({ ...a, [k]: !!(stored?.[k]) }), {});

  const [voucherAccess, setVoucherAccess] = useState(init(VOUCHER_MODULES, perms.vouchers));
  const [masterAccess,  setMasterAccess]  = useState(init(MASTER_MODULES,  perms.masters));
  const [otherAccess,   setOtherAccess]   = useState(init(OTHER_MODULES,   perms.others));
  const [branchAccess,  setBranchAccess]  = useState(
    // compare as strings to handle number/string mismatch from API
    branches.reduce((a, br) => ({
      ...a,
      [br.id]: (perms.branches ?? []).some(id => String(id) === String(br.id)),
    }), {})
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [newEmail,           setNewEmail]           = useState(user.email || '');
  const [newPassword,        setNewPassword]        = useState('');
  const [showCurrentPw,      setShowCurrentPw]      = useState(false);
  const [showNewPw,          setShowNewPw]          = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const allVoucher = VOUCHER_MODULES.every(v => voucherAccess[v]);
  const allMaster  = MASTER_MODULES.every(m => masterAccess[m]);
  const allOther   = OTHER_MODULES.every(o => otherAccess[o]);
  const allBranch  = branches.length > 0 && branches.every(b => branchAccess[b.id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const checkedBranches = branches.filter(b => branchAccess[b.id]);
      const permissions = {
        vouchers:    voucherAccess,
        masters:     masterAccess,
        others:      otherAccess,
        branches:    checkedBranches.map(b => b.id),
        branchNames: checkedBranches.map(b => b.name),
      };
      await onSave(permissions, newPassword.trim() || null, newEmail.trim() || null);
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={e => e.stopPropagation()}>

        <div className="bg-brand-primary px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-serif text-xl">Edit Permissions</h2>
            <p className="text-white/60 text-[11px] uppercase tracking-widest">{user.name} · {user.email}</p>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-8">

          {/* Voucher Access */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-accent" />
              <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Voucher Access</h4>
              <button type="button"
                onClick={() => setVoucherAccess(allVoucher ? allFalse(VOUCHER_MODULES) : allTrue(VOUCHER_MODULES))}
                className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                {allVoucher ? 'Uncheck all' : 'Check all'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
              {VOUCHER_MODULES.map(item => (
                <label key={item} className="flex items-center text-sm text-stone-600 cursor-pointer group">
                  <input type="checkbox" checked={voucherAccess[item] || false}
                    onChange={() => setVoucherAccess(p => ({ ...p, [item]: !p[item] }))}
                    className="rounded mr-3 border-stone-300 accent-brand-primary" />
                  <span className="group-hover:text-brand-primary transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Master Access */}
          <div className="pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-brand-accent" />
              <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Master Access</h4>
              <button type="button"
                onClick={() => setMasterAccess(allMaster ? allFalse(MASTER_MODULES) : allTrue(MASTER_MODULES))}
                className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                {allMaster ? 'Uncheck all' : 'Check all'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
              {MASTER_MODULES.map(item => (
                <label key={item} className="flex items-center text-sm text-stone-600 cursor-pointer group">
                  <input type="checkbox" checked={masterAccess[item] || false}
                    onChange={() => setMasterAccess(p => ({ ...p, [item]: !p[item] }))}
                    className="rounded mr-2 border-stone-300 accent-brand-primary" />
                  <span className="group-hover:text-brand-primary transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Other Reports Access */}
          <div className="pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-brand-accent" />
              <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Other Reports Access</h4>
              <button type="button"
                onClick={() => setOtherAccess(allOther ? allFalse(OTHER_MODULES) : allTrue(OTHER_MODULES))}
                className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                {allOther ? 'Uncheck all' : 'Check all'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-3 gap-x-4">
              {OTHER_MODULES.map(item => (
                <label key={item} className="flex items-center text-sm text-stone-600 cursor-pointer group">
                  <input type="checkbox" checked={otherAccess[item] || false}
                    onChange={() => setOtherAccess(p => ({ ...p, [item]: !p[item] }))}
                    className="rounded mr-2 border-stone-300 accent-brand-primary" />
                  <span className="group-hover:text-brand-primary transition-colors">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Branch Access */}
          {branches.length > 0 && (
            <div className="pt-6 border-t border-stone-100">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-4 h-4 text-brand-accent" />
                <h4 className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">Branch Access</h4>
                <button type="button"
                  onClick={() => setBranchAccess(
                    allBranch
                      ? branches.reduce((a, b) => ({ ...a, [b.id]: false }), {})
                      : branches.reduce((a, b) => ({ ...a, [b.id]: true  }), {})
                  )}
                  className="ml-auto text-[10px] text-brand-primary underline cursor-pointer">
                  {allBranch ? 'Uncheck all' : 'Check all'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-3 gap-x-2">
                {branches.map(branch => (
                  <label key={branch.id}
                    className="flex items-center text-[11px] text-stone-600 bg-stone-50/50 p-2 rounded border border-transparent cursor-pointer hover:bg-brand-primary/5 hover:border-brand-primary/10 group transition-all">
                    <input type="checkbox"
                      checked={branchAccess[branch.id] || false}
                      onChange={() => setBranchAccess(p => ({ ...p, [branch.id]: !p[branch.id] }))}
                      className="rounded mr-2 border-stone-300 accent-brand-primary" />
                    <span className="font-medium group-hover:text-brand-primary transition-colors">{branch.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Email */}
          <div className="pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <Mail className="w-4 h-4 text-brand-accent" />
              <h4 className="text-[10px] font-bold text-brand-accent">Email</h4>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-400 block mb-1.5">Email</label>
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 focus-within:border-brand-primary focus-within:bg-white transition-colors">
                <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="Enter email"
                  autoCapitalize="none"
                  autoComplete="email"
                  className="flex-1 text-sm bg-transparent outline-none text-stone-700 placeholder:text-stone-300"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 mb-4">
              <KeyRound className="w-4 h-4 text-brand-accent" />
              <h4 className="text-[10px] font-bold text-brand-accent">Password</h4>
            </div>

            {user.plainPassword && (
              <div className="mb-4">
                <label className="text-[10px] font-bold text-stone-400 block mb-1.5">Current Password</label>
                <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5">
                  <span className="flex-1 text-sm font-mono text-stone-700 tracking-widest">
                    {showCurrentPw ? user.plainPassword : '•'.repeat(Math.min(user.plainPassword.length, 16))}
                  </span>
                  <button type="button" onClick={() => setShowCurrentPw(p => !p)}
                    className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer flex-shrink-0">
                    {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-stone-400 block mb-1.5">New Password</label>
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 focus-within:border-brand-primary transition-colors">
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  autoCapitalize="none"
                  autoComplete="new-password"
                  data-no-upper
                  className="flex-1 text-sm bg-transparent outline-none text-stone-700 placeholder:text-stone-300"
                />
                <button type="button" onClick={() => setShowNewPw(p => !p)}
                  className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer flex-shrink-0">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-stone-400 mt-1.5">Leave blank to keep password unchanged</p>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-600 text-sm">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onCancel} disabled={saving}
            className="px-6 py-2.5 border border-stone-300 rounded text-stone-600 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-2.5 bg-brand-primary text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Permissions'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── Edit Details Modal (admin users) ──────────────────────────────────────
const EditDetailsModal = ({ user, onSave, onCancel }) => {
  const [name,        setName]        = useState(user.name          || '');
  const [email,       setEmail]       = useState(user.email         || '');
  const [newPassword, setNewPassword] = useState(user.plainPassword || '');
  const [showPw,      setShowPw]      = useState(false);
  const [saving,      setSaving]     = useState(false);
  const [error,       setError]      = useState('');

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSave = async () => {
    if (!name.trim())        { setError('Name cannot be empty.'); return; }
    if (!email.trim())       { setError('Email cannot be empty.'); return; }
    if (!newPassword.trim()) { setError('Password cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSave({
        name:     name.trim(),
        email:    email.trim(),
        password: newPassword.trim(),
      });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-brand-primary px-6 py-5 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-white font-serif text-xl">Edit Details</h2>
            <p className="text-white/60 text-[11px] uppercase tracking-widest">{user.name} · {user.email}</p>
          </div>
          <button onClick={onCancel} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 space-y-5">

          {/* Name */}
          <div>
            <label className="text-[10px] uppercase font-bold text-stone-400 tracking-widest block mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Name
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 focus-within:border-brand-primary focus-within:bg-white transition-colors">
              <User className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter name"
                className="flex-1 text-sm bg-transparent outline-none text-stone-700 placeholder:text-stone-300"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] font-bold text-stone-400 block mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Email
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 focus-within:border-brand-primary focus-within:bg-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email"
                autoCapitalize="none"
                autoComplete="email"
                className="flex-1 text-sm bg-transparent outline-none text-stone-700 placeholder:text-stone-300"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] font-bold text-stone-400 block mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Password
            </label>
            <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 focus-within:border-brand-primary focus-within:bg-white transition-colors">
              <input
                type={showPw ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter password"
                autoCapitalize="none"
                autoComplete="new-password"
                data-no-upper
                className="flex-1 text-sm bg-transparent outline-none text-stone-700 placeholder:text-stone-300"
              />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="text-stone-400 hover:text-stone-600 transition-colors cursor-pointer flex-shrink-0">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-600 text-sm">{error}</div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-stone-100 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onCancel} disabled={saving}
            className="px-6 py-2.5 border border-stone-300 rounded text-stone-600 font-bold text-[10px] uppercase tracking-widest hover:bg-stone-50 transition-colors cursor-pointer">
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-8 py-2.5 bg-brand-primary text-white rounded font-bold text-[10px] uppercase tracking-widest hover:bg-brand-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ── User Card ──────────────────────────────────────────────────────────────
const UserCard = ({ user, onEdit, onEditDetails, onToggleActive }) => {
  const isAdminUser  = user.role === 'admin' || user.role?.name === 'admin';
  const isActive     = user.isActive !== false;
  const voucherCount = Object.values(user.permissions?.vouchers || {}).filter(Boolean).length;
  const masterCount  = Object.values(user.permissions?.masters  || {}).filter(Boolean).length;
  const branchCount  = (user.permissions?.branches || []).length;

  return (
    <div className={cn('border rounded-xl p-5 shadow-sm transition-all', isActive ? 'bg-white border-stone-200 hover:shadow-md' : 'bg-stone-50 border-red-200')}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
            isAdminUser ? 'bg-brand-primary' : isActive ? 'bg-stone-400' : 'bg-red-300'
          )}>
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className={cn('font-semibold text-sm truncate', isActive ? 'text-stone-800' : 'text-stone-400')}>{user.name}</p>
            <p className="text-stone-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
          <span className={cn(
            'text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full',
            isAdminUser ? 'bg-brand-primary/10 text-brand-primary' : 'bg-stone-100 text-stone-500'
          )}>
            {isAdminUser ? 'Admin' : 'User'}
          </span>
          {!isActive && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-500">
              Blocked
            </span>
          )}
        </div>
      </div>

      {isAdminUser ? (
        <p className="text-xs text-stone-400 italic mb-4">Full access · all permissions granted</p>
      ) : (
        <div className="flex gap-4 mb-4 text-xs text-stone-500">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3 h-3" />{voucherCount} Vouchers
          </span>
          <span className="flex items-center gap-1.5">
            <Database className="w-3 h-3" />{masterCount} Masters
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3" />{branchCount} {branchCount === 1 ? 'Branch' : 'Branches'}
          </span>
        </div>
      )}

      <div className="flex gap-2 pt-3 border-t border-stone-100">
        {isAdminUser ? (
          <button onClick={() => onEditDetails(user)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-primary border border-brand-primary/30 rounded-lg hover:bg-brand-primary/5 transition-all cursor-pointer">
            <Pencil className="w-3.5 h-3.5" /> Edit Details
          </button>
        ) : (
          <button onClick={() => onEdit(user)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest text-brand-primary border border-brand-primary/30 rounded-lg hover:bg-brand-primary/5 transition-all cursor-pointer">
            <Settings2 className="w-3.5 h-3.5" /> Edit Access
          </button>
        )}
        <button onClick={() => onToggleActive(user)}
          className={cn(
            'flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg border transition-all cursor-pointer',
            isActive
              ? 'text-red-500 border-red-200 hover:bg-red-50'
              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
          )}>
          {isActive ? <ShieldOff className="w-3.5 h-3.5" /> : <ShieldCheck className="w-3.5 h-3.5" />}
          {isActive ? 'Block' : 'Unblock'}
        </button>
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────────────────────
const ManageUsers = () => {
  const { isAdmin } = useAuth();
  const [users,    setUsers]    = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [editTarget,         setEditTarget]         = useState(null);
  const [editDetailsTarget,  setEditDetailsTarget]  = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, b] = await Promise.all([getUsers(), getBranches()]);
        setUsers(u);
        setBranches(b);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const flash = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleToggleActive = async (user) => {
    try {
      const updated = await toggleUserActive(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: updated.isActive } : u));
      flash(`${user.name} has been ${updated.isActive ? 'unblocked' : 'blocked'}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSavePermissions = async (permissions, newPassword, newEmail) => {
    await updateUserPermissions(editTarget.id, permissions, newPassword, newEmail);
    setUsers(prev => prev.map(u => u.id === editTarget.id
      ? {
          ...u, permissions,
          ...(newPassword ? { plainPassword: newPassword } : {}),
          email: (newEmail || u.email).toLowerCase().trim(),
        }
      : u
    ));
    const changes = [newEmail !== editTarget.email && 'email', newPassword && 'password'].filter(Boolean);
    flash(`Updated ${editTarget.name}${changes.length ? ` (${changes.join(' & ')} changed)` : ''}.`);
    setEditTarget(null);
  };

  const handleSaveDetails = async ({ name, email, password }) => {
    await updateUserPermissions(editDetailsTarget.id, undefined, password, email, name);
    setUsers(prev => prev.map(u => u.id === editDetailsTarget.id
      ? {
          ...u,
          ...(name     ? { name }                              : {}),
          ...(email    ? { email: email.toLowerCase().trim() } : {}),
          ...(password ? { plainPassword: password }           : {}),
        }
      : u
    ));
    const changes = [name && 'name', email && 'email', password && 'password'].filter(Boolean);
    flash(`Updated ${editDetailsTarget.name}${changes.length ? ` (${changes.join(', ')} changed)` : ''}.`);
    setEditDetailsTarget(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-stone-400 text-sm">Loading users...</p>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {editTarget && (
        <EditPermissionsModal
          user={editTarget}
          branches={branches}
          onSave={handleSavePermissions}
          onCancel={() => setEditTarget(null)}
        />
      )}
      {editDetailsTarget && (
        <EditDetailsModal
          user={editDetailsTarget}
          onSave={handleSaveDetails}
          onCancel={() => setEditDetailsTarget(null)}
        />
      )}

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl mb-1 text-brand-primary">Manage Users</h2>
          <p className="text-stone-500 text-sm">View all users, edit their access permissions, or remove them.</p>
        </div>
        <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-xl px-5 py-3 text-center flex-shrink-0">
          <p className="text-2xl font-serif font-bold text-brand-primary">{users.length}</p>
          <p className="text-[10px] uppercase tracking-widest text-brand-primary/60 mt-0.5">Total Users</p>
        </div>
      </div>

      {successMsg && (
        <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-700 text-sm">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-6 p-3 bg-rose-50 border border-rose-200 rounded-md text-rose-600 text-sm">
          {error}
        </div>
      )}

      {users.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No users found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={setEditTarget}
              onEditDetails={setEditDetailsTarget}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
