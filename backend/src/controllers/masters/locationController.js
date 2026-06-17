const prisma = require('../../utils/prisma');
const { prismaErr } = require('./masterHelpers');

// ── Countries ──────────────────────────────────────────────────────────────────
const getCountries = async (_req, res) => {
  try {
    const rows = await prisma.countryMaster.findMany({
      select: { id: true, name: true, phoneCode: true, currency: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createCountry = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const row = await prisma.countryMaster.create({
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'Country already exists' : 'Server error' });
  }
};

const updateCountry = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.countryMaster.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteCountry = async (req, res) => {
  try {
    await prisma.countryMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

// ── States ─────────────────────────────────────────────────────────────────────
const getStates = async (req, res) => {
  try {
    const where = req.query.countryId ? { countryId: Number(req.query.countryId) } : {};
    const rows = await prisma.stateMaster.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, country: { select: { id: true, name: true } } },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createState = async (req, res) => {
  try {
    const { name, countryId } = req.body;
    if (!name || !countryId) return res.status(400).json({ message: 'name and countryId are required' });
    const row = await prisma.stateMaster.create({
      data: { name: name.trim(), countryId: Number(countryId) },
      select: { id: true, name: true, country: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'State already exists in this country' : 'Server error' });
  }
};

const updateState = async (req, res) => {
  try {
    const { name, countryId } = req.body;
    const data = {};
    if (name) data.name = name.trim();
    if (countryId) data.countryId = Number(countryId);
    const row = await prisma.stateMaster.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, country: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteState = async (req, res) => {
  try {
    await prisma.stateMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

// ── Cities ─────────────────────────────────────────────────────────────────────
const getCities = async (req, res) => {
  try {
    const { stateId, search } = req.query;
    const where = {};
    if (stateId) where.stateId = Number(stateId);
    if (search)  where.name = { contains: search, mode: 'insensitive' };
    const rows = await prisma.cityMaster.findMany({
      where,
      orderBy: { name: 'asc' },
      take: 300,
      select: {
        id: true, name: true,
        state: {
          select: {
            id: true, name: true,
            country: { select: { id: true, name: true, phoneCode: true, currency: true } },
          },
        },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createCity = async (req, res) => {
  try {
    const { name, stateId } = req.body;
    if (!name || !stateId) return res.status(400).json({ message: 'name and stateId are required' });
    const row = await prisma.cityMaster.create({
      data: { name: name.trim(), stateId: Number(stateId) },
      select: { id: true, name: true, state: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'City already exists in this state' : 'Server error' });
  }
};

const updateCity = async (req, res) => {
  try {
    const { name, stateId } = req.body;
    const data = {};
    if (name) data.name = name.trim();
    if (stateId) data.stateId = Number(stateId);
    const row = await prisma.cityMaster.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, state: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteCity = async (req, res) => {
  try {
    await prisma.cityMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = {
  getCountries, createCountry, updateCountry, deleteCountry,
  getStates,    createState,   updateState,   deleteState,
  getCities,    createCity,    updateCity,    deleteCity,
};
