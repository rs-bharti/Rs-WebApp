const prisma = require('../../utils/prisma');
const { prismaErr } = require('./masterHelpers');

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

module.exports = { updateContact, deleteContact };
