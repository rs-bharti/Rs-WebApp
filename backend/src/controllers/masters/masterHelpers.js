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

module.exports = { getBranchId, prismaErr };
