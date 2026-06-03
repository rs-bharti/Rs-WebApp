const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const {
  getCountries,  createCountry,  updateCountry,  deleteCountry,
  getStates,     createState,    updateState,    deleteState,
  getCities,     createCity,     updateCity,     deleteCity,
  getAreas,      createArea,     updateArea,     deleteArea,
  getBranches,   createBranch,   updateBranch,   deleteBranch,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,      createUnit,     updateUnit,     deleteUnit,
  getSuppliers,  createSupplier, updateSupplier, deleteSupplier,
  getCustomers,  createCustomer, updateCustomer, deleteCustomer,
  getProducts,   createProduct,  updateProduct,  deleteProduct,
  getPaymentMethods, createPaymentMethod,
} = require('../controllers/masterController');

const router = express.Router();

// All master endpoints require a logged-in user; writes require admin
router.use(authenticate);

router.get('/countries',       getCountries);
router.post('/countries',      requireAdmin, createCountry);
router.put('/countries/:id',   requireAdmin, updateCountry);
router.delete('/countries/:id', requireAdmin, deleteCountry);

router.get('/states',          getStates);
router.post('/states',         requireAdmin, createState);
router.put('/states/:id',      requireAdmin, updateState);
router.delete('/states/:id',   requireAdmin, deleteState);

router.get('/cities',          getCities);
router.post('/cities',         requireAdmin, createCity);
router.put('/cities/:id',      requireAdmin, updateCity);
router.delete('/cities/:id',   requireAdmin, deleteCity);

router.get('/areas',           getAreas);
router.post('/areas',          requireAdmin, createArea);
router.put('/areas/:id',       requireAdmin, updateArea);
router.delete('/areas/:id',    requireAdmin, deleteArea);

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
router.post('/payment-methods', requireAdmin, createPaymentMethod);

module.exports = router;
