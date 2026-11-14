import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { SEED_MODELS } from './db-starter-seed/models';
import { snapshot } from './db-starter-seed/data';

const prisma = new PrismaClient();

type Row = Record<string, unknown>;

// Omit null/undefined so optional columns fall back to their schema defaults and
// nullable Json fields don't trip Prisma's null-handling on create.
function toCreateData(row: Row): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

// Upsert every captured row by primary key. On a fresh clone the tables are
// empty so every row is created; on an already-populated DB existing rows are
// left untouched (update: {}), so local changes are never clobbered.
async function restoreSnapshot(): Promise<void> {
  for (const model of SEED_MODELS) {
    const rows = (snapshot[model.key] ?? []) as Row[];
    if (rows.length === 0) continue;
    const delegate = (prisma as unknown as Record<string, {
      upsert: (args: { where: { id: number }; update: Row; create: Row }) => Promise<unknown>;
    }>)[model.delegate];
    for (const row of rows) {
      await delegate.upsert({
        where: { id: row.id as number },
        update: {},
        create: toCreateData(row),
      });
    }
    console.log(`  restored ${model.key}: ${rows.length}`);
  }
}

// Keep autoincrement sequences ahead of the explicit IDs we just inserted.
async function resetSequences(): Promise<void> {
  for (const model of SEED_MODELS) {
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('${model.table}', 'id'), COALESCE((SELECT MAX(id) FROM "${model.table}"), 1))`,
    );
  }
}

async function ensureSuperAdmin(): Promise<void> {
  const superAdminRole = await prisma.role.findUniqueOrThrow({ where: { name: 'SUPERADMIN' } });
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@karmarker.com';
  await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      role_id: superAdminRole.id,
      first_name: 'Super',
      last_name: 'Admin',
      email: superAdminEmail,
      password_hash: await bcrypt.hash(process.env.SUPER_ADMIN_PASSWORD || 'Karmarker@2026', 10),
    },
  });
}

export async function main(): Promise<void> {
  try {
    await restoreSnapshot();
    await ensureSuperAdmin();
    await resetSequences();
    console.log('db-starter-seed: current database snapshot upserted; Super Admin ensured');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void main();
