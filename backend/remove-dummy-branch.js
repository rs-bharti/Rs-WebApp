/**
 * remove-dummy-branch.js
 * ======================
 * Deletes ONLY the "DUMMY" branch and everything tied to it.
 * Leaves all other branches (TEST, DUMMY FOR CHECKING, etc.) completely untouched.
 * Countries / States / Cities are never touched.
 *
 * HOW TO USE (from the backend folder):
 *   node remove-dummy-branch.js --preview    ← shows what will be deleted (safe, no changes)
 *   node remove-dummy-branch.js --run        ← actually deletes everything
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const REMOVE_BRANCH_NAME = 'DUMMY';

async function findDummy() {
  const branch = await prisma.branch.findFirst({
    where: { name: { equals: REMOVE_BRANCH_NAME, mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  if (!branch) {
    console.error(`\n  ERROR: Branch "${REMOVE_BRANCH_NAME}" not found!\n`);
    process.exit(1);
  }
  return branch;
}

async function preview() {
  const branch = await findDummy();
  const branchId = branch.id;

  const [
    receipts, payments, contras,
    sales, purchases, salesReturns, purchaseReturns,
    stockData, stockTransfers,
    customers, suppliers, products,
    warehouses, paymentMethods, expenses, categories, units, branchMasters,
    dashBalance, users,
  ] = await Promise.all([
    prisma.receiptVoucher.count({ where: { branchId } }),
    prisma.paymentVoucher.count({ where: { branchId } }),
    prisma.contraVoucher.count({ where: { branchId } }),
    prisma.salesVoucher.count({ where: { branchId } }),
    prisma.purchaseVoucher.count({ where: { branchId } }),
    prisma.salesReturnVoucher.count({ where: { branchId } }),
    prisma.purchaseReturnVoucher.count({ where: { branchId } }),
    prisma.stockDataVoucher.count({ where: { branchId } }),
    prisma.stockTransferVoucher.count({ where: { branchId } }),
    prisma.customer.count({ where: { branchId } }),
    prisma.supplier.count({ where: { branchId } }),
    prisma.product.count({ where: { branchId } }),
    prisma.warehouseMaster.count({ where: { branchId } }),
    prisma.paymentMethodMaster.count({ where: { branchId } }),
    prisma.expenseMaster.count({ where: { branchId } }),
    prisma.categoryMaster.count({ where: { branchId } }),
    prisma.unitMaster.count({ where: { branchId } }),
    prisma.branchMaster.count({ where: { branchId } }),
    prisma.dashboardBalance.count({ where: { branchId } }),
    prisma.user.count({ where: { branchId } }),
  ]);

  const remaining = await prisma.branch.findMany({
    where: { id: { not: branchId } },
    select: { id: true, name: true },
  });

  console.log(`\n=== PREVIEW — Branch "${REMOVE_BRANCH_NAME}" (ID ${branchId}) will be DELETED ===`);
  console.log(`\n  VOUCHERS:`);
  console.log(`    Receipts:${receipts}  Payments:${payments}  Contra:${contras}`);
  console.log(`    Sales:${sales}  Purchases:${purchases}  Sales Returns:${salesReturns}  Purchase Returns:${purchaseReturns}`);
  console.log(`    Stock Data:${stockData}  Stock Transfers:${stockTransfers}`);
  console.log(`\n  MASTERS:`);
  console.log(`    Customers:${customers}  Suppliers:${suppliers}  Products:${products}`);
  console.log(`    Warehouses:${warehouses}  Payment Methods:${paymentMethods}  Expenses:${expenses}`);
  console.log(`    Categories:${categories}  Units:${units}  Branch Masters:${branchMasters}  Dashboard Balance:${dashBalance}`);
  console.log(`\n  USERS in this branch: ${users}`);
  if (users > 0) {
    const fallback = remaining[0];
    console.log(`    → Users will be reassigned to branch "${fallback?.name}" (ID ${fallback?.id}) before deletion`);
  }
  console.log(`\n  BRANCHES THAT WILL REMAIN UNTOUCHED:`);
  remaining.forEach(b => console.log(`    - "${b.name}" (ID ${b.id})`));
  console.log(`\nTo actually delete, run:  node remove-dummy-branch.js --run\n`);
}

async function run() {
  const branch = await findDummy();
  const branchId = branch.id;

  // Find a fallback branch to reassign users to (any branch that isn't DUMMY)
  const fallback = await prisma.branch.findFirst({
    where: { id: { not: branchId } },
    select: { id: true, name: true },
  });
  if (!fallback) {
    console.error('\n  ERROR: No other branch exists to reassign users to. Aborting.\n');
    process.exit(1);
  }

  console.log(`\n  Removing branch "${REMOVE_BRANCH_NAME}" (ID ${branchId})...`);
  console.log(`  Users (if any) will be reassigned to "${fallback.name}" (ID ${fallback.id})\n`);

  // Step 1: Delete all vouchers (items cascade automatically via onDelete: Cascade)
  const [r, p, c, s, pu, sr, pr, sd, st] = await Promise.all([
    prisma.receiptVoucher.deleteMany({ where: { branchId } }),
    prisma.paymentVoucher.deleteMany({ where: { branchId } }),
    prisma.contraVoucher.deleteMany({ where: { branchId } }),
    prisma.salesVoucher.deleteMany({ where: { branchId } }),
    prisma.purchaseVoucher.deleteMany({ where: { branchId } }),
    prisma.salesReturnVoucher.deleteMany({ where: { branchId } }),
    prisma.purchaseReturnVoucher.deleteMany({ where: { branchId } }),
    prisma.stockDataVoucher.deleteMany({ where: { branchId } }),
    prisma.stockTransferVoucher.deleteMany({ where: { branchId } }),
  ]);
  console.log(`  Vouchers deleted — Receipts:${r.count} Payments:${p.count} Contra:${c.count} Sales:${s.count} Purchases:${pu.count} SalesRet:${sr.count} PurchRet:${pr.count} StockData:${sd.count} StockTransfer:${st.count}`);

  // Step 2: Delete customers and suppliers (transactions + contacts cascade)
  const [cust, supp] = await Promise.all([
    prisma.customer.deleteMany({ where: { branchId } }),
    prisma.supplier.deleteMany({ where: { branchId } }),
  ]);
  console.log(`  Customers deleted: ${cust.count}  Suppliers deleted: ${supp.count}`);

  // Step 3: Delete products
  const prod = await prisma.product.deleteMany({ where: { branchId } });
  console.log(`  Products deleted: ${prod.count}`);

  // Step 4: Delete branch-specific masters
  const [wh, pm, ex, cat, unit, bm, db] = await Promise.all([
    prisma.warehouseMaster.deleteMany({ where: { branchId } }),
    prisma.paymentMethodMaster.deleteMany({ where: { branchId } }),
    prisma.expenseMaster.deleteMany({ where: { branchId } }),
    prisma.categoryMaster.deleteMany({ where: { branchId } }),
    prisma.unitMaster.deleteMany({ where: { branchId } }),
    prisma.branchMaster.deleteMany({ where: { branchId } }),
    prisma.dashboardBalance.deleteMany({ where: { branchId } }),
  ]);
  console.log(`  Masters deleted — Warehouses:${wh.count} PayMethods:${pm.count} Expenses:${ex.count} Categories:${cat.count} Units:${unit.count} BranchMasters:${bm.count} DashBalance:${db.count}`);

  // Step 5: Reassign users from DUMMY branch to the fallback branch
  const moved = await prisma.user.updateMany({
    where: { branchId },
    data: { branchId: fallback.id },
  });
  console.log(`  Users reassigned to "${fallback.name}": ${moved.count}`);

  // Step 6: Delete the branch
  await prisma.branch.delete({ where: { id: branchId } });
  console.log(`\n  Branch "${REMOVE_BRANCH_NAME}" deleted successfully!`);
  console.log(`  All other branches and their data are untouched.\n`);
}

async function main() {
  const mode = process.argv[2];
  if (mode === '--preview') {
    await preview();
  } else if (mode === '--run') {
    await run();
  } else {
    console.log('\nUsage:');
    console.log('  node remove-dummy-branch.js --preview   (shows what will be deleted)');
    console.log('  node remove-dummy-branch.js --run        (actually deletes)\n');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
