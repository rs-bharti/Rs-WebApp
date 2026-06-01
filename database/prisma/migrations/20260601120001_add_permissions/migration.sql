-- AlterTable: add permissions column to User with default value
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissions" TEXT NOT NULL DEFAULT '{}';
