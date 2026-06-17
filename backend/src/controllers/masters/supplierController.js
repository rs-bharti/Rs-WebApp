const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

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

module.exports = {
  getSuppliers, getSupplierTransactions, createSupplierTransaction,
  createSupplier, updateSupplier, deleteSupplier, forceDeleteSupplier,
};
