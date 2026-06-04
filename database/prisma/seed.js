const path = require('path');

const { PrismaClient } = require(path.resolve(__dirname, '../../backend/node_modules/@prisma/client'));
const bcrypt = require(path.resolve(__dirname, '../../backend/node_modules/bcryptjs'));
const { Country, State, City } = require(path.resolve(__dirname, '../../backend/node_modules/country-state-city'));

const prisma = new PrismaClient();
const BATCH  = 500;

async function batchInsert(model, data) {
  for (let i = 0; i < data.length; i += BATCH) {
    await prisma[model].createMany({ data: data.slice(i, i + BATCH), skipDuplicates: true });
  }
}

// Safe upsert for models with @@unique([name, branchId]) where branchId is null
async function upsertByName(model, name, extra = {}) {
  const existing = await prisma[model].findFirst({ where: { name, branchId: null } });
  if (!existing) await prisma[model].create({ data: { name, ...extra } });
  return existing || await prisma[model].findFirst({ where: { name, branchId: null } });
}

async function main() {
  console.log('Seeding database...');

  // ── 1. Roles ──────────────────────────────────────────────────────────────────
  await prisma.role.upsert({ where: { name: 'admin' }, update: {}, create: { name: 'admin' } });
  await prisma.role.upsert({ where: { name: 'user'  }, update: {}, create: { name: 'user'  } });
  const adminRole = await prisma.role.findUnique({ where: { name: 'admin' } });

  // ── 2. Countries (skip if already seeded) ─────────────────────────────────────
  const countryCount = await prisma.countryMaster.count();
  if (countryCount < 100) {
    console.log('  Seeding countries...');
    const allCountries = Country.getAllCountries();
    await batchInsert('countryMaster', allCountries.map(c => ({
      name: c.name, phoneCode: c.phonecode, currency: c.currency,
    })));
    console.log(`  ✓ ${allCountries.length} countries`);
  } else {
    console.log(`  ✓ Countries already seeded (${countryCount})`);
  }

  // ── 3. States (skip if already seeded) ────────────────────────────────────────
  const stateCount = await prisma.stateMaster.count();
  if (stateCount < 100) {
    console.log('  Seeding states...');
    const allCountries = Country.getAllCountries();
    const dbCountries  = await prisma.countryMaster.findMany({ select: { id: true, name: true } });
    const countryMap   = Object.fromEntries(dbCountries.map(c => [c.name, c.id]));

    const stateRows = [];
    const stateSeen = new Set();
    for (const c of allCountries) {
      const countryId = countryMap[c.name];
      if (!countryId) continue;
      for (const s of State.getStatesOfCountry(c.isoCode)) {
        const key = `${s.name}|${countryId}`;
        if (!stateSeen.has(key)) { stateSeen.add(key); stateRows.push({ name: s.name, countryId }); }
      }
    }
    await batchInsert('stateMaster', stateRows);
    console.log(`  ✓ ${stateRows.length} states`);
  } else {
    console.log(`  ✓ States already seeded (${stateCount})`);
  }

  // ── 4. Cities (skip if already seeded) ────────────────────────────────────────
  const cityCount = await prisma.cityMaster.count();
  if (cityCount < 1000) {
    console.log('  Seeding cities (this takes a few minutes)...');
    const allCountries = Country.getAllCountries();
    const dbCountries  = await prisma.countryMaster.findMany({ select: { id: true, name: true } });
    const countryMap   = Object.fromEntries(dbCountries.map(c => [c.name, c.id]));
    const dbStates     = await prisma.stateMaster.findMany({ select: { id: true, name: true, countryId: true } });
    const stateMap     = Object.fromEntries(dbStates.map(s => [`${s.name}|${s.countryId}`, s.id]));

    const cityRows = [];
    const citySeen = new Set();
    for (const c of allCountries) {
      const countryId = countryMap[c.name];
      if (!countryId) continue;
      for (const s of State.getStatesOfCountry(c.isoCode)) {
        const stateId = stateMap[`${s.name}|${countryId}`];
        if (!stateId) continue;
        for (const city of City.getCitiesOfState(c.isoCode, s.isoCode)) {
          const key = `${city.name}|${stateId}`;
          if (!citySeen.has(key)) { citySeen.add(key); cityRows.push({ name: city.name, stateId }); }
        }
      }
    }
    let inserted = 0;
    for (let i = 0; i < cityRows.length; i += BATCH) {
      await prisma.cityMaster.createMany({ data: cityRows.slice(i, i + BATCH), skipDuplicates: true });
      inserted += Math.min(BATCH, cityRows.length - i);
      if (inserted % 10000 === 0) console.log(`    … ${inserted} cities`);
    }
    console.log(`  ✓ ${cityRows.length} cities`);
  } else {
    console.log(`  ✓ Cities already seeded (${cityCount})`);
  }

  // ── 5. India defaults ─────────────────────────────────────────────────────────
  const india  = await prisma.countryMaster.findUnique({ where: { name: 'India' } });
  const maha   = await prisma.stateMaster.findFirst({ where: { name: 'Maharashtra', countryId: india.id } });
  const mumbai = await prisma.cityMaster.findFirst({ where: { name: 'Mumbai', stateId: maha.id } });

  // ── 6. Branches ───────────────────────────────────────────────────────────────
  for (let i = 0; i < 25; i++) {
    await prisma.branch.upsert({
      where:  { id: i + 1 },
      update: { name: `Branch ${i + 1}` },
      create: { id: i + 1, name: `Branch ${i + 1}`, cityId: mumbai.id, stateId: maha.id, countryId: india.id, area: 'Andheri' },
    });
  }
  const branch = await prisma.branch.findFirst({ where: { id: 1 } });

  // ── 7. Admin users ────────────────────────────────────────────────────────────
  const pwd = await bcrypt.hash('admin123', 10);
  for (const email of ['admin@gmail.com', 'admin@rsbharti.com']) {
    await prisma.user.upsert({
      where:  { email },
      update: { password: pwd, plainPassword: 'admin123', branchId: branch.id, roleId: adminRole.id },
      create: { name: 'Admin', email, password: pwd, plainPassword: 'admin123', roleId: adminRole.id, branchId: branch.id, permissions: '{}' },
    });
  }

  // ── 8. Category + Units ───────────────────────────────────────────────────────
  // CategoryMaster now has @@unique([name, branchId]) — use findFirst+create pattern
  const cat = await upsertByName('categoryMaster', 'Stationery');
  await prisma.unitMaster.upsert({
    where:  { id: 1 },
    update: { unitName: 'Pieces', shortName: 'Pcs' },
    create: { id: 1, unitName: 'Pieces', shortName: 'Pcs' },
  });
  const unit = await prisma.unitMaster.findFirst({ where: { id: 1 } });

  // ── 9. Payment Methods ────────────────────────────────────────────────────────
  // PaymentMethodMaster also has @@unique([name, branchId])
  for (const name of ['Cash', 'Bank Transfer', 'Cheque', 'UPI', 'Credit Card', 'Debit Card']) {
    await upsertByName('paymentMethodMaster', name);
  }

  // ── 10. Sample data ───────────────────────────────────────────────────────────
  await prisma.supplier.upsert({
    where:  { id: 1 },
    update: { cityId: mumbai.id, stateId: maha.id, countryId: india.id },
    create: { id: 1, name: 'Elite Paper Supplies', phone: '9876543210', email: 'contact@elitepaper.com', cityId: mumbai.id, stateId: maha.id, countryId: india.id, area: 'Andheri' },
  });
  await prisma.customer.upsert({
    where:  { id: 1 },
    update: {},
    create: { id: 1, name: 'Walk-in Customer', phone: '9999999999', cityId: mumbai.id, stateId: maha.id, countryId: india.id },
  });
  await prisma.product.upsert({
    where:  { barcode: 'NB-001' },
    update: {},
    create: { name: 'Premium Leather Notebook', categoryId: cat.id, unitId: unit.id, purchasePrice: 450, sellingPrice: 799, barcode: 'NB-001' },
  });
  await prisma.product.upsert({
    where:  { barcode: 'INK-002' },
    update: {},
    create: { name: 'Archival Grade Blue Ink', categoryId: cat.id, unitId: unit.id, purchasePrice: 200, sellingPrice: 350, barcode: 'INK-002' },
  });
  await prisma.warehouseMaster.upsert({
    where:  { id: 1 },
    update: {},
    create: { id: 1, name: 'Main Warehouse', address: 'Mumbai, Maharashtra', cityId: mumbai.id, area: 'Andheri' },
  });

  console.log('\n✓ Seed complete!');
  console.log('  admin@gmail.com / admin123');
  console.log('  admin@rsbharti.com / admin123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
