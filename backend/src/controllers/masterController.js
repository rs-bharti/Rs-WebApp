const prisma = require('../utils/prisma');

const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

// ── Countries ──────────────────────────────────────────────────────────────────
const getCountries = async (_req, res) => {
  try {
    const rows = await prisma.countryMaster.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteCountry = async (req, res) => {
  try {
    await prisma.countryMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteState = async (req, res) => {
  try {
    await prisma.stateMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Cities ─────────────────────────────────────────────────────────────────────
const getCities = async (req, res) => {
  try {
    const where = req.query.stateId ? { stateId: Number(req.query.stateId) } : {};
    const rows = await prisma.cityMaster.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, state: { select: { id: true, name: true } } },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteCity = async (req, res) => {
  try {
    await prisma.cityMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Areas ──────────────────────────────────────────────────────────────────────
const getAreas = async (req, res) => {
  try {
    const where = req.query.cityId ? { cityId: Number(req.query.cityId) } : {};
    const rows = await prisma.areaMaster.findMany({
      where,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, city: { select: { id: true, name: true } } },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createArea = async (req, res) => {
  try {
    const { name, cityId } = req.body;
    if (!name || !cityId) return res.status(400).json({ message: 'name and cityId are required' });
    const row = await prisma.areaMaster.create({
      data: { name: name.trim(), cityId: Number(cityId) },
      select: { id: true, name: true, city: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'Area already exists in this city' : 'Server error' });
  }
};

const updateArea = async (req, res) => {
  try {
    const { name, cityId } = req.body;
    const data = {};
    if (name) data.name = name.trim();
    if (cityId) data.cityId = Number(cityId);
    const row = await prisma.areaMaster.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, city: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteArea = async (req, res) => {
  try {
    await prisma.areaMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Branches ───────────────────────────────────────────────────────────────────
const getBranches = async (req, res) => {
  try {
    const rows = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, address: true,
        city:    { select: { id: true, name: true } },
        state:   { select: { id: true, name: true } },
        country: { select: { id: true, name: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createBranch = async (req, res) => {
  try {
    const { name, address, cityId, stateId, countryId, areaId } = req.body;
    if (!name || !cityId || !stateId || !countryId) {
      return res.status(400).json({ message: 'name, cityId, stateId, and countryId are required' });
    }
    const data = { name: name.trim(), cityId: Number(cityId), stateId: Number(stateId), countryId: Number(countryId) };
    if (address) data.address = address.trim();
    if (areaId)  data.areaId  = Number(areaId);
    const row = await prisma.branch.create({
      data,
      select: { id: true, name: true, city: { select: { id: true, name: true } }, state: { select: { id: true, name: true } }, country: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const updateBranch = async (req, res) => {
  try {
    const { name, address, cityId, stateId, countryId, areaId } = req.body;
    const data = {};
    if (name)                data.name      = name.trim();
    if (address !== undefined) data.address  = address;
    if (cityId)              data.cityId    = Number(cityId);
    if (stateId)             data.stateId   = Number(stateId);
    if (countryId)           data.countryId = Number(countryId);
    if (areaId !== undefined) data.areaId   = areaId ? Number(areaId) : null;
    const row = await prisma.branch.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, city: { select: { id: true, name: true } }, state: { select: { id: true, name: true } }, country: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteBranch = async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Categories ─────────────────────────────────────────────────────────────────
const getCategories = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.categoryMaster.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.categoryMaster.create({
      data: { name: name.trim(), branchId: branchId || null },
      select: { id: true, name: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'Category already exists' : 'Server error' });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.categoryMaster.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteCategory = async (req, res) => {
  try {
    await prisma.categoryMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Units ──────────────────────────────────────────────────────────────────────
const getUnits = async (_req, res) => {
  try {
    const rows = await prisma.unitMaster.findMany({
      select: { id: true, unitName: true, shortName: true },
      orderBy: { unitName: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createUnit = async (req, res) => {
  try {
    const { unitName, shortName } = req.body;
    if (!unitName) return res.status(400).json({ message: 'unitName is required' });
    const row = await prisma.unitMaster.create({
      data: { unitName: unitName.trim(), shortName: shortName?.trim() || null },
      select: { id: true, unitName: true, shortName: true },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const updateUnit = async (req, res) => {
  try {
    const { unitName, shortName } = req.body;
    const data = {};
    if (unitName) data.unitName = unitName.trim();
    if (shortName !== undefined) data.shortName = shortName?.trim() || null;
    const row = await prisma.unitMaster.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, unitName: true, shortName: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteUnit = async (req, res) => {
  try {
    await prisma.unitMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Suppliers ──────────────────────────────────────────────────────────────────
const getSuppliers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.supplier.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, phone: true, email: true, gstNo: true, address: true,
        city:    { select: { id: true, name: true } },
        state:   { select: { id: true, name: true } },
        country: { select: { id: true, name: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createSupplier = async (req, res) => {
  try {
    const { name, address, phone, email, gstNo, cityId, stateId, countryId, areaId } = req.body;
    if (!name || !cityId || !stateId || !countryId) {
      return res.status(400).json({ message: 'name, cityId, stateId, and countryId are required' });
    }
    const branchId = getBranchId(req);
    const data = { name: name.trim(), cityId: Number(cityId), stateId: Number(stateId), countryId: Number(countryId), branchId: branchId || null };
    if (address) data.address = address.trim();
    if (phone)   data.phone   = phone.trim();
    if (email)   data.email   = email.toLowerCase().trim();
    if (gstNo)   data.gstNo   = gstNo.trim();
    if (areaId)  data.areaId  = Number(areaId);
    const row = await prisma.supplier.create({
      data,
      select: { id: true, name: true, phone: true, email: true, city: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const updateSupplier = async (req, res) => {
  try {
    const { name, address, phone, email, gstNo, cityId, stateId, countryId, areaId } = req.body;
    const data = {};
    if (name)                 data.name      = name.trim();
    if (address !== undefined) data.address  = address;
    if (phone !== undefined)   data.phone    = phone;
    if (email !== undefined)   data.email    = email?.toLowerCase().trim();
    if (gstNo !== undefined)   data.gstNo    = gstNo;
    if (cityId)               data.cityId    = Number(cityId);
    if (stateId)              data.stateId   = Number(stateId);
    if (countryId)            data.countryId = Number(countryId);
    if (areaId !== undefined)  data.areaId   = areaId ? Number(areaId) : null;
    const row = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, phone: true, email: true, city: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Customers ──────────────────────────────────────────────────────────────────
const getCustomers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, phone: true, email: true, gstNo: true, address: true,
        city:    { select: { id: true, name: true } },
        state:   { select: { id: true, name: true } },
        country: { select: { id: true, name: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createCustomer = async (req, res) => {
  try {
    const { name, address, phone, email, gstNo, cityId, stateId, countryId, areaId } = req.body;
    if (!name || !cityId || !stateId || !countryId) {
      return res.status(400).json({ message: 'name, cityId, stateId, and countryId are required' });
    }
    const branchId = getBranchId(req);
    const data = { name: name.trim(), cityId: Number(cityId), stateId: Number(stateId), countryId: Number(countryId), branchId: branchId || null };
    if (address) data.address = address.trim();
    if (phone)   data.phone   = phone.trim();
    if (email)   data.email   = email.toLowerCase().trim();
    if (gstNo)   data.gstNo   = gstNo.trim();
    if (areaId)  data.areaId  = Number(areaId);
    const row = await prisma.customer.create({
      data,
      select: { id: true, name: true, phone: true, email: true, city: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, address, phone, email, gstNo, cityId, stateId, countryId, areaId } = req.body;
    const data = {};
    if (name)                  data.name      = name.trim();
    if (address !== undefined) data.address   = address;
    if (phone !== undefined)   data.phone     = phone;
    if (email !== undefined)   data.email     = email?.toLowerCase().trim();
    if (gstNo !== undefined)   data.gstNo     = gstNo;
    if (cityId)                data.cityId    = Number(cityId);
    if (stateId)               data.stateId   = Number(stateId);
    if (countryId)             data.countryId = Number(countryId);
    if (areaId !== undefined)  data.areaId    = areaId ? Number(areaId) : null;
    const row = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, phone: true, email: true, city: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Products ───────────────────────────────────────────────────────────────────
const getProducts = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, purchasePrice: true, sellingPrice: true, barcode: true,
        category: { select: { id: true, name: true } },
        unit:     { select: { id: true, unitName: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createProduct = async (req, res) => {
  try {
    const { name, categoryId, unitId, purchasePrice, sellingPrice, barcode } = req.body;
    if (!name || !categoryId || !unitId || purchasePrice == null || sellingPrice == null) {
      return res.status(400).json({ message: 'name, categoryId, unitId, purchasePrice, and sellingPrice are required' });
    }
    const branchId = getBranchId(req);
    const data = {
      name: name.trim(),
      categoryId:    Number(categoryId),
      unitId:        Number(unitId),
      purchasePrice: Number(purchasePrice),
      sellingPrice:  Number(sellingPrice),
      branchId:      branchId || null,
    };
    if (barcode) data.barcode = barcode.trim();
    const row = await prisma.product.create({
      data,
      select: { id: true, name: true, purchasePrice: true, sellingPrice: true, category: { select: { id: true, name: true } }, unit: { select: { id: true, unitName: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'Barcode already exists' : 'Server error' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, categoryId, unitId, purchasePrice, sellingPrice, barcode } = req.body;
    const data = {};
    if (name)                   data.name          = name.trim();
    if (categoryId)             data.categoryId    = Number(categoryId);
    if (unitId)                 data.unitId        = Number(unitId);
    if (purchasePrice != null)  data.purchasePrice = Number(purchasePrice);
    if (sellingPrice != null)   data.sellingPrice  = Number(sellingPrice);
    if (barcode !== undefined)  data.barcode       = barcode?.trim() || null;
    const row = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, purchasePrice: true, sellingPrice: true, category: { select: { id: true, name: true } }, unit: { select: { id: true, unitName: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

// ── Payment Methods ────────────────────────────────────────────────────────────
const getPaymentMethods = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.paymentMethodMaster.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

const createPaymentMethod = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.paymentMethodMaster.create({
      data: { name: name.trim(), branchId: branchId || null },
      select: { id: true, name: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: `Payment method "${req.body.name}" already exists.` });
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.paymentMethodMaster.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: `Payment method "${req.body.name}" already exists.` });
    res.status(500).json({ message: 'Server error' });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    await prisma.paymentMethodMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: 'Server error' }); }
};

module.exports = {
  getCountries, createCountry, updateCountry, deleteCountry,
  getStates,    createState,   updateState,   deleteState,
  getCities,    createCity,    updateCity,    deleteCity,
  getAreas,     createArea,    updateArea,    deleteArea,
  getBranches,  createBranch,  updateBranch,  deleteBranch,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,     createUnit,    updateUnit,    deleteUnit,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getProducts,  createProduct,  updateProduct,  deleteProduct,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
};
