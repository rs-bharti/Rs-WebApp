-- ============================================================
-- Add denormalized name fields to all voucher tables
-- Create items tables for StockDataVoucher and StockTransferVoucher
-- Migrate existing flat product data into the new items tables
-- ============================================================

-- ── 1. PurchaseVoucher: add supplierName, paymentMethodName, warehouseId, warehouseName ──

ALTER TABLE "PurchaseVoucher" ADD COLUMN IF NOT EXISTS "supplierName"      TEXT;
ALTER TABLE "PurchaseVoucher" ADD COLUMN IF NOT EXISTS "paymentMethodName" TEXT;
ALTER TABLE "PurchaseVoucher" ADD COLUMN IF NOT EXISTS "warehouseId"       INTEGER;
ALTER TABLE "PurchaseVoucher" ADD COLUMN IF NOT EXISTS "warehouseName"     TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PurchaseVoucher_warehouseId_fkey'
  ) THEN
    ALTER TABLE "PurchaseVoucher"
      ADD CONSTRAINT "PurchaseVoucher_warehouseId_fkey"
      FOREIGN KEY ("warehouseId") REFERENCES "WarehouseMaster"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 2. PurchaseVoucherItem: add productName ───────────────────────────────────

ALTER TABLE "PurchaseVoucherItem" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- ── 3. SalesVoucher: add paymentMethodName ────────────────────────────────────

ALTER TABLE "SalesVoucher" ADD COLUMN IF NOT EXISTS "paymentMethodName" TEXT;

-- ── 4. PurchaseReturnVoucher: add supplierName, paymentMethodName, warehouseId, warehouseName ──

ALTER TABLE "PurchaseReturnVoucher" ADD COLUMN IF NOT EXISTS "supplierName"      TEXT;
ALTER TABLE "PurchaseReturnVoucher" ADD COLUMN IF NOT EXISTS "paymentMethodName" TEXT;
ALTER TABLE "PurchaseReturnVoucher" ADD COLUMN IF NOT EXISTS "warehouseId"       INTEGER;
ALTER TABLE "PurchaseReturnVoucher" ADD COLUMN IF NOT EXISTS "warehouseName"     TEXT;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'PurchaseReturnVoucher_warehouseId_fkey'
  ) THEN
    ALTER TABLE "PurchaseReturnVoucher"
      ADD CONSTRAINT "PurchaseReturnVoucher_warehouseId_fkey"
      FOREIGN KEY ("warehouseId") REFERENCES "WarehouseMaster"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ── 5. PurchaseReturnVoucherItem: add productName ─────────────────────────────

ALTER TABLE "PurchaseReturnVoucherItem" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- ── 6. SalesReturnVoucher: add customerName, paymentMethodName ────────────────

ALTER TABLE "SalesReturnVoucher" ADD COLUMN IF NOT EXISTS "customerName"      TEXT;
ALTER TABLE "SalesReturnVoucher" ADD COLUMN IF NOT EXISTS "paymentMethodName" TEXT;

-- ── 7. SalesReturnVoucherItem: add productName ────────────────────────────────

ALTER TABLE "SalesReturnVoucherItem" ADD COLUMN IF NOT EXISTS "productName" TEXT;

-- ── 8. StockDataVoucher: add warehouseName ────────────────────────────────────

ALTER TABLE "StockDataVoucher" ADD COLUMN IF NOT EXISTS "warehouseName" TEXT;

-- ── 9. Create StockDataVoucherItem table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "StockDataVoucherItem" (
  "id"          SERIAL PRIMARY KEY,
  "voucherId"   INTEGER          NOT NULL,
  "productId"   INTEGER          NOT NULL,
  "productName" TEXT,
  "qty"         DOUBLE PRECISION NOT NULL,
  CONSTRAINT "StockDataVoucherItem_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "StockDataVoucher"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockDataVoucherItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Migrate existing flat product data into StockDataVoucherItem (safe: skips already-migrated rows)
INSERT INTO "StockDataVoucherItem" ("voucherId", "productId", "qty")
SELECT sdv."id", sdv."productId", sdv."qty"
FROM   "StockDataVoucher" sdv
WHERE  sdv."productId" IS NOT NULL
  AND  NOT EXISTS (
    SELECT 1 FROM "StockDataVoucherItem" i WHERE i."voucherId" = sdv."id"
  );

-- Drop old flat columns from StockDataVoucher
ALTER TABLE "StockDataVoucher" DROP COLUMN IF EXISTS "productId";
ALTER TABLE "StockDataVoucher" DROP COLUMN IF EXISTS "qty";

-- ── 10. Create StockTransferVoucherItem table ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "StockTransferVoucherItem" (
  "id"          SERIAL PRIMARY KEY,
  "voucherId"   INTEGER          NOT NULL,
  "productId"   INTEGER          NOT NULL,
  "productName" TEXT,
  "qty"         DOUBLE PRECISION NOT NULL,
  CONSTRAINT "StockTransferVoucherItem_voucherId_fkey"
    FOREIGN KEY ("voucherId") REFERENCES "StockTransferVoucher"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "StockTransferVoucherItem_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "Product"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Migrate existing flat product data into StockTransferVoucherItem (safe: skips already-migrated rows)
INSERT INTO "StockTransferVoucherItem" ("voucherId", "productId", "qty")
SELECT stv."id", stv."productId", stv."qty"
FROM   "StockTransferVoucher" stv
WHERE  stv."productId" IS NOT NULL
  AND  NOT EXISTS (
    SELECT 1 FROM "StockTransferVoucherItem" i WHERE i."voucherId" = stv."id"
  );

-- Drop old flat columns from StockTransferVoucher
ALTER TABLE "StockTransferVoucher" DROP COLUMN IF EXISTS "productId";
ALTER TABLE "StockTransferVoucher" DROP COLUMN IF EXISTS "qty";
