const prisma = require('../utils/prisma');

const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

const FK_MESSAGES = {
  stockdatavoucher:     'Cannot delete — this record is used in Stock Data vouchers.',
  stocktransfervoucher: 'Cannot delete — this record is used in Stock Transfer vouchers.',
  salesreturnvoucher:   'Cannot delete — this record is used in Sales Return vouchers.',
  salesvoucher:         'Cannot delete — this record is used in Sales vouchers.',
  purchasereturnvoucher:'Cannot delete — this record is used in Purchase Return vouchers.',
  purchasevoucher:      'Cannot delete — this record is used in Purchase vouchers.',
  receiptvoucher:       'Cannot delete — this record is used in Receipt vouchers.',
  paymentvoucher:       'Cannot delete — this record is used in Payment vouchers.',
  contravoucher:        'Cannot delete — this record is used in Contra vouchers.',
  product:              'Cannot delete — Products are linked to this record. Remove them first.',
  customer:             'Cannot delete — Customers are linked to this record.',
  supplier:             'Cannot delete — Suppliers are linked to this record.',
};

const fkFriendlyMsg = (err) => {
  const raw = (err.meta?.field_name || err.message || '').toLowerCase();
  for (const [key, msg] of Object.entries(FK_MESSAGES)) {
    if (raw.includes(key)) return msg;
  }
  return 'Cannot delete — this record is currently used by other data. Remove those references first.';
};

const prismaErr = (err) => {
  if (err.code === 'P2002') return `This ${(err.meta?.target || ['record'])[0]?.replace(/Id$/, '') || 'record'} already exists.`;
  if (err.code === 'P2003') {
    const field = err.meta?.field_name || '';
    if (field.includes('branchId') || field.includes('Branch')) {
      return 'BRANCH_INVALID: Your selected branch no longer exists. Please log out and select a valid branch.';
    }
    return fkFriendlyMsg(err);
  }
  if (err.code === 'P2025') return 'Record not found.';
  // Catch FK violations that surface as plain errors (SQLite / some adapters)
  if ((err.message || '').toLowerCase().includes('foreign key constraint')) return fkFriendlyMsg(err);
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
const branchSelect = {
  id: true, name: true, address: true, area: true, createdAt: true,
  city:    { select: { id: true, name: true } },
  state:   { select: { id: true, name: true } },
  country: { select: { id: true, name: true, currency: true, phoneCode: true } },
};

const getBranches = async (req, res) => {
  try {
    const rows = await prisma.branch.findMany({ orderBy: { name: 'asc' }, select: branchSelect });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createBranch = async (req, res) => {
  try {
    const { name, address, area, cityId, stateId, countryId } = req.body;
    if (!name) return res.status(400).json({ message: 'Branch name is required' });
    const row = await prisma.branch.create({
      data: {
        name: name.trim(),
        ...(address   && { address }),
        ...(area      && { area }),
        ...(cityId    && { cityId:    parseInt(cityId) }),
        ...(stateId   && { stateId:   parseInt(stateId) }),
        ...(countryId && { countryId: parseInt(countryId) }),
      },
      select: branchSelect,
    });
    res.status(201).json(row);
  } catch (err) {
    console.error('createBranch error:', err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'A branch with that name already exists.' });
    res.status(500).json({ message: err.message || 'Server error' });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { name, address, area, cityId, stateId, countryId } = req.body;
    const data = {};
    if (name)      data.name      = name.trim();
    if (address !== undefined) data.address = address || null;
    if (area    !== undefined) data.area    = area    || null;
    if (cityId    !== undefined) data.cityId    = cityId    ? parseInt(cityId)    : null;
    if (stateId   !== undefined) data.stateId   = stateId   ? parseInt(stateId)   : null;
    if (countryId !== undefined) data.countryId = countryId ? parseInt(countryId) : null;
    const row = await prisma.branch.update({ where: { id: Number(req.params.id) }, data, select: branchSelect });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteBranch = async (req, res) => {
  try {
    await prisma.branch.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Branch Master (voucher dropdowns — branch-specific) ────────────────────────
const getBranchMasters = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const rows = await prisma.branchMaster.findMany({
      where: branchId ? { branchId } : {},
      select: { id: true, name: true, branchId: true, branchName: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { res.status(500).json({ message: prismaErr(err) }); }
};

const createBranchMaster = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });
    const branchId = getBranchId(req);
    let branchName = null;
    if (branchId) {
      const branchRec = await prisma.branch.findUnique({ where: { id: branchId }, select: { name: true } });
      branchName = branchRec?.name || null;
    }
    const row = await prisma.branchMaster.create({
      data: { name: name.trim(), ...(branchId && { branchId, branchName }) },
    });
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ message: 'A branch master with that name already exists in this branch.' });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updateBranchMaster = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.branchMaster.update({ where: { id: Number(req.params.id) }, data: { name: name.trim() } });
    res.json(row);
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
};

const deleteBranchMaster = async (req, res) => {
  try {
    await prisma.branchMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(400).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Units ──────────────────────────────────────────────────────────────────────
const getUnits = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.unitMaster.findMany({
      where,
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
    const branchId = getBranchId(req);
    const row = await prisma.unitMaster.create({
      data: { unitName: unitName.trim(), shortName: shortName?.trim() || null, branchId: branchId || null },
      select: { id: true, unitName: true, shortName: true },
    });
    res.status(201).json(row);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ message: 'Unit already exists in this branch' });
    res.status(500).json({ message: prismaErr(err) });
  }
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
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
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
        cityId: true, stateId: true, countryId: true,
        cityName: true, stateName: true, countryName: true,
        contacts:     { select: { id: true, name: true, phone: true, designation: true, dob: true }, orderBy: { id: 'asc' } },
        transactions: { select: { type: true, amount: true, source: true } },
      },
    });
    const result = rows.map(r => {
      const balance = r.transactions.reduce((sum, t) => sum + ((t.type === 'CR' && t.source !== 'payment') ? t.amount : -t.amount), 0);
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
    if (!name) return res.status(400).json({ message: 'Supplier name is required' });
    const branchId = getBranchId(req);

    const [cityRec, stateRec, countryRec] = await Promise.all([
      cityId    ? prisma.cityMaster.findUnique({ where: { id: Number(cityId) }, select: { name: true } })    : Promise.resolve(null),
      stateId   ? prisma.stateMaster.findUnique({ where: { id: Number(stateId) }, select: { name: true } })  : Promise.resolve(null),
      countryId ? prisma.countryMaster.findUnique({ where: { id: Number(countryId) }, select: { name: true } }) : Promise.resolve(null),
    ]);

    const data = {
      name: name.trim(),
      ...(cityId    && { cityId: Number(cityId), cityName: cityRec?.name || null }),
      ...(stateId   && { stateId: Number(stateId), stateName: stateRec?.name || null }),
      ...(countryId && { countryId: Number(countryId), countryName: countryRec?.name || null }),
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
        id: true, name: true, phone: true, email: true, gstNo: true, area: true, address: true,
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
      // CR = we owe supplier (positive/Cr); DR = supplier owes us (negative/Dr)
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
    const [cityRec, stateRec, countryRec] = await Promise.all([
      cityId    ? prisma.cityMaster.findUnique({ where: { id: Number(cityId) }, select: { name: true } })       : Promise.resolve(null),
      stateId   ? prisma.stateMaster.findUnique({ where: { id: Number(stateId) }, select: { name: true } })     : Promise.resolve(null),
      countryId ? prisma.countryMaster.findUnique({ where: { id: Number(countryId) }, select: { name: true } }) : Promise.resolve(null),
    ]);
    if (cityId)    { data.cityId    = Number(cityId);    data.cityName    = cityRec?.name    || null; }
    if (stateId)   { data.stateId   = Number(stateId);   data.stateName   = stateRec?.name   || null; }
    if (countryId) { data.countryId = Number(countryId); data.countryName = countryRec?.name || null; }
    const row = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, phone: true, email: true, gstNo: true, area: true, address: true, cityId: true, stateId: true, countryId: true, cityName: true, stateName: true, countryName: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteSupplier = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [purchase, payment, receipt, purchaseReturn] = await Promise.all([
      prisma.purchaseVoucher.findFirst({ where: { supplierId: id }, select: { id: true } }),
      prisma.paymentVoucher.findFirst({ where: { supplierId: id }, select: { id: true } }),
      prisma.receiptVoucher.findFirst({ where: { supplierId: id }, select: { id: true } }),
      prisma.purchaseReturnVoucher.findFirst({ where: { supplierId: id }, select: { id: true } }),
    ]);
    const linked = [
      purchase       && 'Purchase vouchers',
      payment        && 'Payment vouchers',
      receipt        && 'Receipt vouchers',
      purchaseReturn && 'Purchase Return vouchers',
    ].filter(Boolean);
    if (linked.length) return res.status(400).json({ message: `Cannot delete — this supplier is linked to: ${linked.join(', ')}.` });
    await prisma.supplier.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Customers ──────────────────────────────────────────────────────────────────
const getCustomers = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const [rows, txList] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true, name: true, phone: true, email: true, gstNo: true, address: true, area: true,
          cityId: true, stateId: true, countryId: true,
          cityName: true, stateName: true, countryName: true,
          contacts: { select: { id: true, name: true, phone: true, designation: true, dob: true }, orderBy: { id: 'asc' } },
        },
      }),
      prisma.customerTransaction.findMany({
        where: branchId ? { customer: { branchId } } : {},
        select: { customerId: true, type: true, amount: true, source: true },
      }),
    ]);
    const balanceMap = {};
    for (const t of txList) {
      const inCR = t.type === 'CR' || t.source === 'receipt';
      balanceMap[t.customerId] = (balanceMap[t.customerId] || 0) + (inCR ? t.amount : -t.amount);
    }
    const result = rows.map(r => ({ ...r, balance: balanceMap[r.id] || 0 }));
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
    if (!name) return res.status(400).json({ message: 'Customer name is required' });
    const branchId = getBranchId(req);

    const [cityRec, stateRec, countryRec] = await Promise.all([
      cityId    ? prisma.cityMaster.findUnique({ where: { id: Number(cityId) }, select: { name: true } })    : Promise.resolve(null),
      stateId   ? prisma.stateMaster.findUnique({ where: { id: Number(stateId) }, select: { name: true } })  : Promise.resolve(null),
      countryId ? prisma.countryMaster.findUnique({ where: { id: Number(countryId) }, select: { name: true } }) : Promise.resolve(null),
    ]);

    const data = {
      name: name.trim(),
      ...(cityId    && { cityId: Number(cityId), cityName: cityRec?.name || null }),
      ...(stateId   && { stateId: Number(stateId), stateName: stateRec?.name || null }),
      ...(countryId && { countryId: Number(countryId), countryName: countryRec?.name || null }),
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
        id: true, name: true, phone: true, email: true, gstNo: true, area: true, address: true,
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
      // CR = we receive (positive); DR = we give (negative)
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
    const [cityRec, stateRec, countryRec] = await Promise.all([
      cityId    ? prisma.cityMaster.findUnique({ where: { id: Number(cityId) }, select: { name: true } })       : Promise.resolve(null),
      stateId   ? prisma.stateMaster.findUnique({ where: { id: Number(stateId) }, select: { name: true } })     : Promise.resolve(null),
      countryId ? prisma.countryMaster.findUnique({ where: { id: Number(countryId) }, select: { name: true } }) : Promise.resolve(null),
    ]);
    if (cityId)    { data.cityId    = Number(cityId);    data.cityName    = cityRec?.name    || null; }
    if (stateId)   { data.stateId   = Number(stateId);   data.stateName   = stateRec?.name   || null; }
    if (countryId) { data.countryId = Number(countryId); data.countryName = countryRec?.name || null; }
    const row = await prisma.customer.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, phone: true, email: true, gstNo: true, area: true, address: true, cityId: true, stateId: true, countryId: true, cityName: true, stateName: true, countryName: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteCustomer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [sales, receipt, salesReturn, payment] = await Promise.all([
      prisma.salesVoucher.findFirst({ where: { customerId: id }, select: { id: true } }),
      prisma.receiptVoucher.findFirst({ where: { customerId: id }, select: { id: true } }),
      prisma.salesReturnVoucher.findFirst({ where: { customerId: id }, select: { id: true } }),
      prisma.paymentVoucher.findFirst({ where: { customerId: id }, select: { id: true } }),
    ]);
    const linked = [
      sales       && 'Sales vouchers',
      receipt     && 'Receipt vouchers',
      salesReturn && 'Sales Return vouchers',
      payment     && 'Payment vouchers',
    ].filter(Boolean);
    if (linked.length) return res.status(400).json({ message: `Cannot delete — this customer is linked to: ${linked.join(', ')}.` });
    await prisma.customer.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
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
    const id = Number(req.params.id);
    const [purchase, sales, purchaseReturn, salesReturn, stockData, stockTransfer] = await Promise.all([
      prisma.purchaseVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.salesVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.purchaseReturnVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.salesReturnVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.stockDataVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
      prisma.stockTransferVoucherItem.findFirst({ where: { productId: id }, select: { id: true } }),
    ]);
    const linked = [
      purchase       && 'Purchase vouchers',
      sales          && 'Sales vouchers',
      purchaseReturn && 'Purchase Return vouchers',
      salesReturn    && 'Sales Return vouchers',
      stockData      && 'Stock Data vouchers',
      stockTransfer  && 'Stock Transfer vouchers',
    ].filter(Boolean);
    if (linked.length) return res.status(400).json({ message: `Cannot delete — this product is linked to: ${linked.join(', ')}.` });
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Payment Methods ────────────────────────────────────────────────────────────
const getPaymentMethods = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.paymentMethodMaster.findMany({
      where,
      select: { id: true, name: true, category: true, openingBalance: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createPaymentMethod = async (req, res) => {
  try {
    const { name, category, openingBalance } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.paymentMethodMaster.create({
      data: { name: name.trim(), category: category || null, branchId: branchId || null, openingBalance: Number(openingBalance ?? 0) },
      select: { id: true, name: true, category: true, openingBalance: true },
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
    const { name, category, openingBalance } = req.body;
    const row = await prisma.paymentMethodMaster.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name.trim(),
        ...(category !== undefined && { category: category || null }),
        ...(openingBalance !== undefined && { openingBalance: Number(openingBalance) }),
      },
      select: { id: true, name: true, category: true, openingBalance: true },
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
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Expense Master ─────────────────────────────────────────────────────────────
const getExpenses = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.expenseMaster.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const createExpense = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Expense name is required' });
    const branchId = getBranchId(req);
    const row = await prisma.expenseMaster.create({
      data: { name: name.trim(), branchId: branchId || null },
      select: { id: true, name: true },
    });
    res.status(201).json(row);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2002') return res.status(409).json({ message: 'Expense type already exists' });
    res.status(500).json({ message: prismaErr(err) });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { name } = req.body;
    const row = await prisma.expenseMaster.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim() },
      select: { id: true, name: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteExpense = async (req, res) => {
  try {
    await prisma.expenseMaster.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Warehouses ─────────────────────────────────────────────────────────────────
const getWarehouses = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    const where = branchId ? { branchId } : {};
    const rows = await prisma.warehouseMaster.findMany({ where, orderBy: { createdAt: 'desc' } });
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
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
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteWarehouse = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [purchase, sales, purchaseReturn, salesReturnItem] = await Promise.all([
      prisma.purchaseVoucher.findFirst({ where: { warehouseId: id }, select: { id: true } }),
      prisma.salesVoucher.findFirst({ where: { warehouseId: id }, select: { id: true } }),
      prisma.purchaseReturnVoucher.findFirst({ where: { warehouseId: id }, select: { id: true } }),
      prisma.salesReturnVoucherItem.findFirst({ where: { warehouseId: id }, select: { id: true } }),
    ]);
    const linked = [
      purchase        && 'Purchase vouchers',
      sales           && 'Sales vouchers',
      purchaseReturn  && 'Purchase Return vouchers',
      salesReturnItem && 'Sales Return vouchers',
    ].filter(Boolean);
    if (linked.length) return res.status(400).json({ message: `Cannot delete — this warehouse is linked to: ${linked.join(', ')}.` });
    await prisma.warehouseMaster.delete({ where: { id } });
    res.json({ message: 'Warehouse deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Contact Persons ────────────────────────────────────────────────────────────
const updateContact = async (req, res) => {
  try {
    const { name, phone, designation, dob } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Contact name is required' });
    const row = await prisma.contactPerson.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim(), phone: phone || null, designation: designation || null, dob: dob || null },
      select: { id: true, name: true, phone: true, designation: true, dob: true },
    });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const deleteContact = async (req, res) => {
  try {
    await prisma.contactPerson.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted' });
  } catch (err) { console.error(err); res.status(400).json({ message: prismaErr(err) }); }
};

// ── Dashboard Balance ──────────────────────────────────────────────────────────
const getDashboardBalance = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    // Get or create opening balance for this branch
    let opening = await prisma.dashboardBalance.findUnique({ where: { branchId } });
    if (!opening) {
      opening = await prisma.dashboardBalance.create({ data: { branchId, openingCash: 0, openingBank: 0, openingReceivables: 0 } });
    }

    // Sum opening balances per category from payment method master
    const [
      cashOpeningAgg, bankOpeningAgg,
      cashIn, bankIn, cashOut, bankOut,
      contraToCash, contraToBank, contraFromCash, contraFromBank,
    ] = await Promise.all([
      prisma.paymentMethodMaster.aggregate({ where: { branchId, category: 'CASH' }, _sum: { openingBalance: true } }),
      prisma.paymentMethodMaster.aggregate({ where: { branchId, category: 'BANK' }, _sum: { openingBalance: true } }),
      // Receipt = money IN → add to balance
      prisma.receiptVoucher.aggregate({ where: { branchId, paymentMethod: { category: 'CASH' } }, _sum: { amount: true } }),
      prisma.receiptVoucher.aggregate({ where: { branchId, paymentMethod: { category: 'BANK' } }, _sum: { amount: true } }),
      // Payment = money OUT → subtract from balance
      prisma.paymentVoucher.aggregate({ where: { branchId, paymentMethod: { category: 'CASH' } }, _sum: { amount: true } }),
      prisma.paymentVoucher.aggregate({ where: { branchId, paymentMethod: { category: 'BANK' } }, _sum: { amount: true } }),
      // Contra = transfer between methods → destination gains, source loses
      prisma.contraVoucher.aggregate({ where: { branchId, toPaymentMethod:   { category: 'CASH' } }, _sum: { amount: true } }),
      prisma.contraVoucher.aggregate({ where: { branchId, toPaymentMethod:   { category: 'BANK' } }, _sum: { amount: true } }),
      prisma.contraVoucher.aggregate({ where: { branchId, fromPaymentMethod: { category: 'CASH' } }, _sum: { amount: true } }),
      prisma.contraVoucher.aggregate({ where: { branchId, fromPaymentMethod: { category: 'BANK' } }, _sum: { amount: true } }),
    ]);

    const openingCash = cashOpeningAgg._sum.openingBalance || 0;
    const openingBank = bankOpeningAgg._sum.openingBalance || 0;
    const currentCash = openingCash
      + (cashIn._sum.amount       || 0)   // receipt via CASH method
      + (contraToCash._sum.amount || 0)   // contra transfer into CASH
      - (cashOut._sum.amount      || 0)   // payment via CASH method
      - (contraFromCash._sum.amount || 0); // contra transfer out of CASH
    const currentBank = openingBank
      + (bankIn._sum.amount       || 0)   // receipt via BANK method
      + (contraToBank._sum.amount || 0)   // contra transfer into BANK
      - (bankOut._sum.amount      || 0)   // payment via BANK method
      - (contraFromBank._sum.amount || 0); // contra transfer out of BANK

    // Total Receivables = Opening + Payments to customers (advance/refund) - Receipts from customers
    // Only receipt/payment vouchers where the particular is a customer affect this figure.
    const customerFilter = { OR: [{ customerId: { not: null } }, { particularType: 'customer' }] };
    const [custReceiptsAgg, payToCustomerAgg] = await Promise.all([
      prisma.receiptVoucher.aggregate({ where: { branchId, ...customerFilter }, _sum: { amount: true } }),
      prisma.paymentVoucher.aggregate({ where: { branchId, ...customerFilter }, _sum: { amount: true } }),
    ]);

    const totalReceivables =
      (opening.openingReceivables || 0)
      + (custReceiptsAgg._sum.amount || 0)   // receipt = getting money from customer → increases
      - (payToCustomerAgg._sum.amount || 0); // payment = paying out to customer → decreases

    res.json({
      openingCash:         Math.round(openingCash * 100) / 100,
      openingBank:         Math.round(openingBank * 100) / 100,
      openingReceivables:  Math.round((opening.openingReceivables || 0) * 100) / 100,
      currentCash:         Math.round(currentCash * 100) / 100,
      currentBank:         Math.round(currentBank * 100) / 100,
      totalReceivables:    Math.round(totalReceivables * 100) / 100,
    });
  } catch (err) {
    console.error('getDashboardBalance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateDashboardBalance = async (req, res) => {
  try {
    const branchId = getBranchId(req);
    if (!branchId) return res.status(400).json({ message: 'Branch required' });

    const { openingCash, openingBank, openingReceivables } = req.body;

    const balance = await prisma.dashboardBalance.upsert({
      where:  { branchId },
      update: {
        ...(openingCash        !== undefined ? { openingCash:        Number(openingCash)        } : {}),
        ...(openingBank        !== undefined ? { openingBank:        Number(openingBank)        } : {}),
        ...(openingReceivables !== undefined ? { openingReceivables: Number(openingReceivables) } : {}),
      },
      create: {
        branchId,
        openingCash:        Number(openingCash        ?? 0),
        openingBank:        Number(openingBank        ?? 0),
        openingReceivables: Number(openingReceivables ?? 0),
      },
    });

    res.json(balance);
  } catch (err) {
    console.error('updateDashboardBalance error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Force Delete helpers ───────────────────────────────────────────────────────
// Deletes all vouchers tied to a list of productIds (items cascade on voucher delete)
const forceDeleteVouchersForProducts = async (productIds) => {
  if (!productIds.length) return;
  const [pvIds, prvIds, svIds, srvIds, sdvIds, stIds] = await Promise.all([
    prisma.purchaseVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.purchaseReturnVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.salesVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.salesReturnVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.stockDataVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
    prisma.stockTransferVoucherItem.findMany({ where: { productId: { in: productIds } }, select: { voucherId: true } }),
  ]);
  const uniq = (arr) => [...new Set(arr.map(i => i.voucherId))];
  const ops = [];
  const pv = uniq(pvIds); if (pv.length) ops.push(prisma.purchaseVoucher.deleteMany({ where: { id: { in: pv } } }));
  const prv = uniq(prvIds); if (prv.length) ops.push(prisma.purchaseReturnVoucher.deleteMany({ where: { id: { in: prv } } }));
  const sv = uniq(svIds); if (sv.length) ops.push(prisma.salesVoucher.deleteMany({ where: { id: { in: sv } } }));
  const srv = uniq(srvIds); if (srv.length) ops.push(prisma.salesReturnVoucher.deleteMany({ where: { id: { in: srv } } }));
  const sdv = uniq(sdvIds); if (sdv.length) ops.push(prisma.stockDataVoucher.deleteMany({ where: { id: { in: sdv } } }));
  const st = uniq(stIds); if (st.length) ops.push(prisma.stockTransferVoucher.deleteMany({ where: { id: { in: st } } }));
  if (ops.length) await prisma.$transaction(ops);
};

const forceDeleteBranch = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [custIds, suppIds, prodIds] = await Promise.all([
      prisma.customer.findMany({ where: { branchId: id }, select: { id: true } }),
      prisma.supplier.findMany({ where: { branchId: id }, select: { id: true } }),
      prisma.product.findMany({ where: { branchId: id }, select: { id: true } }),
    ]);
    const cIds = custIds.map(c => c.id);
    const sIds = suppIds.map(s => s.id);
    const pIds = prodIds.map(p => p.id);
    await forceDeleteVouchersForProducts(pIds);
    await prisma.$transaction([
      prisma.receiptVoucher.deleteMany({ where: { branchId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { branchId: id } }),
      prisma.salesVoucher.deleteMany({ where: { branchId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { branchId: id } }),
      prisma.salesReturnVoucher.deleteMany({ where: { branchId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { branchId: id } }),
      prisma.stockDataVoucher.deleteMany({ where: { branchId: id } }),
      prisma.stockTransferVoucher.deleteMany({ where: { branchId: id } }),
      prisma.contraVoucher.deleteMany({ where: { branchId: id } }),
      ...(cIds.length ? [prisma.customer.deleteMany({ where: { id: { in: cIds } } })] : []),
      ...(sIds.length ? [prisma.supplier.deleteMany({ where: { id: { in: sIds } } })] : []),
      ...(pIds.length ? [prisma.product.deleteMany({ where: { id: { in: pIds } } })] : []),
      prisma.warehouseMaster.deleteMany({ where: { branchId: id } }),
      prisma.paymentMethodMaster.deleteMany({ where: { branchId: id } }),
      prisma.expenseMaster.deleteMany({ where: { branchId: id } }),
      prisma.categoryMaster.deleteMany({ where: { branchId: id } }),
      prisma.unitMaster.deleteMany({ where: { branchId: id } }),
      prisma.branchMaster.deleteMany({ where: { branchId: id } }),
      prisma.dashboardBalance.deleteMany({ where: { branchId: id } }),
      prisma.user.deleteMany({ where: { branchId: id } }),
      prisma.branch.delete({ where: { id } }),
    ]);
    res.json({ message: 'Branch and all linked data deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeleteSupplier = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.purchaseVoucher.deleteMany({ where: { supplierId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { supplierId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { supplierId: id } }),
      prisma.receiptVoucher.deleteMany({ where: { supplierId: id } }),
      prisma.supplier.delete({ where: { id } }), // SupplierTransaction & ContactPerson cascade
    ]);
    res.json({ message: 'Supplier and all linked data deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeleteCustomer = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.salesVoucher.deleteMany({ where: { customerId: id } }),
      prisma.salesReturnVoucher.deleteMany({ where: { customerId: id } }),
      prisma.receiptVoucher.deleteMany({ where: { customerId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { customerId: id } }),
      prisma.customer.delete({ where: { id } }), // CustomerTransaction & ContactPerson cascade
    ]);
    res.json({ message: 'Customer and all linked data deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await forceDeleteVouchersForProducts([id]);
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product and all linked vouchers deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeleteWarehouse = async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Find SalesReturnVouchers that have items tied to this warehouse
    const srvItems = await prisma.salesReturnVoucherItem.findMany({ where: { warehouseId: id }, select: { voucherId: true } });
    const srvIds = [...new Set(srvItems.map(i => i.voucherId))];
    await prisma.$transaction([
      prisma.salesVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.stockDataVoucher.deleteMany({ where: { warehouseId: id } }),
      prisma.stockTransferVoucher.deleteMany({ where: { OR: [{ fromWarehouseId: id }, { toWarehouseId: id }] } }),
      ...(srvIds.length ? [prisma.salesReturnVoucher.deleteMany({ where: { id: { in: srvIds } } })] : []),
      prisma.warehouseMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Warehouse and all linked vouchers deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeleteCategory = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const products = await prisma.product.findMany({ where: { categoryId: id }, select: { id: true } });
    await forceDeleteVouchersForProducts(products.map(p => p.id));
    await prisma.$transaction([
      ...(products.length ? [prisma.product.deleteMany({ where: { categoryId: id } })] : []),
      prisma.categoryMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Category and all linked products deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeleteUnit = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const products = await prisma.product.findMany({ where: { unitId: id }, select: { id: true } });
    await forceDeleteVouchersForProducts(products.map(p => p.id));
    await prisma.$transaction([
      ...(products.length ? [prisma.product.deleteMany({ where: { unitId: id } })] : []),
      prisma.unitMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Unit and all linked products deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

const forceDeletePaymentMethod = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.$transaction([
      prisma.receiptVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.paymentVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.purchaseVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.purchaseReturnVoucher.deleteMany({ where: { paymentMethodId: id } }),
      prisma.contraVoucher.deleteMany({ where: { OR: [{ fromPaymentMethodId: id }, { toPaymentMethodId: id }] } }),
      prisma.paymentMethodMaster.delete({ where: { id } }),
    ]);
    res.json({ message: 'Payment method and all linked vouchers deleted.' });
  } catch (err) { console.error(err); res.status(500).json({ message: prismaErr(err) }); }
};

module.exports = {
  getCountries, createCountry, updateCountry, deleteCountry,
  getStates,    createState,   updateState,   deleteState,
  getCities,    createCity,    updateCity,    deleteCity,
  getBranches,  createBranch,  updateBranch,  deleteBranch,
  getBranchMasters, createBranchMaster, updateBranchMaster, deleteBranchMaster,
  getCategories, createCategory, updateCategory, deleteCategory,
  getUnits,     createUnit,    updateUnit,    deleteUnit,
  getSuppliers, createSupplier, updateSupplier, deleteSupplier,
  getSupplierTransactions, createSupplierTransaction,
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
  getCustomerTransactions, createCustomerTransaction,
  getProducts,  createProduct,  updateProduct,  deleteProduct,
  getPaymentMethods, createPaymentMethod, updatePaymentMethod, deletePaymentMethod,
  getExpenses,  createExpense,  updateExpense,  deleteExpense,
  getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse,
  updateContact, deleteContact,
  getDashboardBalance, updateDashboardBalance,
  forceDeleteBranch, forceDeleteSupplier, forceDeleteCustomer,
  forceDeleteProduct, forceDeleteWarehouse, forceDeleteCategory,
  forceDeleteUnit, forceDeletePaymentMethod,
};
