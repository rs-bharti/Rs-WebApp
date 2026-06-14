/**
 * wipe-data.js
 * ============
 * Deletes ALL data from the database EXCEPT the "DUMMY FOR CHECKING" branch
 * and everything linked to it (users, customers, suppliers, products, vouchers, etc.)
 *
 * Does NOT drop tables — only deletes rows.
 * Countries / States / Cities (seed data) are never touched.
 *
 * HOW TO USE:
 *   node wipe-data.js --preview    ← shows what will be deleted (safe, no changes)
 *   node wipe-data.js --run        ← actually deletes everything
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEEP_BRANCH_NAME = 'DUMMY FOR CHECKING';

async function preview() {
  const dummy = await prisma.branch.findFirst({ where: { name: KEEP_BRANCH_NAME }, select: { id: true, name: true } });
  if (!dummy) { console.error(`\n ERROR: Branch "${KEEP_BRANCH_NAME}" not found!\n`); return; }

  const keepId = dummy.id;
  const otherBranches = await prisma.branch.findMany({ where: { id: { not: keepId } }, select: { id: true, name: true } });
  const otherIds = otherBranches.map(b => b.id);

  console.log(`\n=== PREVIEW — What will be deleted ===`);
  console.log(`\n  KEEPING: Branch ID ${keepId} — "${KEEP_BRANCH_NAME}" and all its data`);
  console.log(`\n  DELETING ${otherBranches.length} branch(es):`);
  otherBranches.forEach(b => console.log(`    - ID ${b.id}: "${b.name}"`));

  if (otherIds.length === 0) { console.log('\n  No other branches found. Nothing to delete.\n'); return; }

  const [
    receipts, payments, sales, purchases, salesReturns, purchaseReturns,
    stockData, stockTransfers, contras,
    customers, suppliers, products,
    warehouses, paymentMethods, expenses, categories, units, branchMasters,
    users,
  ] = await Promise.all([
    prisma.receiptVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.paymentVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.salesVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.purchaseVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.salesReturnVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.purchaseReturnVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.stockDataVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.stockTransferVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.contraVoucher.count({ where: { branchId: { in: otherIds } } }),
    prisma.customer.count({ where: { branchId: { in: otherIds } } }),
    prisma.supplier.count({ where: { branchId: { in: otherIds } } }),
    prisma.product.count({ where: { branchId: { in: otherIds } } }),
    prisma.warehouseMaster.count({ where: { branchId: { in: otherIds } } }),
    prisma.paymentMethodMaster.count({ where: { branchId: { in: otherIds } } }),
    prisma.expenseMaster.count({ where: { branchId: { in: otherIds } } }),
    prisma.categoryMaster.count({ where: { branchId: { in: otherIds } } }),
    prisma.unitMaster.count({ where: { branchId: { in: otherIds } } }),
    prisma.branchMaster.count({ where: { branchId: { in: otherIds } } }),
    prisma.user.count({ where: { branchId: { in: otherIds } } }),
  ]);

  console.log(`\n  VOUCHERS:`);
  console.log(`    Receipts: ${receipts}, Payments: ${payments}, Sales: ${sales}, Purchases: ${purchases}`);
  console.log(`    Sales Returns: ${salesReturns}, Purchase Returns: ${purchaseReturns}`);
  console.log(`    Stock Data: ${stockData}, Stock Transfers: ${stockTransfers}, Contra: ${contras}`);
  console.log(`\n  MASTERS:`);
  console.log(`    Customers: ${customers}, Suppliers: ${suppliers}, Products: ${products}`);
  console.log(`    Warehouses: ${warehouses}, Payment Methods: ${paymentMethods}, Expenses: ${expenses}`);
  console.log(`    Categories: ${categories}, Units: ${units}, Branch Masters: ${branchMasters}`);
  console.log(`\n  USERS: ${users}`);
  console.log(`\nTo actually delete, run:  node wipe-data.js --run\n`);
}

async function run() {
  const dummy = await prisma.branch.findFirst({ where: { name: KEEP_BRANCH_NAME }, select: { id: true, name: true } });
  if (!dummy) { console.error(`\n ERROR: Branch "${KEEP_BRANCH_NAME}" not found! Aborting.\n`); process.exit(1); }

  const keepId = dummy.id;
  const otherBranches = await prisma.branch.findMany({ where: { id: { not: keepId } }, select: { id: true } });
  const otherIds = otherBranches.map(b => b.id);

  if (otherIds.length === 0) { console.log('\n No other branches found. Nothing to delete.\n'); return; }

  console.log(`\n Keeping: "${KEEP_BRANCH_NAME}" (ID ${keepId})`);
  console.log(` Wiping all other data...\n`);

  // Step 1: Delete all vouchers from other branches (voucher items cascade automatically)
  const [r, p, s, pu, sr, pr, sd, st, c] = await Promise.all([
    prisma.receiptVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.paymentVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.salesVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.purchaseVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.salesReturnVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.purchaseReturnVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.stockDataVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.stockTransferVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.contraVoucher.deleteMany({ where: { branchId: { in: otherIds } } }),
  ]);
  console.log(` Vouchers deleted — Receipts:${r.count} Payments:${p.count} Sales:${s.count} Purchases:${pu.count} SalesRet:${sr.count} PurchRet:${pr.count} Stock:${sd.count} Transfer:${st.count} Contra:${c.count}`);

  // Step 2: Delete customers, suppliers (CustomerTransaction/SupplierTransaction/ContactPerson cascade)
  const [cust, supp] = await Promise.all([
    prisma.customer.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.supplier.deleteMany({ where: { branchId: { in: otherIds } } }),
  ]);
  console.log(` Customers deleted: ${cust.count}, Suppliers deleted: ${supp.count}`);

  // Step 3: Delete products
  const prod = await prisma.product.deleteMany({ where: { branchId: { in: otherIds } } });
  console.log(` Products deleted: ${prod.count}`);

  // Step 4: Delete other masters
  const [wh, pm, ex, cat, unit, bm, db] = await Promise.all([
    prisma.warehouseMaster.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.paymentMethodMaster.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.expenseMaster.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.categoryMaster.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.unitMaster.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.branchMaster.deleteMany({ where: { branchId: { in: otherIds } } }),
    prisma.dashboardBalance.deleteMany({ where: { branchId: { in: otherIds } } }),
  ]);
  console.log(` Masters deleted — Warehouses:${wh.count} PayMethods:${pm.count} Expenses:${ex.count} Categories:${cat.count} Units:${unit.count} BranchMasters:${bm.count} DashBalance:${db.count}`);

  // Step 5: Delete users from other branches
  const users = await prisma.user.deleteMany({ where: { branchId: { in: otherIds } } });
  console.log(` Users deleted: ${users.count}`);

  // Step 6: Delete other branches
  const branches = await prisma.branch.deleteMany({ where: { id: { in: otherIds } } });
  console.log(` Branches deleted: ${branches.count}`);

  console.log(`\n Done! "${KEEP_BRANCH_NAME}" branch and all its data is intact.\n`);
}

async function main() {
  const mode = process.argv[2];
  if (mode === '--preview') {
    await preview();
  } else if (mode === '--run') {
    await run();
  } else {
    console.log('\nUsage:');
    console.log('  node wipe-data.js --preview   (shows what will be deleted)');
    console.log('  node wipe-data.js --run        (actually deletes everything)\n');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
