const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

export const getPaymentMethods = () => apiFetch('/api/vouchers/payment-methods');
export const getDashboard       = () => apiFetch('/api/vouchers/dashboard');

// Contra
export const getContraNextNo = ()     => apiFetch('/api/vouchers/contra/next-number');
export const getContras      = ()     => apiFetch('/api/vouchers/contra');
export const createContra    = (body) => apiFetch('/api/vouchers/contra', { method: 'POST', body: JSON.stringify(body) });

// Receipt
export const getReceiptNextNo = ()     => apiFetch('/api/vouchers/receipt/next-number');
export const getReceipts      = ()     => apiFetch('/api/vouchers/receipt');
export const createReceipt    = (body) => apiFetch('/api/vouchers/receipt', { method: 'POST', body: JSON.stringify(body) });

// Payment
export const getPaymentNextNo = ()     => apiFetch('/api/vouchers/payment/next-number');
export const getPayments      = ()     => apiFetch('/api/vouchers/payment');
export const createPayment    = (body) => apiFetch('/api/vouchers/payment', { method: 'POST', body: JSON.stringify(body) });

// Purchase
export const getPurchaseNextNo = ()     => apiFetch('/api/vouchers/purchase/next-number');
export const getPurchases      = ()     => apiFetch('/api/vouchers/purchase');
export const createPurchase    = (body) => apiFetch('/api/vouchers/purchase', { method: 'POST', body: JSON.stringify(body) });

// Sales
export const getSalesNextNo = ()     => apiFetch('/api/vouchers/sales/next-number');
export const getSales       = ()     => apiFetch('/api/vouchers/sales');
export const createSales    = (body) => apiFetch('/api/vouchers/sales', { method: 'POST', body: JSON.stringify(body) });

// Purchase Return
export const getPurchaseReturnNextNo = ()     => apiFetch('/api/vouchers/purchase-return/next-number');
export const getPurchaseReturns      = ()     => apiFetch('/api/vouchers/purchase-return');
export const createPurchaseReturn    = (body) => apiFetch('/api/vouchers/purchase-return', { method: 'POST', body: JSON.stringify(body) });

// Sales Return
export const getSalesReturnNextNo = ()     => apiFetch('/api/vouchers/sales-return/next-number');
export const getSalesReturns      = ()     => apiFetch('/api/vouchers/sales-return');
export const createSalesReturn    = (body) => apiFetch('/api/vouchers/sales-return', { method: 'POST', body: JSON.stringify(body) });
