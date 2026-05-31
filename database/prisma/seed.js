const path = require('path');

// Both @prisma/client and bcryptjs live in backend/node_modules.
// The Prisma schema output directive also points there.
const { PrismaClient } = require(path.resolve(__dirname, '../../backend/node_modules/@prisma/client'));
const bcrypt = require(path.resolve(__dirname, '../../backend/node_modules/bcryptjs'));

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: { name: 'admin' },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: { name: 'user' },
  });

  // 2. Locations
  const country = await prisma.countryMaster.upsert({
    where: { name: 'India' },
    update: {},
    create: { name: 'India' },
  });

  const state = await prisma.stateMaster.upsert({
    where: { name_countryId: { name: 'Maharashtra', countryId: country.id } },
    update: {},
    create: { name: 'Maharashtra', countryId: country.id },
  });

  const city = await prisma.cityMaster.upsert({
    where: { name_stateId: { name: 'Mumbai', stateId: state.id } },
    update: {},
    create: { name: 'Mumbai', stateId: state.id },
  });

  const area = await prisma.areaMaster.upsert({
    where: { name_cityId: { name: 'Andheri', cityId: city.id } },
    update: {},
    create: { name: 'Andheri', cityId: city.id },
  });

  // 3. Branches (25 branches)
  const branchNames = [
    'Main Branch - Mumbai',   'Branch 2 - Delhi',        'Branch 3 - Bangalore',
    'Branch 4 - Chennai',     'Branch 5 - Hyderabad',    'Branch 6 - Pune',
    'Branch 7 - Kolkata',     'Branch 8 - Ahmedabad',    'Branch 9 - Jaipur',
    'Branch 10 - Surat',      'Branch 11 - Lucknow',     'Branch 12 - Kanpur',
    'Branch 13 - Nagpur',     'Branch 14 - Indore',      'Branch 15 - Bhopal',
    'Branch 16 - Visakhapatnam', 'Branch 17 - Patna',    'Branch 18 - Vadodara',
    'Branch 19 - Ghaziabad',  'Branch 20 - Ludhiana',    'Branch 21 - Agra',
    'Branch 22 - Nashik',     'Branch 23 - Faridabad',   'Branch 24 - Meerut',
    'Branch 25 - Rajkot',
  ];

  for (let i = 0; i < branchNames.length; i++) {
    await prisma.branch.upsert({
      where: { id: i + 1 },
      update: { name: branchNames[i] },
      create: {
        id: i + 1,
        name: branchNames[i],
        cityId: city.id,
        stateId: state.id,
        countryId: country.id,
        areaId: area.id,
      },
    });
  }

  const branch = await prisma.branch.findFirst({ where: { id: 1 } });

  // 4. Admin User — permissions must be explicit (NOT NULL column)
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@rsbharti.com' },
    update: {
      password: adminPassword,
      plainPassword: 'admin123',
      branchId: branch.id,
      roleId: adminRole.id,
      permissions: '{}',
    },
    create: {
      name: 'System Admin',
      email: 'admin@rsbharti.com',
      password: adminPassword,
      plainPassword: 'admin123',
      roleId: adminRole.id,
      branchId: branch.id,
      permissions: '{}',
    },
  });

  // 5. Category & Units
  const category = await prisma.categoryMaster.upsert({
    where: { name: 'Stationery' },
    update: {},
    create: { name: 'Stationery' },
  });

  await prisma.unitMaster.upsert({
    where: { id: 1 },
    update: { unitName: 'Pieces', shortName: 'Pcs' },
    create: { id: 1, unitName: 'Pieces', shortName: 'Pcs' },
  });

  // 7. Supplier
  await prisma.supplier.upsert({
    where: { id: 1 },
    update: {
      name: 'Elite Paper Supplies',
      cityId: city.id,
      stateId: state.id,
      countryId: country.id,
      areaId: area.id,
    },
    create: {
      id: 1,
      name: 'Elite Paper Supplies',
      phone: '9876543210',
      email: 'contact@elitepaper.com',
      cityId: city.id,
      stateId: state.id,
      countryId: country.id,
      areaId: area.id,
    },
  });

  // 8. Products
  const unit = await prisma.unitMaster.findFirst({ where: { id: 1 } });

  await prisma.product.upsert({
    where: { barcode: 'NB-001' },
    update: {
      name: 'Premium Leather Notebook',
      categoryId: category.id,
      unitId: unit.id,
      purchasePrice: 450,
      sellingPrice: 799,
    },
    create: {
      name: 'Premium Leather Notebook',
      categoryId: category.id,
      unitId: unit.id,
      purchasePrice: 450,
      sellingPrice: 799,
      barcode: 'NB-001',
    },
  });

  await prisma.product.upsert({
    where: { barcode: 'INK-002' },
    update: {
      name: 'Archival Grade Blue Ink',
      categoryId: category.id,
      unitId: unit.id,
      purchasePrice: 200,
      sellingPrice: 350,
    },
    create: {
      name: 'Archival Grade Blue Ink',
      categoryId: category.id,
      unitId: unit.id,
      purchasePrice: 200,
      sellingPrice: 350,
      barcode: 'INK-002',
    },
  });

  console.log('✓ Seeding completed!');
  console.log('  Admin → admin@rsbharti.com / admin123');
  console.log('  All other users must be created by admin through the app.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
