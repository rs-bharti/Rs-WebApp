const express = require('express');
const { authenticate } = require('../middleware/auth');

const { getContraNextNo, getContras, createContra, updateContra, deleteContra } = require('../controllers/vouchers/contraController');
const { getReceiptNextNo, getReceipts, createReceipt, updateReceipt, deleteReceipt } = require('../controllers/vouchers/receiptController');
const { getPaymentNextNo, getPayments, createPayment, updatePayment, deletePayment } = require('../controllers/vouchers/paymentController');
const { getPurchaseNextNo, getPurchases, createPurchase, updatePurchase, deletePurchase } = require('../controllers/vouchers/purchaseController');
const { getSalesNextNo, getSales, createSales, updateSales, deleteSales } = require('../controllers/vouchers/salesController');
const { getSalesReturnNextNo, getSalesReturns, createSalesReturn, updateSalesReturn, deleteSalesReturn } = require('../controllers/vouchers/salesReturnController');
const { getPurchaseReturnNextNo, getPurchaseReturns, createPurchaseReturn, updatePurchaseReturn, deletePurchaseReturn } = require('../controllers/vouchers/purchaseReturnController');
const { getStockDataNextNo, getStockData, createStockData, updateStockData, deleteStockData, getStockTransferNextNo, getStockTransfers, createStockTransfer, updateStockTransfer, deleteStockTransfer, getStockQty, getStockQtyByWarehouse } = require('../controllers/vouchers/stockController');
const { getDashboard, getDayBook } = require('../controllers/ledgers/dayBookController');
const { getProductLedger } = require('../controllers/ledgers/productLedgerController');
const { getSupplierLedger } = require('../controllers/ledgers/supplierLedgerController');
const { getCustomerLedger } = require('../controllers/ledgers/customerLedgerController');
const { getMoneyLedger } = require('../controllers/ledgers/moneyLedgerController');
const { getReceivablesEntries, markReceivablePaid, getReceivablesLedger } = require('../controllers/ledgers/receivablesController');

const router = express.Router();
router.use(authenticate);

router.get('/dashboard',                getDashboard);
router.get('/stock-qty',               getStockQty);
router.get('/stock-qty-warehouse',     getStockQtyByWarehouse);
router.get('/product-ledger',          getProductLedger);
router.get('/supplier-ledger/:supplierId', getSupplierLedger);
router.get('/customer-ledger/:customerId', getCustomerLedger);
router.get('/money-ledger',               getMoneyLedger);
router.get('/receivables-ledger',         getReceivablesLedger);
router.get('/receivables-entries',        getReceivablesEntries);
router.patch('/receivables-entries/:type/:id/mark-paid', markReceivablePaid);
router.get('/day-book',                   getDayBook);

router.get('/contra/next-number',       getContraNextNo);
router.get('/contra',                   getContras);
router.post('/contra',                  createContra);
router.put('/contra/:id',               updateContra);
router.delete('/contra/:id',            deleteContra);

router.get('/receipt/next-number',      getReceiptNextNo);
router.get('/receipt',                  getReceipts);
router.post('/receipt',                 createReceipt);
router.put('/receipt/:id',              updateReceipt);
router.delete('/receipt/:id',           deleteReceipt);

router.get('/payment/next-number',      getPaymentNextNo);
router.get('/payment',                  getPayments);
router.post('/payment',                 createPayment);
router.put('/payment/:id',              updatePayment);
router.delete('/payment/:id',           deletePayment);

router.get('/purchase/next-number',     getPurchaseNextNo);
router.get('/purchase',                 getPurchases);
router.post('/purchase',                createPurchase);
router.put('/purchase/:id',             updatePurchase);
router.delete('/purchase/:id',          deletePurchase);

router.get('/sales/next-number',        getSalesNextNo);
router.get('/sales',                    getSales);
router.post('/sales',                   createSales);
router.put('/sales/:id',                updateSales);
router.delete('/sales/:id',             deleteSales);

router.get('/purchase-return/next-number', getPurchaseReturnNextNo);
router.get('/purchase-return',          getPurchaseReturns);
router.post('/purchase-return',         createPurchaseReturn);
router.put('/purchase-return/:id',      updatePurchaseReturn);
router.delete('/purchase-return/:id',   deletePurchaseReturn);

router.get('/sales-return/next-number', getSalesReturnNextNo);
router.get('/sales-return',             getSalesReturns);
router.post('/sales-return',            createSalesReturn);
router.put('/sales-return/:id',         updateSalesReturn);
router.delete('/sales-return/:id',      deleteSalesReturn);

router.get('/data/next-number',         getStockDataNextNo);
router.get('/data',                     getStockData);
router.post('/data',                    createStockData);
router.put('/data/:id',                 updateStockData);
router.delete('/data/:id',              deleteStockData);

router.get('/transfer/next-number',     getStockTransferNextNo);
router.get('/transfer',                 getStockTransfers);
router.post('/transfer',                createStockTransfer);
router.put('/transfer/:id',             updateStockTransfer);
router.delete('/transfer/:id',          deleteStockTransfer);

module.exports = router;
