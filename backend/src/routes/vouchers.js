const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getContraNextNo,        getContras,        createContra,
  getReceiptNextNo,       getReceipts,       createReceipt,
  getPaymentNextNo,       getPayments,       createPayment,
  getPurchaseNextNo,      getPurchases,      createPurchase,
  getSalesNextNo,         getSales,          createSales,
  getPurchaseReturnNextNo, getPurchaseReturns, createPurchaseReturn,
  getSalesReturnNextNo,   getSalesReturns,   createSalesReturn,
  getDashboard,
  getStockDataNextNo,    getStockData,    createStockData,
  getStockTransferNextNo, getStockTransfers, createStockTransfer,
  getStockQty,
  getExpenseNextNo, getExpenseVouchers, createExpenseVoucher,
} = require('../controllers/voucherController');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard',                getDashboard);
router.get('/stock-qty',               getStockQty);

router.get('/contra/next-number',       getContraNextNo);
router.get('/contra',                   getContras);
router.post('/contra',                  createContra);

router.get('/receipt/next-number',      getReceiptNextNo);
router.get('/receipt',                  getReceipts);
router.post('/receipt',                 createReceipt);

router.get('/payment/next-number',      getPaymentNextNo);
router.get('/payment',                  getPayments);
router.post('/payment',                 createPayment);

router.get('/purchase/next-number',     getPurchaseNextNo);
router.get('/purchase',                 getPurchases);
router.post('/purchase',                createPurchase);

router.get('/sales/next-number',        getSalesNextNo);
router.get('/sales',                    getSales);
router.post('/sales',                   createSales);

router.get('/purchase-return/next-number', getPurchaseReturnNextNo);
router.get('/purchase-return',          getPurchaseReturns);
router.post('/purchase-return',         createPurchaseReturn);

router.get('/sales-return/next-number', getSalesReturnNextNo);
router.get('/sales-return',             getSalesReturns);
router.post('/sales-return',            createSalesReturn);

router.get('/data/next-number',         getStockDataNextNo);
router.get('/data',                     getStockData);
router.post('/data',                    createStockData);

router.get('/transfer/next-number',     getStockTransferNextNo);
router.get('/transfer',                 getStockTransfers);
router.post('/transfer',                createStockTransfer);

router.get('/expense/next-number',  getExpenseNextNo);
router.get('/expense',              getExpenseVouchers);
router.post('/expense',             createExpenseVoucher);

module.exports = router;
