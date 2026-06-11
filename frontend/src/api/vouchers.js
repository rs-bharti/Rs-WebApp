const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const authHeaders = () => {
  const activeBranch = JSON.parse(sessionStorage.getItem('activeBranch') || 'null');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${sessionStorage.getItem('token')}`,
    ...(activeBranch?.id ? { 'X-Branch-Id': String(activeBranch.id) } : {}),
  };
};

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(), ...options });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
};

// ── Contra Voucher ─────────────────────────────────────────────────────────────
export const getContraVoucherNextNo = ()          => apiFetch('/api/vouchers/contra/next-number');
export const getContras             = ()          => apiFetch('/api/vouchers/contra');
export const saveContraVoucher      = (body)      => apiFetch('/api/vouchers/contra', { method: 'POST',   body: JSON.stringify(body) });
export const updateContraVoucher    = (id, body)  => apiFetch(`/api/vouchers/contra/${id}`,  { method: 'PUT',    body: JSON.stringify(body) });
export const deleteContraVoucher    = (id)        => apiFetch(`/api/vouchers/contra/${id}`,  { method: 'DELETE' });

// ── Receipt Voucher ────────────────────────────────────────────────────────────
export const getReceiptVoucherNextNo = ()         => apiFetch('/api/vouchers/receipt/next-number');
export const getReceipts             = ()         => apiFetch('/api/vouchers/receipt');
export const saveReceiptVoucher      = (body)     => apiFetch('/api/vouchers/receipt', { method: 'POST',   body: JSON.stringify(body) });
export const updateReceiptVoucher    = (id, body) => apiFetch(`/api/vouchers/receipt/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deleteReceiptVoucher    = (id)       => apiFetch(`/api/vouchers/receipt/${id}`, { method: 'DELETE' });

// ── Payment Voucher ────────────────────────────────────────────────────────────
export const getPaymentVoucherNextNo = ()         => apiFetch('/api/vouchers/payment/next-number');
export const getPayments             = ()         => apiFetch('/api/vouchers/payment');
export const savePaymentVoucher      = (body)     => apiFetch('/api/vouchers/payment', { method: 'POST',   body: JSON.stringify(body) });
export const updatePaymentVoucher    = (id, body) => apiFetch(`/api/vouchers/payment/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deletePaymentVoucher    = (id)       => apiFetch(`/api/vouchers/payment/${id}`, { method: 'DELETE' });

// ── Sales Voucher ──────────────────────────────────────────────────────────────
export const getSalesVoucherNextNo = ()           => apiFetch('/api/vouchers/sales/next-number');
export const getSales              = ()           => apiFetch('/api/vouchers/sales');
export const saveSalesVoucher      = (body)       => apiFetch('/api/vouchers/sales', { method: 'POST',   body: JSON.stringify(body) });
export const updateSalesVoucher    = (id, body)   => apiFetch(`/api/vouchers/sales/${id}`,   { method: 'PUT',    body: JSON.stringify(body) });
export const deleteSalesVoucher    = (id)         => apiFetch(`/api/vouchers/sales/${id}`,   { method: 'DELETE' });

// ── Purchase Voucher ───────────────────────────────────────────────────────────
export const getPurchaseVoucherNextNo = ()         => apiFetch('/api/vouchers/purchase/next-number');
export const getPurchases             = ()         => apiFetch('/api/vouchers/purchase');
export const savePurchaseVoucher      = (body)     => apiFetch('/api/vouchers/purchase', { method: 'POST',   body: JSON.stringify(body) });
export const updatePurchaseVoucher    = (id, body) => apiFetch(`/api/vouchers/purchase/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deletePurchaseVoucher    = (id)       => apiFetch(`/api/vouchers/purchase/${id}`, { method: 'DELETE' });

// ── Sales Return Voucher ───────────────────────────────────────────────────────
export const getSalesReturnNextNo     = ()         => apiFetch('/api/vouchers/sales-return/next-number');
export const getSalesReturns          = ()         => apiFetch('/api/vouchers/sales-return');
export const saveSalesReturnVoucher   = (body)     => apiFetch('/api/vouchers/sales-return', { method: 'POST',   body: JSON.stringify(body) });
export const updateSalesReturnVoucher = (id, body) => apiFetch(`/api/vouchers/sales-return/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deleteSalesReturnVoucher = (id)       => apiFetch(`/api/vouchers/sales-return/${id}`, { method: 'DELETE' });

// ── Purchase Return Voucher ────────────────────────────────────────────────────
export const getPurchaseReturnNextNo     = ()         => apiFetch('/api/vouchers/purchase-return/next-number');
export const getPurchaseReturns          = ()         => apiFetch('/api/vouchers/purchase-return');
export const savePurchaseReturnVoucher   = (body)     => apiFetch('/api/vouchers/purchase-return', { method: 'POST',   body: JSON.stringify(body) });
export const updatePurchaseReturnVoucher = (id, body) => apiFetch(`/api/vouchers/purchase-return/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deletePurchaseReturnVoucher = (id)       => apiFetch(`/api/vouchers/purchase-return/${id}`, { method: 'DELETE' });

// ── Stock Data Voucher ─────────────────────────────────────────────────────────
export const getStockDataVoucherNextNo = ()         => apiFetch('/api/vouchers/data/next-number');
export const getStockData              = ()         => apiFetch('/api/vouchers/data');
export const saveStockDataVoucher      = (body)     => apiFetch('/api/vouchers/data', { method: 'POST',   body: JSON.stringify(body) });
export const updateStockDataVoucher    = (id, body) => apiFetch(`/api/vouchers/data/${id}`,  { method: 'PUT',    body: JSON.stringify(body) });
export const deleteStockDataVoucher    = (id)       => apiFetch(`/api/vouchers/data/${id}`,  { method: 'DELETE' });

// ── Stock Transfer Voucher ─────────────────────────────────────────────────────
export const getStockTransferVoucherNextNo = ()         => apiFetch('/api/vouchers/transfer/next-number');
export const getStockTransfers             = ()         => apiFetch('/api/vouchers/transfer');
export const saveStockTransferVoucher      = (body)     => apiFetch('/api/vouchers/transfer', { method: 'POST',   body: JSON.stringify(body) });
export const updateStockTransferVoucher    = (id, body) => apiFetch(`/api/vouchers/transfer/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deleteStockTransferVoucher    = (id)       => apiFetch(`/api/vouchers/transfer/${id}`, { method: 'DELETE' });

// ── Stock Quantity (from Stock Data entries) ───────────────────────────────────
export const getStockQty = (productId, warehouseId) =>
  apiFetch(`/api/vouchers/stock-qty?productId=${productId}&warehouseId=${warehouseId}`);

export const getStockQtyByWarehouse = (warehouseId) =>
  apiFetch(`/api/vouchers/stock-qty-warehouse?warehouseId=${warehouseId}`);

// ── Expense Voucher ────────────────────────────────────────────────────────────
export const getExpenseVoucherNextNo = ()         => apiFetch('/api/vouchers/expense/next-number');
export const getExpenseVouchers      = ()         => apiFetch('/api/vouchers/expense');
export const saveExpenseVoucher      = (body)     => apiFetch('/api/vouchers/expense', { method: 'POST',   body: JSON.stringify(body) });
export const updateExpenseVoucher    = (id, body) => apiFetch(`/api/vouchers/expense/${id}`, { method: 'PUT',    body: JSON.stringify(body) });
export const deleteExpenseVoucher    = (id)       => apiFetch(`/api/vouchers/expense/${id}`, { method: 'DELETE' });

// ── Dashboard ──────────────────────────────────────────────────────────────────
export const getDashboard = () => apiFetch('/api/vouchers/dashboard');
