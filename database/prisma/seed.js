const { PrismaClient } = require('@prisma/client');
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

  // 3. Branch
  const branch = await prisma.branch.upsert({
    where: { id: 1 }, // Using a known ID for seeding
    update: {
      name: 'Main Branch - Mumbai',
      address: '123 Business Hub, Andheri East',
      cityId: city.id,
      stateId: state.id,
      countryId: country.id,
      areaId: area.id,
    },
    create: {
      id: 1,
      name: 'Main Branch - Mumbai',
      address: '123 Business Hub, Andheri East',
      cityId: city.id,
      stateId: state.id,
      countryId: country.id,
      areaId: area.id,
    },
  });

  // 4. Admin User
  await prisma.user.upsert({
    where: { email: 'admin@rsbharti.com' },
    update: {
      branchId: branch.id,
      roleId: adminRole.id,
    },
    create: {
      name: 'System Admin',
      email: 'admin@rsbharti.com',
      password: 'password123',
      roleId: adminRole.id,
      branchId: branch.id,
    },
  });

  // 5. Category & Units
  const category = await prisma.categoryMaster.upsert({
    where: { name: 'Stationery' },
    update: {},
    create: { name: 'Stationery' },
  });

  const unit = await prisma.unitMaster.upsert({
    where: { id: 1 },
    update: { unitName: 'Pieces', shortName: 'Pcs' },
    create: { id: 1, unitName: 'Pieces', shortName: 'Pcs' },
  });

  // 6. Supplier
  const supplier = await prisma.supplier.upsert({
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

  // 7. Products
  const product1 = await prisma.product.upsert({
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

  const product2 = await prisma.product.upsert({
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

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
