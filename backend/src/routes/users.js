const express = require('express');
const { getAll, getOne, create, update, remove, getBranches, getRoles } = require('../controllers/userController');
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
router.delete('/:id', remove);

module.exports = router;
