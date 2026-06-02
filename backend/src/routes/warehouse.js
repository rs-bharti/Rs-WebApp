const express = require('express');
const prisma   = require('../utils/prisma');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  try {
    const warehouses = await prisma.warehouseMaster.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(warehouses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, address, cityId, areaId } = req.body;
  if (!name) return res.status(400).json({ message: 'Warehouse name is required' });
  try {
    const warehouse = await prisma.warehouseMaster.create({
      data: {
        name,
        address,
        cityId: cityId ? parseInt(cityId) : undefined,
        areaId: areaId ? parseInt(areaId) : undefined,
      },
    });
    res.status(201).json(warehouse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { name, address, cityId, areaId } = req.body;
  try {
    const warehouse = await prisma.warehouseMaster.update({
      where: { id: parseInt(req.params.id) },
      data: { name, address, cityId: cityId ? parseInt(cityId) : undefined, areaId: areaId ? parseInt(areaId) : undefined },
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
