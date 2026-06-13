/**
 * clean-branches.js
 * ==================
 * This script:
 *   1. Lists all branches in the database
 *   2. Deletes branches with IDs you specify in BRANCH_IDS_TO_DELETE
 *
 * HOW TO USE:
 *   Step 1 - First run to see all branches:
 *     node clean-branches.js --list
 *
 *   Step 2 - Edit the BRANCH_IDS_TO_DELETE array below with the IDs you want to remove
 *
 *   Step 3 - Run to delete them:
 *     node clean-branches.js --delete
 *
 * !! IMPORTANT: Only branches that have NO voucher/user references can be deleted.
 * !! The script will safely skip any branch that is still referenced.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────
// EDIT THIS: Put the IDs of branches you want to DELETE
// Leave empty [] to just list without deleting
// ─────────────────────────────────────────────────────────────────────
const BRANCH_IDS_TO_DELETE = [
  // Example: 5, 6, 7, 8   ← replace with actual IDs of duplicates/Dubai
];
// ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const mode = args[0]; // --list or --delete

async function listBranches() {
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
    console.log(`  ID ${String(b.id).padEnd(4)} "${b.name}" — ${loc || 'no location'}`);
  });
  console.log(`\nTotal: ${branches.length} branch(es)`);
  console.log('\nTo delete branches, add their IDs to BRANCH_IDS_TO_DELETE in this file,');
  console.log('then run: node clean-branches.js --delete\n');
}

async function deleteBranches() {
  if (BRANCH_IDS_TO_DELETE.length === 0) {
    console.log('\nNo branch IDs specified in BRANCH_IDS_TO_DELETE. Nothing deleted.\n');
    return;
  }

  console.log(`\nAttempting to delete branches: [${BRANCH_IDS_TO_DELETE.join(', ')}]\n`);

  for (const id of BRANCH_IDS_TO_DELETE) {
    try {
      const branch = await prisma.branch.findUnique({ where: { id: Number(id) }, select: { name: true } });
      if (!branch) {
        console.log(`  ⚠  ID ${id}: Not found — skipping.`);
        continue;
      }
      await prisma.branch.delete({ where: { id: Number(id) } });
      console.log(`  ✓  ID ${id}: "${branch.name}" — DELETED`);
    } catch (err) {
      if (err.code === 'P2003' || err.code === 'P2025') {
        console.log(`  ✗  ID ${id}: Cannot delete — still referenced by users/vouchers.`);
      } else {
        console.log(`  ✗  ID ${id}: Error — ${err.message}`);
      }
    }
  }

  console.log('\nDone. Run --list to verify remaining branches.\n');
}

async function main() {
  if (!mode || mode === '--list') {
    await listBranches();
  } else if (mode === '--delete') {
    await listBranches();
    await deleteBranches();
  } else {
    console.log('Usage: node clean-branches.js --list | --delete');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
