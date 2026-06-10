const prisma = require('../utils/prisma');

const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

const prismaErr = (err) => {
  if (err.code === 'P2002') return `This ${(err.meta?.target || ['record'])[0]?.replace(/Id$/, '') || 'record'} already exists.`;
  if (err.code === 'P2003') {
    const field = err.meta?.field_name || '';
    if (field.includes('branchId') || field.includes('Branch')) {
      return 'BRANCH_INVALID: Your selected branch no longer exists. Please log out and select a valid branch.';
    }
    return 'A related record was not found. Please refresh and try again.';
  }
  if (err.code === 'P2025') return 'Record not found.';
  return err.message || 'Server error';
};

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

// ── Branches ───────────────────────────────────────────────────────────────────
const getBranches = async (req, res) => {
  try {
    const rows = await prisma.branch.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, address: true,
        city:    { select: { id: true, name: true } },
        state:   { select: { id: true, name: true } },
        country: { select: { id: true, name: true, phoneCode: true, currency: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createBranch = async (req, res) => {
  try {
    const { name, address, area, cityId, stateId, countryId } = req.body;
    if (!name || !cityId || !stateId || !countryId) {
      return res.status(400).json({ message: 'name, cityId, stateId, and countryId are required' });
    }
    const data = { name: name.trim(), cityId: Number(cityId), stateId: Number(stateId), countryId: Number(countryId) };
    if (address) data.address = address.trim();
    if (area)    data.area    = area.trim();
    const row = await prisma.branch.create({
      data,
      select: { id: true, name: true, address: true, area: true, city: { select: { id: true, name: true } }, state: { select: { id: true, name: true } }, country: { select: { id: true, name: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error('createBranch error:', err);
    if (err.code === 'P2003') return res.status(400).json({ message: 'Invalid city, state, or country — please re-select from the dropdowns.' });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Database sequence out of sync. Run: cd backend && node fix-sequences.js' });
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { name, address, area, cityId, stateId, countryId } = req.body;
    const data = {};
    if (name)                  data.name      = name.trim();
    if (address !== undefined) data.address   = address;
    if (area !== undefined)    data.area      = area || null;
    if (cityId)                data.cityId    = Number(cityId);
    if (stateId)               data.stateId   = Number(stateId);
    if (countryId)             data.countryId = Number(countryId);
    const row = await prisma.branch.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, city: { select: { id: true, name: true } }, state: { select: { id: true, name: true } }, country: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteBranch = async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
    if (err.code === 'P2002') return res.status(409).json({ message: 'Category already exists' });
    res.status(500).json({ message: prismaErr(err) });
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteCategory = async (req, res) => {
  try {
    await prisma.categoryMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

// ── Units ──────────────────────────────────────────────────────────────────────
const getUnits = async (_req, res) => {
  try {
    const rows = await prisma.unitMaster.findMany({
      select: { id: true, unitName: true, shortName: true },
      orderBy: { unitName: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteUnit = async (req, res) => {
  try {
    await prisma.unitMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
        id: true, name: true, phone: true, email: true, gstNo: true, address: true, area: true,
        cityName: true, stateName: true, countryName: true,
        contacts:     { select: { id: true, name: true, phone: true, designation: true, dob: true }, orderBy: { id: 'asc' } },
        transactions: { select: { type: true, amount: true } },
      },
    });
    const result = rows.map(r => {
      const balance = r.transactions.reduce((sum, t) => sum + (t.type === 'CR' ? t.amount : -t.amount), 0);
      const { transactions, ...rest } = r;
      return { ...rest, balance };
    });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const getSupplierTransactions = async (req, res) => {
  try {
    const rows = await prisma.supplierTransaction.findMany({
      where: { supplierId: Number(req.params.id) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createSupplierTransaction = async (req, res) => {
  try {
    const { type, amount, note, date } = req.body;
    if (!type || !amount || !['CR', 'DR'].includes(type))
      return res.status(400).json({ message: 'type (CR or DR) and amount are required' });
    const row = await prisma.supplierTransaction.create({
      data: {
        supplierId: Number(req.params.id),
        type,
        amount:     Number(amount),
        note:       note || null,
        source:     'manual',
        date:       date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createSupplier = async (req, res) => {
  try {
    const { name, address, area, phone, email, gstNo, cityId, stateId, countryId, contacts, openingBalance, openingBalanceType } = req.body;
    if (!name)      return res.status(400).json({ message: 'Supplier name is required' });
    if (!countryId) return res.status(400).json({ message: 'Please select a country' });
    if (!stateId)   return res.status(400).json({ message: 'Please select a state' });
    if (!cityId)    return res.status(400).json({ message: 'Please select a city' });
    const branchId = getBranchId(req);

    // Look up names to store alongside IDs
    const [cityRec, stateRec, countryRec] = await Promise.all([
      prisma.cityMaster.findUnique({ where: { id: Number(cityId) }, select: { name: true } }),
      prisma.stateMaster.findUnique({ where: { id: Number(stateId) }, select: { name: true } }),
      prisma.countryMaster.findUnique({ where: { id: Number(countryId) }, select: { name: true } }),
    ]);

    const data = {
      name: name.trim(),
      cityId: Number(cityId), cityName: cityRec?.name || null,
      stateId: Number(stateId), stateName: stateRec?.name || null,
      countryId: Number(countryId), countryName: countryRec?.name || null,
      branchId: branchId || null,
    };
    if (address) data.address = address.trim();
    if (area)    data.area    = area.trim();
    if (phone)   data.phone   = phone.trim();
    if (email)   data.email   = email.toLowerCase().trim();
    if (gstNo)   data.gstNo   = gstNo.trim();

    const validContacts = Array.isArray(contacts)
      ? contacts.filter(c => c.name?.trim()).map(c => ({
          name:        c.name.trim(),
          phone:       c.phone       || null,
          designation: c.designation || null,
          dob:         c.dob         || null,
        }))
      : [];
    if (validContacts.length) data.contacts = { create: validContacts };

    const row = await prisma.supplier.create({
      data,
      select: {
        id: true, name: true, phone: true, email: true, area: true, address: true,
        cityName: true, stateName: true, countryName: true,
        contacts: { select: { id: true, name: true, phone: true, designation: true, dob: true } },
      },
    });

    let balance = 0;
    const obAmt = parseFloat(openingBalance);
    if (!isNaN(obAmt) && obAmt > 0) {
      const obType = openingBalanceType === 'DR' ? 'DR' : 'CR';
      await prisma.supplierTransaction.create({
        data: {
          supplierId: row.id,
          type:       obType,
          amount:     obAmt,
          note:       'Opening balance',
          source:     'opening_balance',
          date:       new Date(),
        },
      });
      balance = obType === 'CR' ? obAmt : -obAmt;
    }

    res.status(201).json({ ...row, balance });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const updateSupplier = async (req, res) => {
  try {
    const { name, address, area, phone, email, gstNo, cityId, stateId, countryId } = req.body;
    const data = {};
    if (name)                  data.name      = name.trim();
    if (address !== undefined) data.address   = address;
    if (area !== undefined)    data.area      = area || null;
    if (phone !== undefined)   data.phone     = phone;
    if (email !== undefined)   data.email     = email?.toLowerCase().trim();
    if (gstNo !== undefined)   data.gstNo     = gstNo;
    if (cityId)                data.cityId    = Number(cityId);
    if (stateId)               data.stateId   = Number(stateId);
    if (countryId)             data.countryId = Number(countryId);
    const row = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, phone: true, email: true, city: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteSupplier = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
        id: true, name: true, phone: true, email: true, gstNo: true, address: true, area: true,
        cityName: true, stateName: true, countryName: true,
        contacts:     { select: { id: true, name: true, phone: true, designation: true, dob: true }, orderBy: { id: 'asc' } },
        transactions: { select: { type: true, amount: true } },
      },
    });
    const result = rows.map(r => {
      const balance = r.transactions.reduce((sum, t) => sum + (t.type === 'CR' ? t.amount : -t.amount), 0);
      const { transactions, ...rest } = r;
      return { ...rest, balance };
    });
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const getCustomerTransactions = async (req, res) => {
  try {
    const rows = await prisma.customerTransaction.findMany({
      where: { customerId: Number(req.params.id) },
      orderBy: { createdAt: 'desc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createCustomerTransaction = async (req, res) => {
  try {
    const { type, amount, note, date } = req.body;
    if (!type || !amount || !['CR', 'DR'].includes(type))
      return res.status(400).json({ message: 'type (CR or DR) and amount are required' });
    const row = await prisma.customerTransaction.create({
      data: {
        customerId: Number(req.params.id),
        type,
        amount:     Number(amount),
        note:       note || null,
        source:     'manual',
        date:       date ? new Date(date) : new Date(),
      },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createCustomer = async (req, res) => {
  try {
    const { name, address, area, phone, email, gstNo, cityId, stateId, countryId, contacts, openingBalance, openingBalanceType } = req.body;
    if (!name)      return res.status(400).json({ message: 'Customer name is required' });
    if (!countryId) return res.status(400).json({ message: 'Please select a country' });
    if (!stateId)   return res.status(400).json({ message: 'Please select a state' });
    if (!cityId)    return res.status(400).json({ message: 'Please select a city' });
    const branchId = getBranchId(req);

    // Look up names to store alongside IDs
    const [cityRec, stateRec, countryRec] = await Promise.all([
      prisma.cityMaster.findUnique({ where: { id: Number(cityId) }, select: { name: true } }),
      prisma.stateMaster.findUnique({ where: { id: Number(stateId) }, select: { name: true } }),
      prisma.countryMaster.findUnique({ where: { id: Number(countryId) }, select: { name: true } }),
    ]);

    const data = {
      name: name.trim(),
      cityId: Number(cityId), cityName: cityRec?.name || null,
      stateId: Number(stateId), stateName: stateRec?.name || null,
      countryId: Number(countryId), countryName: countryRec?.name || null,
      branchId: branchId || null,
    };
    if (address) data.address = address.trim();
    if (area)    data.area    = area.trim();
    if (phone)   data.phone   = phone.trim();
    if (email)   data.email   = email.toLowerCase().trim();
    if (gstNo)   data.gstNo   = gstNo.trim();

    const validContacts = Array.isArray(contacts)
      ? contacts.filter(c => c.name?.trim()).map(c => ({
          name:        c.name.trim(),
          phone:       c.phone       || null,
          designation: c.designation || null,
          dob:         c.dob         || null,
        }))
      : [];
    if (validContacts.length) data.contacts = { create: validContacts };

    const row = await prisma.customer.create({
      data,
      select: {
        id: true, name: true, phone: true, email: true, area: true, address: true,
        cityName: true, stateName: true, countryName: true,
        contacts: { select: { id: true, name: true, phone: true, designation: true, dob: true } },
      },
    });

    let balance = 0;
    const obAmt = parseFloat(openingBalance);
    if (!isNaN(obAmt) && obAmt > 0) {
      const obType = openingBalanceType === 'DR' ? 'DR' : 'CR';
      await prisma.customerTransaction.create({
        data: {
          customerId: row.id,
          type:       obType,
          amount:     obAmt,
          note:       'Opening balance',
          source:     'opening_balance',
          date:       new Date(),
        },
      });
      balance = obType === 'CR' ? obAmt : -obAmt;
    }

    res.status(201).json({ ...row, balance });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const updateCustomer = async (req, res) => {
  try {
    const { name, address, area, phone, email, gstNo, cityId, stateId, countryId } = req.body;
    const data = {};
    if (name)                  data.name      = name.trim();
    if (address !== undefined) data.address   = address;
    if (area !== undefined)    data.area      = area || null;
    if (phone !== undefined)   data.phone     = phone;
    if (email !== undefined)   data.email     = email?.toLowerCase().trim();
    if (gstNo !== undefined)   data.gstNo     = gstNo;
    if (cityId)                data.cityId    = Number(cityId);
    if (stateId)               data.stateId   = Number(stateId);
    if (countryId)             data.countryId = Number(countryId);
    const row = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, phone: true, email: true, city: { select: { id: true, name: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteCustomer = async (req, res) => {
  try {
    await prisma.customer.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
        id: true, name: true, lowerLimit: true, upperLimit: true, barcode: true,
        category: { select: { id: true, name: true } },
        unit:     { select: { id: true, unitName: true } },
      },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createProduct = async (req, res) => {
  try {
    const { name, categoryId, unitId, lowerLimit, upperLimit, barcode } = req.body;
    if (!name || !categoryId || !unitId || lowerLimit == null || upperLimit == null) {
      return res.status(400).json({ message: 'name, categoryId, unitId, lowerLimit, and upperLimit are required' });
    }
    const branchId = getBranchId(req);
    const data = {
      name: name.trim(),
      categoryId: Number(categoryId),
      unitId:     Number(unitId),
      lowerLimit: Number(lowerLimit),
      upperLimit: Number(upperLimit),
      branchId:   branchId || null,
    };
    if (barcode) data.barcode = barcode.trim();
    const row = await prisma.product.create({
      data,
      select: { id: true, name: true, lowerLimit: true, upperLimit: true, barcode: true, category: { select: { id: true, name: true } }, unit: { select: { id: true, unitName: true } } },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.code === 'P2002' ? 'Barcode already exists' : prismaErr(err) });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, categoryId, unitId, lowerLimit, upperLimit, barcode } = req.body;
    const data = {};
    if (name)                data.name       = name.trim();
    if (categoryId)          data.categoryId = Number(categoryId);
    if (unitId)              data.unitId     = Number(unitId);
    if (lowerLimit != null)  data.lowerLimit = Number(lowerLimit);
    if (upperLimit != null)  data.upperLimit = Number(upperLimit);
    if (barcode !== undefined) data.barcode  = barcode?.trim() || null;
    const row = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, lowerLimit: true, upperLimit: true, barcode: true, category: { select: { id: true, name: true } }, unit: { select: { id: true, unitName: true } } },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
    res.status(500).json({ message: prismaErr(err) });
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
    res.status(500).json({ message: prismaErr(err) });
  }
};

const deletePaymentMethod = async (req, res) => {
  try {
    await prisma.paymentMethodMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

// ── Warehouses ─────────────────────────────────────────────────────────────────
const getWarehouses = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.warehouseMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

const createWarehouse = async (req, res) => {
  const { name, address, area, cityId } = req.body;
  if (!name) return res.status(400).json({ message: 'Warehouse name is required' });
  try {
    const branchId = getBranchId(req);
    const row = await prisma.warehouseMaster.create({
      data: {
        name,
        address: address || null,
        area:    area    || null,
        cityId:  cityId  ? parseInt(cityId) : undefined,
        branchId: branchId || null,
      },
    });
    res.status(201).json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

const updateWarehouse = async (req, res) => {
  const { name, address, area, cityId } = req.body;
  try {
    const row = await prisma.warehouseMaster.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        address: address || null,
        area:    area    || null,
        cityId:  cityId  ? parseInt(cityId) : undefined,
      },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

const deleteWarehouse = async (req, res) => {
  try {
    await prisma.warehouseMaster.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) { console.error(err); res.status(500).json({ message: err.message }); }
};

module.exports = {
  getCountries, createCountry, updateCountry, deleteCountry,
  getStates,    createState,   updateState,   deleteState,
  getCities,    createCity,    updateCity,    deleteCity,
  getBranches,  createBranch,  updateBranch,  deleteBranch,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,     createUnit,    updateUnit,    deleteUnit,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getSupplierTransactions, createSupplierTransaction,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getCustomerTransactions, createCustomerTransaction,
  getProducts,  createProduct,  updateProduct,  deleteProduct,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
};
