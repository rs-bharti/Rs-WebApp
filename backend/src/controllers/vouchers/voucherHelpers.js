const prisma = require('../../utils/prisma');

const prismaErr = (err) => {
  if (err.code === 'P2025') return 'Voucher not found.';
  if (err.code === 'P2003' || (err.message || '').toLowerCase().includes('foreign key constraint'))
    return 'Cannot delete — this voucher is referenced by other records.';
  return err.message || 'Server error';
};

async function nextNo(model, prefix) {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const last = await prisma[model].findFirst({
    where: { voucherNo: { startsWith: fullPrefix } },
    orderBy: { voucherNo: 'desc' },
  });
  const seq = last ? parseInt(last.voucherNo.split('-')[2]) + 1 : 1;
  return `${fullPrefix}${String(seq).padStart(3, '0')}`;
}

// If two users submit the same voucher type at the same instant, both may get
// the same sequence number. The DB unique constraint will reject one of them.
// This wrapper retries up to 3 times, each time fetching a fresh number.
async function withVoucherRetry(fn) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isDuplicateVoucherNo =
        err.code === 'P2002' &&
        (err.meta?.target || []).some(f => f === 'voucherNo');
      if (isDuplicateVoucherNo && attempt < 2) continue;
      throw err;
    }
  }
}

// Extract active branch from request (header takes priority over JWT)
const getBranchId = (req) => {
  const headerBranch = req.headers['x-branch-id'];
  if (headerBranch) return Number(headerBranch);
  return req.user.branchId || null;
};

module.exports = { prismaErr, nextNo, withVoucherRetry, getBranchId };
