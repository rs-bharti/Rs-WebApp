const prisma = require('../../utils/prisma');
const { getBranchId, prismaErr } = require('./masterHelpers');

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

module.exports = {
  getCustomers, getCustomerTransactions, createCustomerTransaction,
  createCustomer, updateCustomer, deleteCustomer, forceDeleteCustomer,
};
