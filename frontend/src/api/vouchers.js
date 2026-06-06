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

// ── Sales Voucher ──────────────────────────────────────────────────────────────
export const getSalesVoucherNextNo = ()     => apiFetch('/api/vouchers/sales/next-number');
export const saveSalesVoucher      = (body) => apiFetch('/api/vouchers/sales', { method: 'POST', body: JSON.stringify(body) });

// ── Purchase Voucher ───────────────────────────────────────────────────────────
export const getPurchaseVoucherNextNo = ()     => apiFetch('/api/vouchers/purchase/next-number');
export const savePurchaseVoucher      = (body) => apiFetch('/api/vouchers/purchase', { method: 'POST', body: JSON.stringify(body) });

// ── Sales Return Voucher ───────────────────────────────────────────────────────
export const getSalesReturnNextNo     = ()     => apiFetch('/api/vouchers/sales-return/next-number');
export const saveSalesReturnVoucher   = (body) => apiFetch('/api/vouchers/sales-return', { method: 'POST', body: JSON.stringify(body) });

// ── Purchase Return Voucher ────────────────────────────────────────────────────
export const getPurchaseReturnNextNo   = ()     => apiFetch('/api/vouchers/purchase-return/next-number');
export const savePurchaseReturnVoucher = (body) => apiFetch('/api/vouchers/purchase-return', { method: 'POST', body: JSON.stringify(body) });

// ── Receipt Voucher ────────────────────────────────────────────────────────────
export const getReceiptVoucherNextNo = ()     => apiFetch('/api/vouchers/receipt/next-number');
export const saveReceiptVoucher      = (body) => apiFetch('/api/vouchers/receipt', { method: 'POST', body: JSON.stringify(body) });

// ── Payment Voucher ────────────────────────────────────────────────────────────
export const getPaymentVoucherNextNo = ()     => apiFetch('/api/vouchers/payment/next-number');
export const savePaymentVoucher      = (body) => apiFetch('/api/vouchers/payment', { method: 'POST', body: JSON.stringify(body) });

// ── Contra Voucher ─────────────────────────────────────────────────────────────
export const getContraVoucherNextNo = ()     => apiFetch('/api/vouchers/contra/next-number');
export const saveContraVoucher      = (body) => apiFetch('/api/vouchers/contra', { method: 'POST', body: JSON.stringify(body) });

// ── Stock Data Voucher ─────────────────────────────────────────────────────────
export const getStockDataVoucherNextNo = ()     => apiFetch('/api/vouchers/data/next-number');
export const saveStockDataVoucher      = (body) => apiFetch('/api/vouchers/data', { method: 'POST', body: JSON.stringify(body) });

// ── Stock Transfer Voucher ─────────────────────────────────────────────────────
export const getStockTransferVoucherNextNo = ()     => apiFetch('/api/vouchers/transfer/next-number');
export const saveStockTransferVoucher      = (body) => apiFetch('/api/vouchers/transfer', { method: 'POST', body: JSON.stringify(body) });

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getDashboard = () => apiFetch('/api/vouchers/dashboard');
