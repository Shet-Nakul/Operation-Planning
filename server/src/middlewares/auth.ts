import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import prisma from '../models/prisma';

export const SUPER_ADMIN_ROLE = 'SUPERADMIN';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    organization_id: number | null; // null for super-admins not tied to a specific org
    permissions: string[];
  };
}

export async function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
      include: { role: true },
    });
    if (!user || !user.is_active) return res.status(401).json({ error: 'Account is inactive or unavailable' });
    req.user = {
      id: user.id,
      role: user.role.name,
      organization_id: user.organization_id,
      permissions: user.permissions,
    };
    next();
  } catch (err) {
    if (err instanceof Error && err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    if (err instanceof Error && err.name === 'TokenExpiredError') {
      return res.status(403).json({ error: 'Invalid or expired access token' });
    }
    return res.status(500).json({ error: 'Authentication check failed' });
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function authorizeApiRequest(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication is required' });
  if (req.user.role === SUPER_ADMIN_ROLE) return next();
  if (req.user.organization_id === null) {
    return res.status(403).json({ error: 'An organization must be assigned to this account' });
  }
  if (req.user.role !== 'ADMIN' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const apiPath = new URL(req.originalUrl, 'http://localhost').pathname;
    const resource = apiPath.split('/').filter(Boolean)[1];
    const permissions = req.user.permissions;
    const allowed = permissions.includes('*') || permissions.includes('write:*') ||
      permissions.includes(`write:${resource}`) || permissions.includes(`manage:${resource}`);
    if (!allowed && resource !== 'staff-requests') return res.status(403).json({ error: 'This account has view-only access' });
  }

  resolvePathOrganization(req.originalUrl)
    .then((organizationId) => {
      if (organizationId !== null && organizationId !== req.user?.organization_id) {
        return res.status(403).json({ error: 'Organization access denied' });
      }
      next();
    })
    .catch(() => res.status(500).json({ error: 'Unable to verify organization access' }));
}

async function resolvePathOrganization(originalUrl: string): Promise<number | null> {
  const segments = new URL(originalUrl, 'http://localhost').pathname.split('/').filter(Boolean);
  const [api, area, action, identifier] = segments;
  if (api !== 'api') return null;

  const directModels: Record<string, string> = {
    organizations: 'organization',
    users: 'user',
    surgeries: 'surgery',
    staff: 'staff',
    contracts: 'contract',
    'activity-logs': 'userActivityLog',
  };
  const directModel = directModels[area];
  if (directModel && action && /^\d+$/.test(action)) {
    const select = area === 'organizations' ? { id: true } : { organization_id: true };
    const row = await (prisma as any)[directModel].findUnique({
      where: { id: Number(action) },
      select,
    });
    return area === 'organizations' ? row?.id ?? null : row?.organization_id ?? null;
  }

  if (area === 'surgery-plans' && action) {
    const row = await prisma.surgeryPlanResult.findUnique({
      where: { surgery_id: action },
      select: { organization_id: true },
    });
    return row?.organization_id ?? null;
  }

  if (area === 'catalogs' && action === 'global_settings' && identifier && /^\d+$/.test(identifier)) {
    return Number(identifier);
  }

  if (area === 'catalogs' && identifier && /^\d+$/.test(identifier)) {
    const catalogModels: Record<string, string> = {
      roles: 'staffTag', resource_types: 'resourceType', specializations: 'specialization',
      skills: 'skill', departments: 'department', shift: 'shift', operation_types: 'operationType',
      phase_resource: 'phaseResource', constraint: 'forbiddenPattern', contract: 'contract',
      surgery_statuses: 'surgeryStatusCatalog', leave_types: 'leaveType', pattern: 'forbiddenPattern',
    };
    const model = catalogModels[action];
    if (model) {
      const row = await (prisma as any)[model].findUnique({
        where: { id: Number(identifier) },
        select: { organization_id: true },
      });
      return row?.organization_id ?? null;
    }
  }

  if (area === 'pools' && action) {
    const row = await prisma.resourcePool.findUnique({ where: { pool_id: action }, select: { organization_id: true } });
    return row?.organization_id ?? null;
  }

  if (area === 'resources' && action === 'pools' && identifier) {
    const row = await prisma.renewableResourcePool.findUnique({ where: { pool_id: identifier }, select: { organization_id: true } });
    return row?.organization_id ?? null;
  }

  if (area === 'resources' && action === 'units' && identifier) {
    const row = await prisma.resourceUnit.findUnique({
      where: { unit_id: identifier },
      select: { pool: { select: { organization_id: true } } },
    });
    return row?.pool.organization_id ?? null;
  }

  if (area === 'non-renewable-resources' && action) {
    const row = await prisma.nonRenewableResource.findUnique({ where: { resource_id: action }, select: { organization_id: true } });
    return row?.organization_id ?? null;
  }

  return null;
}
