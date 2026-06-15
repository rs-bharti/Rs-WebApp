const express = require('express');
const { getAll, getOne, create, update, remove, forceDelete, getBranches, getRoles, toggleActive } = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// These two are needed by the Registration form — still protected but available to all logged-in users
router.get('/branches', authenticate, getBranches);
router.get('/roles', authenticate, requireAdmin, getRoles);

// User CRUD — admin only
router.use(authenticate, requireAdmin);
router.get('/', getAll);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/toggle-active', toggleActive);
router.delete('/:id/force', forceDelete);
router.delete('/:id', remove);

module.exports = router;
