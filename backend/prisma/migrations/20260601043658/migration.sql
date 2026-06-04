/*
  Warnings:

  - You are about to drop the column `areaName` on the `AreaMaster` table. All the data in the column will be lost.
  - You are about to drop the column `categoryName` on the `CategoryMaster` table. All the data in the column will be lost.
  - You are about to drop the column `cityName` on the `CityMaster` table. All the data in the column will be lost.
  - You are about to drop the column `countryName` on the `CountryMaster` table. All the data in the column will be lost.
  - You are about to drop the column `methodName` on the `PaymentMethodMaster` table. All the data in the column will be lost.
  - You are about to drop the column `stateName` on the `StateMaster` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `BranchMaster` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CustomerMaster` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductMaster` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SupplierMaster` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,cityId]` on the table `AreaMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `CategoryMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,stateId]` on the table `CityMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `CountryMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `PaymentMethodMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,countryId]` on the table `StateMaster` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `AreaMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CategoryMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CityMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `CountryMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `PaymentMethodMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `StateMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `roleId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `branchId` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "BranchMaster" DROP CONSTRAINT "BranchMaster_stateId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerMaster" DROP CONSTRAINT "CustomerMaster_areaId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerMaster" DROP CONSTRAINT "CustomerMaster_cityId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerMaster" DROP CONSTRAINT "CustomerMaster_countryId_fkey";

-- DropForeignKey
ALTER TABLE "CustomerMaster" DROP CONSTRAINT "CustomerMaster_stateId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaster" DROP CONSTRAINT "ProductMaster_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaster" DROP CONSTRAINT "ProductMaster_supplierId_fkey";

-- DropForeignKey
ALTER TABLE "ProductMaster" DROP CONSTRAINT "ProductMaster_unitId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierMaster" DROP CONSTRAINT "SupplierMaster_cityId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierMaster" DROP CONSTRAINT "SupplierMaster_countryId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierMaster" DROP CONSTRAINT "SupplierMaster_stateId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_branchId_fkey";

-- DropIndex
DROP INDEX "AreaMaster_areaName_cityId_key";

-- DropIndex
DROP INDEX "CategoryMaster_categoryName_key";

-- DropIndex
DROP INDEX "CityMaster_cityName_stateId_key";

-- DropIndex
DROP INDEX "CountryMaster_countryName_key";

-- DropIndex
DROP INDEX "PaymentMethodMaster_methodName_key";

-- DropIndex
DROP INDEX "StateMaster_stateName_countryId_key";

-- DropIndex
DROP INDEX "UnitMaster_unitName_key";

-- AlterTable
ALTER TABLE "AreaMaster" DROP COLUMN "areaName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CategoryMaster" DROP COLUMN "categoryName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CityMaster" DROP COLUMN "cityName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "CountryMaster" DROP COLUMN "countryName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PaymentMethodMaster" DROP COLUMN "methodName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StateMaster" DROP COLUMN "stateName",
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "UnitMaster" ADD COLUMN     "shortName" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "roleId" INTEGER NOT NULL,
ALTER COLUMN "branchId" SET NOT NULL;

-- DropTable
DROP TABLE "BranchMaster";

-- DropTable
DROP TABLE "CustomerMaster";

-- DropTable
DROP TABLE "ProductMaster";

-- DropTable
DROP TABLE "SupplierMaster";

-- CreateTable
CREATE TABLE "WarehouseMaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "areaId" INTEGER,
    "cityId" INTEGER,

    CONSTRAINT "WarehouseMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "areaId" INTEGER,
    "cityId" INTEGER NOT NULL,
    "stateId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "gstNo" TEXT,
    "areaId" INTEGER,
    "cityId" INTEGER NOT NULL,
    "stateId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "unitId" INTEGER NOT NULL,
    "purchasePrice" DOUBLE PRECISION NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "barcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "gstNo" TEXT,
    "areaId" INTEGER,
    "cityId" INTEGER NOT NULL,
    "stateId" INTEGER NOT NULL,
    "countryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "moduleId" INTEGER NOT NULL,
    "canCreate" BOOLEAN NOT NULL DEFAULT false,
    "canView" BOOLEAN NOT NULL DEFAULT false,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "canDelete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseVoucherItem" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesVoucherItem" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SalesVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDataVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "narration" TEXT,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StockDataVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockTransferVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "fromWarehouseId" INTEGER NOT NULL,
    "toWarehouseId" INTEGER NOT NULL,
    "fromWarehouseName" TEXT,
    "toWarehouseName" TEXT,
    "createdById" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "narration" TEXT,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "StockTransferVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContraVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "fromPaymentMethodId" INTEGER NOT NULL,
    "toPaymentMethodId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContraVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseReturnVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseReturnVoucherItem" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PurchaseReturnVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturnVoucher" (
    "id" SERIAL NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "branchId" INTEGER NOT NULL,
    "paymentMethodId" INTEGER NOT NULL,
    "createdById" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "narration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReturnVoucher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturnVoucherItem" (
    "id" SERIAL NOT NULL,
    "voucherId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SalesReturnVoucherItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_barcode_key" ON "Product"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Module_name_key" ON "Module"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_roleId_moduleId_key" ON "Permission"("roleId", "moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseVoucher_voucherNo_key" ON "PurchaseVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesVoucher_voucherNo_key" ON "SalesVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "StockDataVoucher_voucherNo_key" ON "StockDataVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "StockTransferVoucher_voucherNo_key" ON "StockTransferVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "ContraVoucher_voucherNo_key" ON "ContraVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptVoucher_voucherNo_key" ON "ReceiptVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentVoucher_voucherNo_key" ON "PaymentVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseReturnVoucher_voucherNo_key" ON "PurchaseReturnVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "SalesReturnVoucher_voucherNo_key" ON "SalesReturnVoucher"("voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "AreaMaster_name_cityId_key" ON "AreaMaster"("name", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMaster_name_key" ON "CategoryMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CityMaster_name_stateId_key" ON "CityMaster"("name", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "CountryMaster_name_key" ON "CountryMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodMaster_name_key" ON "PaymentMethodMaster"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StateMaster_name_countryId_key" ON "StateMaster"("name", "countryId");

-- AddForeignKey
ALTER TABLE "WarehouseMaster" ADD CONSTRAINT "WarehouseMaster_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WarehouseMaster" ADD CONSTRAINT "WarehouseMaster_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseVoucher" ADD CONSTRAINT "PurchaseVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseVoucher" ADD CONSTRAINT "PurchaseVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseVoucher" ADD CONSTRAINT "PurchaseVoucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseVoucher" ADD CONSTRAINT "PurchaseVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseVoucherItem" ADD CONSTRAINT "PurchaseVoucherItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseVoucherItem" ADD CONSTRAINT "PurchaseVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "PurchaseVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVoucher" ADD CONSTRAINT "SalesVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVoucher" ADD CONSTRAINT "SalesVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVoucher" ADD CONSTRAINT "SalesVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVoucher" ADD CONSTRAINT "SalesVoucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVoucherItem" ADD CONSTRAINT "SalesVoucherItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesVoucherItem" ADD CONSTRAINT "SalesVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "SalesVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDataVoucher" ADD CONSTRAINT "StockDataVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDataVoucher" ADD CONSTRAINT "StockDataVoucher_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDataVoucher" ADD CONSTRAINT "StockDataVoucher_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "WarehouseMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferVoucher" ADD CONSTRAINT "StockTransferVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferVoucher" ADD CONSTRAINT "StockTransferVoucher_fromWarehouseId_fkey" FOREIGN KEY ("fromWarehouseId") REFERENCES "WarehouseMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferVoucher" ADD CONSTRAINT "StockTransferVoucher_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockTransferVoucher" ADD CONSTRAINT "StockTransferVoucher_toWarehouseId_fkey" FOREIGN KEY ("toWarehouseId") REFERENCES "WarehouseMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContraVoucher" ADD CONSTRAINT "ContraVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContraVoucher" ADD CONSTRAINT "ContraVoucher_fromPaymentMethodId_fkey" FOREIGN KEY ("fromPaymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContraVoucher" ADD CONSTRAINT "ContraVoucher_toPaymentMethodId_fkey" FOREIGN KEY ("toPaymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptVoucher" ADD CONSTRAINT "ReceiptVoucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentVoucher" ADD CONSTRAINT "PaymentVoucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnVoucher" ADD CONSTRAINT "PurchaseReturnVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnVoucher" ADD CONSTRAINT "PurchaseReturnVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnVoucher" ADD CONSTRAINT "PurchaseReturnVoucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnVoucher" ADD CONSTRAINT "PurchaseReturnVoucher_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnVoucherItem" ADD CONSTRAINT "PurchaseReturnVoucherItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseReturnVoucherItem" ADD CONSTRAINT "PurchaseReturnVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "PurchaseReturnVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnVoucher" ADD CONSTRAINT "SalesReturnVoucher_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnVoucher" ADD CONSTRAINT "SalesReturnVoucher_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnVoucher" ADD CONSTRAINT "SalesReturnVoucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnVoucher" ADD CONSTRAINT "SalesReturnVoucher_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethodMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnVoucherItem" ADD CONSTRAINT "SalesReturnVoucherItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturnVoucherItem" ADD CONSTRAINT "SalesReturnVoucherItem_voucherId_fkey" FOREIGN KEY ("voucherId") REFERENCES "SalesReturnVoucher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
