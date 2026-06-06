const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const activeBranch = JSON.parse(localStorage.getItem('activeBranch') || 'null');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    ...(activeBranch?.id ? { 'X-Branch-Id': String(activeBranch.id) } : {}),
  };
};

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── Countries ──────────────────────────────────────────────────────────────────
export const getCountries = () => apiFetch('/api/masters/countries');

// ── States ─────────────────────────────────────────────────────────────────────
export const getStates = (countryId) => apiFetch(`/api/masters/states${countryId ? `?countryId=${countryId}` : ''}`);

// ── Cities ─────────────────────────────────────────────────────────────────────
export const getCities = ({ stateId, search } = {}) => {
  const params = new URLSearchParams();
  if (stateId) params.set('stateId', stateId);
  if (search)  params.set('search',  search);
  const qs = params.toString();
  return apiFetch(`/api/masters/cities${qs ? `?${qs}` : ''}`);
};

// ── Branches ───────────────────────────────────────────────────────────────────
export const getMasterBranches = ()     => apiFetch('/api/masters/branches');
export const createBranch      = (body) => apiFetch('/api/masters/branches', { method: 'POST', body: JSON.stringify(body) });

// ── Categories ─────────────────────────────────────────────────────────────────
export const getCategories  = ()     => apiFetch('/api/masters/categories');
export const createCategory = (body) => apiFetch('/api/masters/categories', { method: 'POST', body: JSON.stringify(body) });

// ── Units ──────────────────────────────────────────────────────────────────────
export const getUnits  = ()     => apiFetch('/api/masters/units');
export const createUnit = (body) => apiFetch('/api/masters/units', { method: 'POST', body: JSON.stringify(body) });

// ── Suppliers ──────────────────────────────────────────────────────────────────
export const getSuppliers  = ()     => apiFetch('/api/masters/suppliers');
export const createSupplier = (body) => apiFetch('/api/masters/suppliers', { method: 'POST', body: JSON.stringify(body) });

// ── Customers ──────────────────────────────────────────────────────────────────
export const getCustomers  = ()     => apiFetch('/api/masters/customers');
export const createCustomer = (body) => apiFetch('/api/masters/customers', { method: 'POST', body: JSON.stringify(body) });

// ── Products ───────────────────────────────────────────────────────────────────
export const getProducts  = ()     => apiFetch('/api/masters/products');
export const createProduct = (body) => apiFetch('/api/masters/products', { method: 'POST', body: JSON.stringify(body) });

// ── Warehouses ─────────────────────────────────────────────────────────────────
export const getWarehouses   = ()     => apiFetch('/api/masters/warehouses');
export const createWarehouse = (body) => apiFetch('/api/masters/warehouses', { method: 'POST', body: JSON.stringify(body) });
export const deleteWarehouse = (id)   => apiFetch(`/api/masters/warehouses/${id}`, { method: 'DELETE' });

// ── Payment Methods ────────────────────────────────────────────────────────────
export const getPaymentMethods   = ()     => apiFetch('/api/masters/payment-methods');
export const createPaymentMethod = (body) => apiFetch('/api/masters/payment-methods', { method: 'POST', body: JSON.stringify(body) });
