import prisma from './src/models/prisma';

async function test() {
  try {
    const staff = await prisma.staff.findMany({
      where: { organization_id: 1 },
      select: {
        staff_id: true,
        roles: true,
        role_distribution: true
      }
    });
    console.log('Staff:', JSON.stringify(staff, null, 2));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

test();
