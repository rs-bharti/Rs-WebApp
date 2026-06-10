/**
 * One-time fix: reset PostgreSQL auto-increment sequences for tables
 * that were seeded with explicit IDs. Run once with:
 *   node backend/fix-sequences.js
 */
const path = require('path');
const { PrismaClient } = require(path.resolve(__dirname, 'node_modules/@prisma/client'));

const prisma = new PrismaClient();

const TABLES = [
  'Branch',
  'UnitMaster',
  'Supplier',
  'Customer',
  'WarehouseMaster',
  'Role',
  'CountryMaster',
  'StateMaster',
  'CityMaster',
];

async function main() {
  console.log('Resetting PostgreSQL sequences…\n');
  for (const table of TABLES) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
      );
      const rows = await prisma.$queryRawUnsafe(`SELECT MAX(id) AS max FROM "${table}"`);
      console.log(`  ✓  ${table.padEnd(18)} → next id will be ${Number(rows[0].max) + 1}`);
    } catch (e) {
      console.log(`  ✗  ${table.padEnd(18)} skipped: ${e.message}`);
    }
  }
  console.log('\n✓ Done — you can now create records without sequence conflicts.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
