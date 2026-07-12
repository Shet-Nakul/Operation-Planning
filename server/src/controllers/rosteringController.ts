import { Request, Response } from 'express';
import prisma from '../models/prisma';
import logger from '../config/logger';
import { getResolvedOrgId } from '../utils/getOrgFilter';

function requireOrgId(req: Request, res: Response): number | null {
  const orgId = getResolvedOrgId(req);
  if (!orgId) {
    res.status(400).json({ error: 'Organization ID is required. Pass orgId as a query param (admins) or authenticate with an org-scoped token.' });
    return null;
  }
  return orgId;
}

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * GET /api/rosterings
 *
 * Query params:
 *   view        = latest (default) | all | employee | pool | date | stats
 *   year        = YYYY   (optional; combined with month to pin a specific month)
 *   month       = M      (optional; combined with year to pin a specific month)
 *   employeeId  = staff_id  (required when view=employee)
 *   poolId      = pool_id   (required when view=pool)
 *   date        = YYYY-MM-DD (required when view=date)
 */
export async function queryRostering(req: Request, res: Response) {
  try {
    const orgId = requireOrgId(req, res);
    if (!orgId) return;

    const view       = str(req.query.view as any) || 'latest';
    const year       = str(req.query.year as any);
    const month      = str(req.query.month as any);
    const employeeId = str(req.query.employeeId as any);
    const poolId     = str(req.query.poolId as any);
    const date       = str(req.query.date as any);

    // view=all: every rostering row for this org
    if (view === 'all') {
      const rows = await prisma.rostering.findMany({
        where: { organization_id: orgId },
        orderBy: { created_at: 'desc' },
      });
      return res.json({ success: true, data: rows });
    }

    // All other views: one row — specific month when year+month given, otherwise latest
    const whereClause: any = { organization_id: orgId };
    if (year && month) {
      whereClause.year  = Number(year);
      whereClause.month = Number(month);
    }

    const rostering = await prisma.rostering.findFirst({
      where: whereClause,
      orderBy: { created_at: 'desc' },
    });

    if (!rostering) {
      return res.status(404).json({ error: 'No rostering data found' });
    }

    switch (view) {
      case 'latest':
        return res.json({ success: true, data: rostering });

      case 'stats':
        return res.json({ success: true, data: rostering.stats });

      case 'employee': {
        if (!employeeId) return res.status(400).json({ error: 'employeeId is required for view=employee' });
        const centric = rostering.employee_centric as Record<string, any>;
        if (!centric[employeeId]) return res.status(404).json({ error: 'Employee not found in rostering data' });
        return res.json({ success: true, data: centric[employeeId] });
      }

      case 'pool': {
        if (!poolId) return res.status(400).json({ error: 'poolId is required for view=pool' });
        const centric = rostering.pool_centric as Record<string, any>;
        if (!centric[poolId]) return res.status(404).json({ error: 'Pool not found in rostering data' });
        return res.json({ success: true, data: centric[poolId] });
      }

      case 'date': {
        if (!date) return res.status(400).json({ error: 'date is required for view=date' });
        const centric = rostering.date_centric as Record<string, any>;
        if (!centric[date]) return res.status(404).json({ error: 'Date not found in rostering data' });
        return res.json({ success: true, data: centric[date] });
      }

      default:
        return res.status(400).json({ error: 'Invalid view. Use: latest, all, employee, pool, date, stats' });
    }
  } catch (err: any) {
    logger.error('Error in queryRostering', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving rostering data' });
  }
}
