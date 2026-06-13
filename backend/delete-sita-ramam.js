const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branchName = 'Sita Ramam';

  const branch = await prisma.branch.findUnique({ where: { name: branchName } });
  if (!branch) {
    console.log(`Branch "${branchName}" not found in database.`);
    return;
  }

  const id = branch.id;
  console.log(`Found branch "${branchName}" (id=${id}). Deleting all related data...`);

  await prisma.$transaction(async (tx) => {
    // 1. Delete vouchers with required branchId (items cascade automatically)
    const pv  = await tx.purchaseVoucher.deleteMany({ where: { branchId: id } });
    const sv  = await tx.salesVoucher.deleteMany({ where: { branchId: id } });
    const prv = await tx.purchaseReturnVoucher.deleteMany({ where: { branchId: id } });
    const srv = await tx.salesReturnVoucher.deleteMany({ where: { branchId: id } });

    // 2. Delete vouchers with nullable branchId
    const cv  = await tx.contraVoucher.deleteMany({ where: { branchId: id } });
    const rv  = await tx.receiptVoucher.deleteMany({ where: { branchId: id } });
    const payv = await tx.paymentVoucher.deleteMany({ where: { branchId: id } });
    const sdv = await tx.stockDataVoucher.deleteMany({ where: { branchId: id } });
    const stv = await tx.stockTransferVoucher.deleteMany({ where: { branchId: id } });

    console.log(`  Vouchers deleted: Purchase(${pv.count}), Sales(${sv.count}), PurchaseReturn(${prv.count}), SalesReturn(${srv.count}), Contra(${cv.count}), Receipt(${rv.count}), Payment(${payv.count}), StockData(${sdv.count}), StockTransfer(${stv.count})`);

    // 3. Delete users (non-nullable branchId)
    const users = await tx.user.deleteMany({ where: { branchId: id } });
    console.log(`  Users deleted: ${users.count}`);

    // 4. Delete customers & suppliers (transactions + contacts cascade)
    const cust = await tx.customer.deleteMany({ where: { branchId: id } });
    const supp = await tx.supplier.deleteMany({ where: { branchId: id } });
    console.log(`  Customers deleted: ${cust.count}, Suppliers deleted: ${supp.count}`);

    // 5. Delete products
    const prod = await tx.product.deleteMany({ where: { branchId: id } });
    console.log(`  Products deleted: ${prod.count}`);

    // 6. Delete branch-specific masters
    const bm  = await tx.branchMaster.deleteMany({ where: { branchId: id } });
    const pm  = await tx.paymentMethodMaster.deleteMany({ where: { branchId: id } });
    const em  = await tx.expenseMaster.deleteMany({ where: { branchId: id } });
    const cat = await tx.categoryMaster.deleteMany({ where: { branchId: id } });
    const wh  = await tx.warehouseMaster.deleteMany({ where: { branchId: id } });
    console.log(`  Masters deleted: BranchMaster(${bm.count}), PaymentMethod(${pm.count}), Expense(${em.count}), Category(${cat.count}), Warehouse(${wh.count})`);

    // 7. Finally delete the branch
    await tx.branch.delete({ where: { id } });
  });

  console.log(`\nBranch "${branchName}" and all its data have been completely removed.`);
}

main()
  .catch(err => { console.error('Error:', err.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
