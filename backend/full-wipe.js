/**
 * full-wipe.js
 * ============
 * Wipes ALL data from the database.
 * Keeps: TEST branch + 1 admin user (reassigned to TEST branch).
 * Keeps: Country, State, City data (never touched).
 * Keeps: Role, Module, Permission (system config).
 *
 * HOW TO USE (from the backend folder):
 *   node full-wipe.js --preview    <- shows what will be deleted (safe, no changes)
 *   node full-wipe.js --run        <- actually deletes everything
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEEP_BRANCH_NAME = 'TEST';

async function findKeepBranch() {
  const branch = await prisma.branch.findFirst({
    where: { name: { equals: KEEP_BRANCH_NAME, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!branch) {
    console.error(`\n  ERROR: Branch "${KEEP_BRANCH_NAME}" not found!\n`);
    process.exit(1);
  }
  return branch;
}

async function findKeepUser() {
  // Keep the admin user with the lowest ID
  const adminRole = await prisma.role.findFirst({
    where: { name: { contains: 'admin', mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (adminRole) {
    const user = await prisma.user.findFirst({
      where: { roleId: adminRole.id },
      orderBy: { id: 'asc' },
      select: { id: true, name: true, email: true, roleId: true },
    });
    if (user) return user;
  }
  // Fallback: keep user with the lowest ID
  return await prisma.user.findFirst({ orderBy: { id: 'asc' }, select: { id: true, name: true, email: true, roleId: true } });
}

async function preview() {
  const keepBranch = await findKeepBranch();
  const keepUser   = await findKeepUser();

  const [
    receipts, payments, contras,
    sales, purchases, salesReturns, purchaseReturns,
    stockData, stockTransfers,
    customers, suppliers, products,
    paymentMethods, categories, units, expenses, warehouses, branchMasters,
    dashBalance, users, branches,
  ] = await Promise.all([
    prisma.receiptVoucher.count(),
    prisma.paymentVoucher.count(),
    prisma.contraVoucher.count(),
    prisma.salesVoucher.count(),
    prisma.purchaseVoucher.count(),
    prisma.salesReturnVoucher.count(),
    prisma.purchaseReturnVoucher.count(),
    prisma.stockDataVoucher.count(),
    prisma.stockTransferVoucher.count(),
    prisma.customer.count(),
    prisma.supplier.count(),
    prisma.product.count(),
    prisma.paymentMethodMaster.count(),
    prisma.categoryMaster.count(),
    prisma.unitMaster.count(),
    prisma.expenseMaster.count(),
    prisma.warehouseMaster.count(),
    prisma.branchMaster.count(),
    prisma.dashboardBalance.count(),
    prisma.user.count({ where: { id: { not: keepUser.id } } }),
    prisma.branch.count({ where: { id: { not: keepBranch.id } } }),
  ]);

  console.log('\n=== PREVIEW — Full Wipe ===');
  console.log(`\n  KEEPING:`);
  console.log(`    Branch : "${keepBranch.name}" (ID ${keepBranch.id})`);
  console.log(`    User   : "${keepUser.name}" <${keepUser.email}> (ID ${keepUser.id})`);
  console.log(`\n  DELETING:`);
  console.log(`    Vouchers — Receipts:${receipts} Payments:${payments} Contra:${contras}`);
  console.log(`               Sales:${sales} Purchases:${purchases} SalesRet:${salesReturns} PurchRet:${purchaseReturns}`);
  console.log(`               StockData:${stockData} StockTransfer:${stockTransfers}`);
  console.log(`    Masters  — Customers:${customers} Suppliers:${suppliers} Products:${products}`);
  console.log(`               PayMethods:${paymentMethods} Categories:${categories} Units:${units}`);
  console.log(`               Expenses:${expenses} Warehouses:${warehouses} BranchMasters:${branchMasters}`);
  console.log(`    Other    — DashboardBalance:${dashBalance} Users:${users} Branches:${branches}`);
  console.log(`\n  NOT TOUCHED: Country, State, City, Role, Module, Permission`);
  console.log(`\nTo actually delete, run:  node full-wipe.js --run\n`);
}

async function run() {
  const keepBranch = await findKeepBranch();
  const keepUser   = await findKeepUser();

  console.log(`\n  Full wipe starting...`);
  console.log(`  Keeping branch: "${keepBranch.name}" (ID ${keepBranch.id})`);
  console.log(`  Keeping user  : "${keepUser.name}" <${keepUser.email}> (ID ${keepUser.id})\n`);

  // ── Step 1: Delete all vouchers (items cascade via onDelete: Cascade) ─────
  const [r, p, cv, s, pu, sr, pr, sd, st] = await Promise.all([
    prisma.receiptVoucher.deleteMany({}),
    prisma.paymentVoucher.deleteMany({}),
    prisma.contraVoucher.deleteMany({}),
    prisma.salesVoucher.deleteMany({}),
    prisma.purchaseVoucher.deleteMany({}),
    prisma.salesReturnVoucher.deleteMany({}),
    prisma.purchaseReturnVoucher.deleteMany({}),
    prisma.stockDataVoucher.deleteMany({}),
    prisma.stockTransferVoucher.deleteMany({}),
  ]);
  console.log(`  [1] Vouchers deleted — Receipts:${r.count} Payments:${p.count} Contra:${cv.count} Sales:${s.count} Purchases:${pu.count} SalesRet:${sr.count} PurchRet:${pr.count} StockData:${sd.count} StockTransfer:${st.count}`);

  // ── Step 2: Delete customers & suppliers (transactions + contacts cascade) ─
  const [cust, supp] = await Promise.all([
    prisma.customer.deleteMany({}),
    prisma.supplier.deleteMany({}),
  ]);
  console.log(`  [2] Customers:${cust.count}  Suppliers:${supp.count} deleted`);

  // ── Step 3: Delete products ────────────────────────────────────────────────
  const prod = await prisma.product.deleteMany({});
  console.log(`  [3] Products deleted: ${prod.count}`);

  // ── Step 4: Delete all masters (including globals with branchId = null) ────
  const [pm, cat, unit, ex, wh, bm, db] = await Promise.all([
    prisma.paymentMethodMaster.deleteMany({}),
    prisma.categoryMaster.deleteMany({}),
    prisma.unitMaster.deleteMany({}),
    prisma.expenseMaster.deleteMany({}),
    prisma.warehouseMaster.deleteMany({}),
    prisma.branchMaster.deleteMany({}),
    prisma.dashboardBalance.deleteMany({}),
  ]);
  console.log(`  [4] Masters deleted — PayMethods:${pm.count} Categories:${cat.count} Units:${unit.count} Expenses:${ex.count} Warehouses:${wh.count} BranchMasters:${bm.count} DashBalance:${db.count}`);

  // ── Step 5: Delete all users except the kept admin ────────────────────────
  const users = await prisma.user.deleteMany({ where: { id: { not: keepUser.id } } });
  console.log(`  [5] Users deleted: ${users.count}`);

  // ── Step 6: Reassign kept user to TEST branch ─────────────────────────────
  await prisma.user.update({
    where: { id: keepUser.id },
    data: { branchId: keepBranch.id },
  });
  console.log(`  [6] User "${keepUser.name}" reassigned to "${keepBranch.name}" branch`);

  // ── Step 7: Delete all branches except TEST ───────────────────────────────
  const branches = await prisma.branch.deleteMany({ where: { id: { not: keepBranch.id } } });
  console.log(`  [7] Branches deleted: ${branches.count}`);

  console.log(`\n  Done! Database is clean.`);
  console.log(`  Branch: "${keepBranch.name}" | User: "${keepUser.name}" <${keepUser.email}>\n`);
}

async function main() {
  const mode = process.argv[2];
  if (mode === '--preview') {
    await preview();
  } else if (mode === '--run') {
    await run();
  } else {
    console.log('\nUsage:');
    console.log('  node full-wipe.js --preview   (shows what will be deleted — safe)');
    console.log('  node full-wipe.js --run        (actually wipes everything)\n');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
