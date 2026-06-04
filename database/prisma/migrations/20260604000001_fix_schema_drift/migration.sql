-- ============================================================
-- Fix schema drift: renames done via db push are now in migrations
-- Uses IF EXISTS / IF NOT EXISTS so it is safe to run on any DB state
-- ============================================================

-- ── 1. Rename old column names → "name" ──────────────────────────────────────

-- PaymentMethodMaster: methodName → name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'PaymentMethodMaster' AND column_name = 'methodName') THEN
    ALTER TABLE "PaymentMethodMaster" RENAME COLUMN "methodName" TO "name";
  END IF;
END $$;

-- CategoryMaster: categoryName → name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CategoryMaster' AND column_name = 'categoryName') THEN
    ALTER TABLE "CategoryMaster" RENAME COLUMN "categoryName" TO "name";
  END IF;
END $$;

-- AreaMaster: areaName → name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'AreaMaster' AND column_name = 'areaName') THEN
    ALTER TABLE "AreaMaster" RENAME COLUMN "areaName" TO "name";
  END IF;
END $$;

-- CityMaster: cityName → name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CityMaster' AND column_name = 'cityName') THEN
    ALTER TABLE "CityMaster" RENAME COLUMN "cityName" TO "name";
  END IF;
END $$;

-- StateMaster: stateName → name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'StateMaster' AND column_name = 'stateName') THEN
    ALTER TABLE "StateMaster" RENAME COLUMN "stateName" TO "name";
  END IF;
END $$;

-- CountryMaster: countryName → name
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'CountryMaster' AND column_name = 'countryName') THEN
    ALTER TABLE "CountryMaster" RENAME COLUMN "countryName" TO "name";
  END IF;
END $$;

-- UnitMaster: keep unitName as-is (schema still uses unitName)

-- ── 2. Add branchId to PaymentMethodMaster if missing ────────────────────────
ALTER TABLE "PaymentMethodMaster" ADD COLUMN IF NOT EXISTS "branchId" INTEGER;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PaymentMethodMaster_branchId_fkey'
  ) THEN
    ALTER TABLE "PaymentMethodMaster"
      ADD CONSTRAINT "PaymentMethodMaster_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 3. Add missing columns to StockTransferVoucher ───────────────────────────
ALTER TABLE "StockTransferVoucher" ADD COLUMN IF NOT EXISTS "fromWarehouseName" TEXT;
ALTER TABLE "StockTransferVoucher" ADD COLUMN IF NOT EXISTS "toWarehouseName"   TEXT;

-- ── 4. Fix unique constraints on PaymentMethodMaster ─────────────────────────
-- Drop old single-column unique index if it still exists
DROP INDEX IF EXISTS "PaymentMethodMaster_methodName_key";
DROP INDEX IF EXISTS "PaymentMethodMaster_name_key";

-- Add composite unique if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PaymentMethodMaster_name_branchId_key'
  ) THEN
    ALTER TABLE "PaymentMethodMaster"
      ADD CONSTRAINT "PaymentMethodMaster_name_branchId_key" UNIQUE ("name", "branchId");
  END IF;
END $$;
