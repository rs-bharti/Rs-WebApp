-- AddColumn branchId to business master tables
ALTER TABLE "CategoryMaster" DROP CONSTRAINT IF EXISTS "CategoryMaster_name_key";
ALTER TABLE "CategoryMaster" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "CategoryMaster" ADD CONSTRAINT "CategoryMaster_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CategoryMaster" ADD CONSTRAINT "CategoryMaster_name_branchId_key" UNIQUE ("name", "branchId");

ALTER TABLE "Supplier" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Customer" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "Product" ADD CONSTRAINT "Product_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentMethodMaster" DROP CONSTRAINT IF EXISTS "PaymentMethodMaster_name_key";
ALTER TABLE "PaymentMethodMaster" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "PaymentMethodMaster" ADD CONSTRAINT "PaymentMethodMaster_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentMethodMaster" ADD CONSTRAINT "PaymentMethodMaster_name_branchId_key" UNIQUE ("name", "branchId");

ALTER TABLE "WarehouseMaster" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "WarehouseMaster" ADD CONSTRAINT "WarehouseMaster_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn branchId to voucher tables that lack it
ALTER TABLE "ContraVoucher" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "ContraVoucher" ADD CONSTRAINT "ContraVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ReceiptVoucher" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PaymentVoucher" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockDataVoucher" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "StockDataVoucher" ADD CONSTRAINT "StockDataVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StockTransferVoucher" ADD COLUMN "branchId" INTEGER;
ALTER TABLE "StockTransferVoucher" ADD CONSTRAINT "StockTransferVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
