import prisma from '../models/prisma';

export async function getRequestIdentity(userId: number, organizationId: number) {
  const account = await prisma.user.findFirst({ where: { id: userId, organization_id: organizationId, is_active: true } });
  if (!account) throw new Error('Active organization account is required');
  const staff = await prisma.staff.findMany({ where: { organization_id: organizationId } });
  const ownStaff = staff.filter(member => member.email?.toLowerCase() === account.email.toLowerCase());
  return { account, staff, ownStaff };
}

type SupervisorDirectory = {
  accounts: Array<{ id: number; email: string; role: { name: string } }>;
  profiles: Array<{ staff_id: string; name: string; email: string | null }>;
};

export async function resolveRequestSupervisors(member: { organization_id: number; supervisor: string | null; email: string | null }, directory?: SupervisorDirectory) {
  const supervisor = member.supervisor?.trim();
  if (!supervisor) return [];
  const accounts = directory?.accounts ?? await prisma.user.findMany({
    where: { organization_id: member.organization_id, is_active: true, role: { name: { in: ['USER', 'ADMIN'] } } },
    include: { role: true },
  });
  if (supervisor === 'Hospital Admin') return accounts.filter(account => account.role.name === 'ADMIN').map(account => account.id);
  const profiles = directory ? directory.profiles.filter(profile => profile.staff_id === supervisor || profile.email?.toLowerCase() === supervisor.toLowerCase() || profile.name === supervisor) : await prisma.staff.findMany({
    where: { organization_id: member.organization_id, OR: [{ staff_id: supervisor }, { email: { equals: supervisor, mode: 'insensitive' } }, { name: supervisor }] },
  });
  if (profiles.length > 1) throw new Error('Supervisor name is ambiguous. Assign their staff ID or email in the staff profile.');
  const supervisorEmail = profiles[0]?.email ?? supervisor;
  const matches = accounts.filter(account => account.email.toLowerCase() === supervisorEmail.toLowerCase());
  return matches.length === 1 ? [matches[0].id] : [];
}

export function requestReviewerIds(metadata: unknown): number[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const ids = (metadata as Record<string, unknown>).supervisor_user_ids;
  return Array.isArray(ids) ? ids.filter((id): id is number => typeof id === 'number') : [];
}

export async function resolveStaffRequestReviewers(member: { organization_id: number; supervisor: string | null; email: string | null }) {
  const supervisors = await resolveRequestSupervisors(member);
  const ownAccount = member.email ? await prisma.user.findFirst({ where: { organization_id: member.organization_id, email: { equals: member.email, mode: 'insensitive' } } }) : null;
  return supervisors.filter(userId => userId !== ownAccount?.id);
}

export function isValidRequestDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Resolve the active login account ids for a staff member (matched by email). */
export async function resolveStaffUserIds(member: { organization_id: number; email: string | null }) {
  if (!member.email) return [];
  const accounts = await prisma.user.findMany({
    where: { organization_id: member.organization_id, is_active: true, email: { equals: member.email, mode: 'insensitive' } },
  });
  return accounts.map(account => account.id);
}

type SwapMetadata = {
  swap?: boolean;
  stage?: 'COLLEAGUE' | 'SUPERVISOR' | 'ADMIN';
  requested_by?: number;
  target_user_ids?: number[];
  supervisor_user_ids?: number[];
  admin_user_ids?: number[];
};

export function isSwapRequest(metadata: unknown): boolean {
  return !!metadata && typeof metadata === 'object' && (metadata as SwapMetadata).swap === true;
}

export async function resolveSwapReviewers(
  member: { organization_id: number; supervisor: string | null; email: string | null },
  metadata: unknown,
) {
  const meta = metadata as SwapMetadata;
  const ownIds = await resolveStaffUserIds(member);
  const reviewers = meta.stage === 'ADMIN'
    ? (await prisma.user.findMany({
      where: { organization_id: member.organization_id, is_active: true, role: { name: 'ADMIN' } },
      include: { role: true },
    })).filter(account => account.role.name === 'ADMIN').map(account => account.id)
    : await resolveStaffRequestReviewers(member);
  return reviewers.filter(id => !ownIds.includes(id) && (meta.stage === 'ADMIN' || id !== meta.requested_by));
}

/** Everyone who should be able to see a swap request (both stages + requester). */
export function swapVisibilityUserIds(metadata: unknown): number[] {
  if (!isSwapRequest(metadata)) return [];
  const m = metadata as SwapMetadata;
  const ids = [...(m.target_user_ids ?? []), ...(m.supervisor_user_ids ?? []), ...(m.admin_user_ids ?? [])];
  if (typeof m.requested_by === 'number') ids.push(m.requested_by);
  return ids.filter((id): id is number => typeof id === 'number');
}