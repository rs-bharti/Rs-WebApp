-- Create ContactPerson table for storing contact persons linked to Customer or Supplier

CREATE TABLE IF NOT EXISTS "ContactPerson" (
  "id"          SERIAL PRIMARY KEY,
  "name"        TEXT             NOT NULL,
  "phone"       TEXT,
  "designation" TEXT,
  "dob"         TEXT,
  "customerId"  INTEGER,
  "supplierId"  INTEGER,
  "createdAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContactPerson_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "Customer"("id")
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ContactPerson_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);
