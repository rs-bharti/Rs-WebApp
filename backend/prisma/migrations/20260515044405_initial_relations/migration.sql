/*
  Warnings:

  - You are about to drop the column `city` on the `AreaMaster` table. All the data in the column will be lost.
  - You are about to drop the column `countryName` on the `BranchMaster` table. All the data in the column will be lost.
  - You are about to drop the column `stateName` on the `BranchMaster` table. All the data in the column will be lost.
  - You are about to drop the column `stateName` on the `CityMaster` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `CustomerMaster` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `CustomerMaster` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `CustomerMaster` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `ProductMaster` table. All the data in the column will be lost.
  - You are about to drop the column `supplier` on the `ProductMaster` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `ProductMaster` table. All the data in the column will be lost.
  - You are about to drop the column `countryName` on the `StateMaster` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `SupplierMaster` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `SupplierMaster` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `SupplierMaster` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[areaName,cityId]` on the table `AreaMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[branchName]` on the table `BranchMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryName]` on the table `CategoryMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cityName,stateId]` on the table `CityMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[methodName]` on the table `PaymentMethodMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stateName,countryId]` on the table `StateMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[supplierName]` on the table `SupplierMaster` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[unitName]` on the table `UnitMaster` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cityId` to the `AreaMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `AreaMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateId` to the `BranchMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `BranchMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CategoryMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateId` to the `CityMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CityMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cityId` to the `CustomerMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `CustomerMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateId` to the `CustomerMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `CustomerMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `PaymentMethodMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `categoryId` to the `ProductMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `supplierId` to the `ProductMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unitId` to the `ProductMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProductMaster` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `lowestPrice` on the `ProductMaster` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `countryId` to the `StateMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StateMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cityId` to the `SupplierMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `countryId` to the `SupplierMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stateId` to the `SupplierMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `SupplierMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `UnitMaster` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "CustomerMaster_address_key";

-- AlterTable
ALTER TABLE "AreaMaster" DROP COLUMN "city",
ADD COLUMN     "cityId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "BranchMaster" DROP COLUMN "countryName",
DROP COLUMN "stateName",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stateId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CategoryMaster" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CityMaster" DROP COLUMN "stateName",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stateId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "CustomerMaster" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "state",
ADD COLUMN     "areaId" INTEGER,
ADD COLUMN     "cityId" INTEGER NOT NULL,
ADD COLUMN     "countryId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stateId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "PaymentMethodMaster" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "ProductMaster" DROP COLUMN "category",
DROP COLUMN "supplier",
DROP COLUMN "unit",
ADD COLUMN     "categoryId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "supplierId" INTEGER NOT NULL,
ADD COLUMN     "unitId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "lowestPrice",
ADD COLUMN     "lowestPrice" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "StateMaster" DROP COLUMN "countryName",
ADD COLUMN     "countryId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "SupplierMaster" DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "state",
ADD COLUMN     "cityId" INTEGER NOT NULL,
ADD COLUMN     "countryId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stateId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UnitMaster" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "branchId" INTEGER,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "CountryMaster" (
    "id" SERIAL NOT NULL,
    "countryName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CountryMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CountryMaster_countryName_key" ON "CountryMaster"("countryName");

-- CreateIndex
CREATE UNIQUE INDEX "AreaMaster_areaName_cityId_key" ON "AreaMaster"("areaName", "cityId");

-- CreateIndex
CREATE UNIQUE INDEX "BranchMaster_branchName_key" ON "BranchMaster"("branchName");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryMaster_categoryName_key" ON "CategoryMaster"("categoryName");

-- CreateIndex
CREATE UNIQUE INDEX "CityMaster_cityName_stateId_key" ON "CityMaster"("cityName", "stateId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentMethodMaster_methodName_key" ON "PaymentMethodMaster"("methodName");

-- CreateIndex
CREATE UNIQUE INDEX "StateMaster_stateName_countryId_key" ON "StateMaster"("stateName", "countryId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierMaster_supplierName_key" ON "SupplierMaster"("supplierName");

-- CreateIndex
CREATE UNIQUE INDEX "UnitMaster_unitName_key" ON "UnitMaster"("unitName");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "BranchMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StateMaster" ADD CONSTRAINT "StateMaster_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CityMaster" ADD CONSTRAINT "CityMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AreaMaster" ADD CONSTRAINT "AreaMaster_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BranchMaster" ADD CONSTRAINT "BranchMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMaster" ADD CONSTRAINT "CustomerMaster_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMaster" ADD CONSTRAINT "CustomerMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMaster" ADD CONSTRAINT "CustomerMaster_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMaster" ADD CONSTRAINT "CustomerMaster_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "AreaMaster"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaster" ADD CONSTRAINT "SupplierMaster_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "CountryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaster" ADD CONSTRAINT "SupplierMaster_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "StateMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierMaster" ADD CONSTRAINT "SupplierMaster_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "CityMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaster" ADD CONSTRAINT "ProductMaster_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CategoryMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaster" ADD CONSTRAINT "ProductMaster_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "SupplierMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMaster" ADD CONSTRAINT "ProductMaster_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "UnitMaster"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
