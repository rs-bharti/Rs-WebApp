const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getCountries,
  getStates,
  getCities,
  getBranches,   createBranch,   updateBranch,   deleteBranch,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,      createUnit,     updateUnit,     deleteUnit,
  getSuppliers,  createSupplier, updateSupplier, deleteSupplier,
  getCustomers,  createCustomer, updateCustomer, deleteCustomer,
  getProducts,   createProduct,  updateProduct,  deleteProduct,
  getPaymentMethods,
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
router.post('/categories',       requireAdmin, createCategory);
router.put('/categories/:id',    requireAdmin, updateCategory);
router.delete('/categories/:id', requireAdmin, deleteCategory);

router.get('/units',           getUnits);
router.post('/units',          requireAdmin, createUnit);
router.put('/units/:id',       requireAdmin, updateUnit);
router.delete('/units/:id',    requireAdmin, deleteUnit);

router.get('/suppliers',        getSuppliers);
router.post('/suppliers',       requireAdmin, createSupplier);
router.put('/suppliers/:id',    requireAdmin, updateSupplier);
router.delete('/suppliers/:id', requireAdmin, deleteSupplier);

router.get('/customers',        getCustomers);
router.post('/customers',       requireAdmin, createCustomer);
router.put('/customers/:id',    requireAdmin, updateCustomer);
router.delete('/customers/:id', requireAdmin, deleteCustomer);

router.get('/products',         getProducts);
router.post('/products',        requireAdmin, createProduct);
router.put('/products/:id',     requireAdmin, updateProduct);
router.delete('/products/:id',  requireAdmin, deleteProduct);

router.get('/payment-methods',  getPaymentMethods);

module.exports = router;
