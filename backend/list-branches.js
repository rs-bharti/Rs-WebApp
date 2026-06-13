/**
 * list-branches.js
 * Run: node list-branches.js
 * Lists all branches with their IDs so you can identify which to delete.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      city:    { select: { name: true } },
      state:   { select: { name: true } },
      country: { select: { name: true } },
    },
  });

  console.log('\n=== ALL BRANCHES IN DATABASE ===\n');
  branches.forEach(b => {
    const loc = [b.city?.name, b.state?.name, b.country?.name].filter(Boolean).join(', ');
    console.log(`ID ${b.id}: "${b.name}" — ${loc || 'no location'}`);
  });
  console.log(`\nTotal: ${branches.length} branch(es)\n`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
