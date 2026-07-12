import { Request } from 'express';
import { SUPER_ADMIN_ROLE } from '../middlewares/auth';

// Cast helper — all routes using these functions are authenticated so req.user always exists.
function getUser(req: Request) {
  return (req as any).user as { id: number; role: string; organization_id: number | null } | undefined;
}

/**
 * Returns a Prisma `where` fragment for organization scoping:
 *
 *  - ADMIN: uses `orgId` query param if provided, falls back to JWT org_id, else no filter (sees all).
 *  - All other roles: always filters by their own `organization_id` from the JWT.
 */
export function getOrgFilter(req: Request): { organization_id?: number } {
  const user = getUser(req);
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;

  if (isSuperAdmin) {
    const orgId = req.query.orgId ?? req.body?.organization_id;
    if (orgId) return { organization_id: Number(orgId) };
    if (user?.organization_id) return { organization_id: user.organization_id };
    return {};
  }

  return user?.organization_id ? { organization_id: user.organization_id } : {};
}

/**
 * Returns the resolved organization_id for write operations:
 *  - ADMIN: uses `orgId` query param or `req.body.organization_id` if provided, falls back to JWT org_id.
 *  - Non-ADMIN: always their own org from the JWT.
 */
export function getResolvedOrgId(req: Request): number | null {
  const user = getUser(req);
  const isSuperAdmin = user?.role === SUPER_ADMIN_ROLE;

  if (isSuperAdmin) {
    const orgId = req.query.orgId ?? req.body?.organization_id;
    if (orgId) return Number(orgId);
    return user?.organization_id ?? null;
  }

  return user?.organization_id ?? null;
}
