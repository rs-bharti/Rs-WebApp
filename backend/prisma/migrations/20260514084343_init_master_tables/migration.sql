-- CreateTable
CREATE TABLE "CustomerMaster" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "CustomerMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AreaMaster" (
    "id" SERIAL NOT NULL,
    "areaName" TEXT NOT NULL,
    "city" TEXT NOT NULL,

    CONSTRAINT "AreaMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CityMaster" (
    "id" SERIAL NOT NULL,
    "cityName" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,

    CONSTRAINT "CityMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateMaster" (
    "id" SERIAL NOT NULL,
    "stateName" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,

    CONSTRAINT "StateMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethodMaster" (
    "id" SERIAL NOT NULL,
    "methodName" TEXT NOT NULL,

    CONSTRAINT "PaymentMethodMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierMaster" (
    "id" SERIAL NOT NULL,
    "supplierName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL,

    CONSTRAINT "SupplierMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMaster" (
    "id" SERIAL NOT NULL,
    "productName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "lowestPrice" TEXT NOT NULL,

    CONSTRAINT "ProductMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryMaster" (
    "id" SERIAL NOT NULL,
    "categoryName" TEXT NOT NULL,

    CONSTRAINT "CategoryMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnitMaster" (
    "id" SERIAL NOT NULL,
    "unitName" TEXT NOT NULL,

    CONSTRAINT "UnitMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BranchMaster" (
    "id" SERIAL NOT NULL,
    "branchName" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "countryName" TEXT NOT NULL,

    CONSTRAINT "BranchMaster_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerMaster_address_key" ON "CustomerMaster"("address");
