-- ============================================================
-- Remove AreaMaster: replace areaId FK with free-text area field
-- on Branch, Supplier, Customer, WarehouseMaster.
-- Add phoneCode/currency columns to CountryMaster if missing.
-- ============================================================

-- ── 1. CountryMaster: add phoneCode / currency if not present ─────────────────
ALTER TABLE "CountryMaster" ADD COLUMN IF NOT EXISTS "phoneCode" TEXT;
ALTER TABLE "CountryMaster" ADD COLUMN IF NOT EXISTS "currency"  TEXT;

-- ── 2. Add free-text area column to all affected tables ──────────────────────

ALTER TABLE "Branch"          ADD COLUMN IF NOT EXISTS "area" TEXT;
ALTER TABLE "Supplier"        ADD COLUMN IF NOT EXISTS "area" TEXT;
ALTER TABLE "Customer"        ADD COLUMN IF NOT EXISTS "area" TEXT;
ALTER TABLE "WarehouseMaster" ADD COLUMN IF NOT EXISTS "area" TEXT;

-- ── 3. Copy existing area names into the new text column (best-effort) ────────

UPDATE "Branch" b
SET "area" = a.name
FROM "AreaMaster" a
WHERE b."areaId" = a.id AND b."area" IS NULL;

UPDATE "Supplier" s
SET "area" = a.name
FROM "AreaMaster" a
WHERE s."areaId" = a.id AND s."area" IS NULL;

UPDATE "Customer" c
SET "area" = a.name
FROM "AreaMaster" a
WHERE c."areaId" = a.id AND c."area" IS NULL;

UPDATE "WarehouseMaster" w
SET "area" = a.name
FROM "AreaMaster" a
WHERE w."areaId" = a.id AND w."area" IS NULL;

-- ── 4. Drop FK constraints on areaId (use IF EXISTS via DO block) ─────────────

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Branch_areaId_fkey') THEN
    ALTER TABLE "Branch" DROP CONSTRAINT "Branch_areaId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Supplier_areaId_fkey') THEN
    ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_areaId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Customer_areaId_fkey') THEN
    ALTER TABLE "Customer" DROP CONSTRAINT "Customer_areaId_fkey";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'WarehouseMaster_areaId_fkey') THEN
    ALTER TABLE "WarehouseMaster" DROP CONSTRAINT "WarehouseMaster_areaId_fkey";
  END IF;
END $$;

-- ── 5. Drop the old areaId columns ───────────────────────────────────────────

ALTER TABLE "Branch"          DROP COLUMN IF EXISTS "areaId";
ALTER TABLE "Supplier"        DROP COLUMN IF EXISTS "areaId";
ALTER TABLE "Customer"        DROP COLUMN IF EXISTS "areaId";
ALTER TABLE "WarehouseMaster" DROP COLUMN IF EXISTS "areaId";

-- ── 6. Drop the AreaMaster table (after all FKs are gone) ────────────────────

DROP TABLE IF EXISTS "AreaMaster" CASCADE;
