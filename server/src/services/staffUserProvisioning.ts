import bcrypt from 'bcrypt';
import prisma from '../models/prisma';
import logger from '../config/logger';

export type ProvisionResult =
  | { created: true; user_id: number; email: string }
  | { created: false; reason: 'no-email' | 'exists' | 'no-user-role' | 'error'; email?: string };

/** Default login password for an auto-provisioned staff account: staff_id lowercased with spaces removed. */
export function defaultStaffPassword(staffId: string): string {
  return String(staffId ?? '').toLowerCase().replace(/\s+/g, '');
}

function splitName(name: string): { first_name: string; last_name?: string } {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: 'Staff' };
  const [first, ...rest] = parts;
  return { first_name: first, last_name: rest.length ? rest.join(' ') : undefined };
}

/**
 * Ensure a staff member has a login account. Matches the existing staff<->user
 * convention (same email). Idempotent: never overwrites an existing account.
 */
export async function provisionStaffUser(staff: {
  staff_id: string;
  name: string;
  email: string | null;
  organization_id: number;
}): Promise<ProvisionResult> {
  const email = staff.email?.trim();
  if (!email) return { created: false, reason: 'no-email' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { created: false, reason: 'exists', email };

  const userRole = await prisma.role.findUnique({ where: { name: 'USER' } });
  if (!userRole) return { created: false, reason: 'no-user-role', email };

  const { first_name, last_name } = splitName(staff.name);
  const password_hash = await bcrypt.hash(defaultStaffPassword(staff.staff_id), 10);

  const user = await prisma.user.create({
    data: {
      organization_id: staff.organization_id,
      role_id: userRole.id,
      first_name,
      last_name,
      email,
      password_hash,
      is_active: true,
    },
  });
  return { created: true, user_id: user.id, email };
}

/** Provision a login without letting failures break the surrounding staff operation. */
export async function provisionStaffUserSafe(staff: {
  staff_id: string;
  name: string;
  email: string | null;
  organization_id: number;
}): Promise<ProvisionResult> {
  try {
    const result = await provisionStaffUser(staff);
    if (result.created) logger.info(`Provisioned staff login for ${result.email} (staff ${staff.staff_id})`);
    return result;
  } catch (err) {
    logger.error(`Failed to provision staff login for ${staff.staff_id}`, err as Error);
    return { created: false, reason: 'error', email: staff.email ?? undefined };
  }
}
