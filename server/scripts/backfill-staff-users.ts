import prisma from '../src/models/prisma';
import { provisionStaffUser } from '../src/services/staffUserProvisioning';

/**
 * Backfill login accounts for all existing staff that don't have one yet.
 * Run from the server folder: `npx ts-node scripts/backfill-staff-users.ts`
 */
async function main() {
  const staff = await prisma.staff.findMany({ orderBy: { id: 'asc' } });
  let created = 0;
  let skippedExisting = 0;
  let skippedNoEmail = 0;
  let failed = 0;

  for (const member of staff) {
    try {
      const result = await provisionStaffUser({
        staff_id: member.staff_id,
        name: member.name,
        email: member.email,
        organization_id: member.organization_id,
      });
      if (result.created) {
        created += 1;
        console.log(`created  ${result.email} (staff ${member.staff_id})`);
      } else if (result.reason === 'exists') {
        skippedExisting += 1;
      } else if (result.reason === 'no-email') {
        skippedNoEmail += 1;
        console.warn(`skipped  ${member.staff_id} - no email on staff profile`);
      } else {
        failed += 1;
        console.warn(`skipped  ${member.staff_id} - ${result.reason}`);
      }
    } catch (err) {
      failed += 1;
      console.error(`failed   ${member.staff_id}`, err);
    }
  }

  console.log('\nBackfill complete.');
  console.log(`  created:          ${created}`);
  console.log(`  already had login: ${skippedExisting}`);
  console.log(`  no email:         ${skippedNoEmail}`);
  console.log(`  failed:           ${failed}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
