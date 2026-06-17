const express = require('express');
const { authenticate, requireAdmin, requirePermission } = require('../middleware/auth');

const { getCountries, getStates, getCities, createCountry, updateCountry, deleteCountry, createState, updateState, deleteState, createCity, updateCity, deleteCity } = require('../controllers/masters/locationController');
const { getBranches, createBranch, updateBranch, deleteBranch, getBranchMasters, createBranchMaster, updateBranchMaster, deleteBranchMaster, forceDeleteBranch } = require('../controllers/masters/branchController');
const { getCategories, createCategory, updateCategory, deleteCategory, forceDeleteCategory, getUnits, createUnit, updateUnit, deleteUnit, forceDeleteUnit } = require('../controllers/masters/categoryUnitController');
const { getProducts, createProduct, updateProduct, deleteProduct, forceDeleteProduct } = require('../controllers/masters/productController');
const { getSuppliers, getSupplierTransactions, createSupplierTransaction, createSupplier, updateSupplier, deleteSupplier, forceDeleteSupplier } = require('../controllers/masters/supplierController');
const { getCustomers, getCustomerTransactions, createCustomerTransaction, createCustomer, updateCustomer, deleteCustomer, forceDeleteCustomer } = require('../controllers/masters/customerController');
const { getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, forceDeletePaymentMethod } = require('../controllers/masters/paymentMethodController');
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/masters/expenseController');
const { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse, forceDeleteWarehouse } = require('../controllers/masters/warehouseController');
const { updateContact, deleteContact } = require('../controllers/masters/contactController');
const { getDashboardBalance, updateDashboardBalance } = require('../controllers/masters/dashboardController');

const router = express.Router();
router.use(authenticate);

// Country / State / City — read-only (data seeded from package)
router.get('/countries', getCountries);
router.get('/states',    getStates);
router.get('/cities',    getCities);

router.get('/branches',        getBranches);
router.post('/branches',       requireAdmin, createBranch);
router.put('/branches/:id',    requireAdmin, updateBranch);
router.delete('/branches/:id/force', requireAdmin, forceDeleteBranch);
router.delete('/branches/:id',       requireAdmin, deleteBranch);

router.get('/branch-master',        getBranchMasters);
router.post('/branch-master',       requireAdmin, createBranchMaster);
router.put('/branch-master/:id',    requireAdmin, updateBranchMaster);
router.delete('/branch-master/:id', requireAdmin, deleteBranchMaster);

router.get('/categories',        getCategories);
router.post('/categories',       requirePermission('masters', 'Category'), createCategory);
router.put('/categories/:id',    requirePermission('masters', 'Category'), updateCategory);
router.delete('/categories/:id/force', requirePermission('masters', 'Category'), forceDeleteCategory);
router.delete('/categories/:id',       requirePermission('masters', 'Category'), deleteCategory);

router.get('/units',           getUnits);
router.post('/units',          requirePermission('masters', 'Unit'), createUnit);
router.put('/units/:id',       requirePermission('masters', 'Unit'), updateUnit);
router.delete('/units/:id/force', requirePermission('masters', 'Unit'), forceDeleteUnit);
router.delete('/units/:id',       requirePermission('masters', 'Unit'), deleteUnit);

router.get('/suppliers',                        getSuppliers);
router.post('/suppliers',                       requirePermission('masters', 'Supplier'), createSupplier);
router.put('/suppliers/:id',                    requirePermission('masters', 'Supplier'), updateSupplier);
router.delete('/suppliers/:id/force',           requirePermission('masters', 'Supplier'), forceDeleteSupplier);
router.delete('/suppliers/:id',                 requirePermission('masters', 'Supplier'), deleteSupplier);
router.get('/suppliers/:id/transactions',       getSupplierTransactions);
router.post('/suppliers/:id/transactions',      requirePermission('masters', 'Supplier'), createSupplierTransaction);

router.get('/customers',                        getCustomers);
router.post('/customers',                       requirePermission('masters', 'Customer'), createCustomer);
router.put('/customers/:id',                    requirePermission('masters', 'Customer'), updateCustomer);
router.delete('/customers/:id/force',           requirePermission('masters', 'Customer'), forceDeleteCustomer);
router.delete('/customers/:id',                 requirePermission('masters', 'Customer'), deleteCustomer);
router.get('/customers/:id/transactions',       getCustomerTransactions);
router.post('/customers/:id/transactions',      requirePermission('masters', 'Customer'), createCustomerTransaction);

router.get('/products',         getProducts);
router.post('/products',        requirePermission('masters', 'Product'), createProduct);
router.put('/products/:id',     requirePermission('masters', 'Product'), updateProduct);
router.delete('/products/:id/force', requirePermission('masters', 'Product'), forceDeleteProduct);
router.delete('/products/:id',       requirePermission('masters', 'Product'), deleteProduct);

router.get('/payment-methods',        getPaymentMethods);
router.post('/payment-methods',       requirePermission('masters', 'Payment Method'), createPaymentMethod);
router.put('/payment-methods/:id',    requirePermission('masters', 'Payment Method'), updatePaymentMethod);
router.delete('/payment-methods/:id/force', requirePermission('masters', 'Payment Method'), forceDeletePaymentMethod);
router.delete('/payment-methods/:id',       requirePermission('masters', 'Payment Method'), deletePaymentMethod);

router.get('/expenses',        getExpenses);
router.post('/expenses',       requirePermission('masters', 'Expense'), createExpense);
router.put('/expenses/:id',    requirePermission('masters', 'Expense'), updateExpense);
router.delete('/expenses/:id', requirePermission('masters', 'Expense'), deleteExpense);

router.get('/warehouses',        getWarehouses);
router.post('/warehouses',       requirePermission('masters', 'Warehouse'), createWarehouse);
router.put('/warehouses/:id',    requirePermission('masters', 'Warehouse'), updateWarehouse);
router.delete('/warehouses/:id/force', requirePermission('masters', 'Warehouse'), forceDeleteWarehouse);
router.delete('/warehouses/:id',       requirePermission('masters', 'Warehouse'), deleteWarehouse);

router.put('/contacts/:id',    updateContact);
router.delete('/contacts/:id', deleteContact);

router.get('/dashboard/balance',  getDashboardBalance);
router.put('/dashboard/balance',  requireAdmin, updateDashboardBalance);

module.exports = router;
