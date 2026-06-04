-- Add denormalized cityName, stateName, countryName to Customer and Supplier
-- so the names are stored directly in the row without needing joins.

-- ── Customer ──────────────────────────────────────────────────────────────────
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "cityName"    TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "stateName"   TEXT;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "countryName" TEXT;

-- Backfill existing rows (PostgreSQL multi-table UPDATE syntax)
UPDATE "Customer"
SET
  "cityName"    = cm.name,
  "stateName"   = sm.name,
  "countryName" = co.name
FROM "CityMaster"    cm,
     "StateMaster"   sm,
     "CountryMaster" co
WHERE cm.id = "Customer"."cityId"
  AND sm.id = "Customer"."stateId"
  AND co.id = "Customer"."countryId"
  AND "Customer"."cityName" IS NULL;

-- ── Supplier ──────────────────────────────────────────────────────────────────
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "cityName"    TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "stateName"   TEXT;
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "countryName" TEXT;

-- Backfill existing rows (PostgreSQL multi-table UPDATE syntax)
UPDATE "Supplier"
SET
  "cityName"    = cm.name,
  "stateName"   = sm.name,
  "countryName" = co.name
FROM "CityMaster"    cm,
     "StateMaster"   sm,
     "CountryMaster" co
WHERE cm.id = "Supplier"."cityId"
  AND sm.id = "Supplier"."stateId"
  AND co.id = "Supplier"."countryId"
  AND "Supplier"."cityName" IS NULL;
