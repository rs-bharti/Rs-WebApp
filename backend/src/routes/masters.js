const express = require('express');
const { authenticate, requireAdmin, requirePermission } = require('../middleware/auth');
const {
  getCountries,
  getStates,
  getCities,
  getBranches,   createBranch,   updateBranch,   deleteBranch,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,      createUnit,     updateUnit,     deleteUnit,
  getSuppliers,  createSupplier, updateSupplier, deleteSupplier,
  getSupplierTransactions, createSupplierTransaction,
  getCustomers,  createCustomer, updateCustomer, deleteCustomer,
  getCustomerTransactions, createCustomerTransaction,
  getProducts,   createProduct,  updateProduct,  deleteProduct,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
} = require('../controllers/masterController');

const router = express.Router();
router.use(authenticate);

// Country / State / City — read-only (data seeded from package)
router.get('/countries', getCountries);
router.get('/states',    getStates);
router.get('/cities',    getCities);

router.get('/branches',        getBranches);
router.post('/branches',       requireAdmin, createBranch);
router.put('/branches/:id',    requireAdmin, updateBranch);
router.delete('/branches/:id', requireAdmin, deleteBranch);

router.get('/categories',        getCategories);
router.post('/categories',       requirePermission('masters', 'Category'), createCategory);
router.put('/categories/:id',    requirePermission('masters', 'Category'), updateCategory);
router.delete('/categories/:id', requirePermission('masters', 'Category'), deleteCategory);

router.get('/units',           getUnits);
router.post('/units',          requirePermission('masters', 'Unit'), createUnit);
router.put('/units/:id',       requirePermission('masters', 'Unit'), updateUnit);
router.delete('/units/:id',    requirePermission('masters', 'Unit'), deleteUnit);

router.get('/suppliers',                        getSuppliers);
router.post('/suppliers',                       requirePermission('masters', 'Supplier'), createSupplier);
router.put('/suppliers/:id',                    requirePermission('masters', 'Supplier'), updateSupplier);
router.delete('/suppliers/:id',                 requirePermission('masters', 'Supplier'), deleteSupplier);
router.get('/suppliers/:id/transactions',       getSupplierTransactions);
router.post('/suppliers/:id/transactions',      requirePermission('masters', 'Supplier'), createSupplierTransaction);

router.get('/customers',                        getCustomers);
router.post('/customers',                       requirePermission('masters', 'Customer'), createCustomer);
router.put('/customers/:id',                    requirePermission('masters', 'Customer'), updateCustomer);
router.delete('/customers/:id',                 requirePermission('masters', 'Customer'), deleteCustomer);
router.get('/customers/:id/transactions',       getCustomerTransactions);
router.post('/customers/:id/transactions',      requirePermission('masters', 'Customer'), createCustomerTransaction);

router.get('/products',         getProducts);
router.post('/products',        requirePermission('masters', 'Product'), createProduct);
router.put('/products/:id',     requirePermission('masters', 'Product'), updateProduct);
router.delete('/products/:id',  requirePermission('masters', 'Product'), deleteProduct);

router.get('/payment-methods',        getPaymentMethods);
router.post('/payment-methods',       requirePermission('masters', 'Payment Method'), createPaymentMethod);
router.put('/payment-methods/:id',    requirePermission('masters', 'Payment Method'), updatePaymentMethod);
router.delete('/payment-methods/:id', requirePermission('masters', 'Payment Method'), deletePaymentMethod);

router.get('/warehouses',        getWarehouses);
router.post('/warehouses',       requirePermission('masters', 'Warehouse'), createWarehouse);
router.put('/warehouses/:id',    requirePermission('masters', 'Warehouse'), updateWarehouse);
router.delete('/warehouses/:id', requirePermission('masters', 'Warehouse'), deleteWarehouse);

module.exports = router;
