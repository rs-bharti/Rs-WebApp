const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
  getPaymentMethods,
  getContraNextNo,        getContras,        createContra,
  getReceiptNextNo,       getReceipts,       createReceipt,
  getPaymentNextNo,       getPayments,       createPayment,
  getPurchaseNextNo,      getPurchases,      createPurchase,
  getSalesNextNo,         getSales,          createSales,
  getPurchaseReturnNextNo, getPurchaseReturns, createPurchaseReturn,
  getSalesReturnNextNo,   getSalesReturns,   createSalesReturn,
  getDashboard,
} = require('../controllers/voucherController');

const router = express.Router();
router.use(authenticate);

router.get('/payment-methods',          getPaymentMethods);
router.get('/dashboard',                getDashboard);

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

module.exports = router;
