import prisma from './src/models/prisma';
import { prepareSchedulePayload } from './src/services/payloadPreparer';

async function test() {
  try {
    const payload = await prepareSchedulePayload(1);
    console.log('Employee Profiles:', JSON.stringify(payload.employee_profiles, null, 2));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

test();
