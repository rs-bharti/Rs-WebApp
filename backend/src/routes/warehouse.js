const express = require('express');
const prisma   = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

router.get('/', async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const warehouses = await prisma.warehouseMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, address, area, cityId } = req.body;
  if (!name) return res.status(400).json({ message: 'Warehouse name is required' });
  try {
    const branchId = getBranchId(req);
    const warehouse = await prisma.warehouseMaster.create({
      data: {
        name,
        address: address || null,
        area:    area    || null,
        cityId:  cityId  ? parseInt(cityId) : undefined,
        branchId: branchId || null,
      },
    });
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, address, area, cityId } = req.body;
  try {
    const warehouse = await prisma.warehouseMaster.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        address: address || null,
        area:    area    || null,
        cityId:  cityId  ? parseInt(cityId) : undefined,
      },
    });
    res.json(warehouse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.warehouseMaster.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
