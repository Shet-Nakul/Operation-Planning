import { Request, Response } from 'express';
import prisma from '../models/prisma';
import logger from '../config/logger';

export async function getLatestRostering(req: Request, res: Response) {
  try {
    const { orgId, type } = req.query;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID (orgId) is required' });
    }

    const rostering = await prisma.rostering.findFirst({
      where: { organization_id: Number(orgId) },
      orderBy: { created_at: 'desc' }
    });

    if (!rostering) {
      return res.status(404).json({ error: 'No rostering data found' });
    }

    if (type) {
      switch (type) {
        case 'employee':
          return res.json({ success: true, data: rostering.employee_centric });
        case 'pool':
          return res.json({ success: true, data: rostering.pool_centric });
        case 'date':
          return res.json({ success: true, data: rostering.date_centric });
        case 'stats':
          return res.json({ success: true, data: rostering.stats });
        default:
          return res.status(400).json({ error: 'Invalid type. Use "employee", "pool", "date", or "stats"' });
      }
    }

    res.json({ success: true, data: rostering });
  } catch (err: any) {
    logger.error('Error in getLatestRostering', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving rostering data' });
  }
}

export async function getAllRosterings(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID (orgId) is required' });
    }

    const rosterings = await prisma.rostering.findMany({
      where: { organization_id: Number(orgId) },
      orderBy: { created_at: 'desc' }
    });

    res.json({ success: true, data: rosterings });
  } catch (err: any) {
    logger.error('Error in getAllRosterings', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving rostering data' });
  }
}

// Get employee-centric data for a specific employee
export async function getEmployeeRostering(req: Request, res: Response) {
  try {
    const { orgId, employeeId, year, month } = req.query;
    if (!orgId || !employeeId) {
      return res.status(400).json({ error: 'Organization ID (orgId) and employee ID are required' });
    }

    const orgIdStr = String(Array.isArray(orgId) ? orgId[0] : orgId);
    const employeeIdStr = String(Array.isArray(employeeId) ? employeeId[0] : employeeId);
    const yearStr = Array.isArray(year) ? year[0] : year;
    const monthStr = Array.isArray(month) ? month[0] : month;

    let whereClause: any = { organization_id: Number(orgIdStr) };
    
    // If year and month are provided, use them; otherwise get the latest
    if (yearStr && monthStr) {
      whereClause.year = Number(yearStr);
      whereClause.month = Number(monthStr);
    }

    const rostering = await prisma.rostering.findFirst({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    if (!rostering) {
      return res.status(404).json({ error: 'No rostering data found' });
    }

    const employeeCentric = rostering.employee_centric as any;
    if (!employeeCentric[employeeIdStr]) {
      return res.status(404).json({ error: 'Employee not found in rostering data' });
    }

    res.json({ success: true, data: employeeCentric[employeeIdStr] });
  } catch (err: any) {
    logger.error('Error in getEmployeeRostering', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving employee rostering data' });
  }
}

// Get pool-centric data for a specific pool
export async function getPoolRostering(req: Request, res: Response) {
  try {
    const { orgId, poolId, year, month } = req.query;
    if (!orgId || !poolId) {
      return res.status(400).json({ error: 'Organization ID (orgId) and pool ID are required' });
    }

    const orgIdStr = String(Array.isArray(orgId) ? orgId[0] : orgId);
    const poolIdStr = String(Array.isArray(poolId) ? poolId[0] : poolId);
    const yearStr = Array.isArray(year) ? year[0] : year;
    const monthStr = Array.isArray(month) ? month[0] : month;

    let whereClause: any = { organization_id: Number(orgIdStr) };
    
    // If year and month are provided, use them; otherwise get the latest
    if (yearStr && monthStr) {
      whereClause.year = Number(yearStr);
      whereClause.month = Number(monthStr);
    }

    const rostering = await prisma.rostering.findFirst({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    if (!rostering) {
      return res.status(404).json({ error: 'No rostering data found' });
    }

    const poolCentric = rostering.pool_centric as any;
    if (!poolCentric[poolIdStr]) {
      return res.status(404).json({ error: 'Pool not found in rostering data' });
    }

    res.json({ success: true, data: poolCentric[poolIdStr] });
  } catch (err: any) {
    logger.error('Error in getPoolRostering', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving pool rostering data' });
  }
}

// Get date-centric data for a specific date
export async function getDateRostering(req: Request, res: Response) {
  try {
    const { orgId, date, year, month } = req.query;
    if (!orgId || !date) {
      return res.status(400).json({ error: 'Organization ID (orgId) and date are required' });
    }

    const orgIdStr = String(Array.isArray(orgId) ? orgId[0] : orgId);
    const dateStr = String(Array.isArray(date) ? date[0] : date);
    const yearStr = Array.isArray(year) ? year[0] : year;
    const monthStr = Array.isArray(month) ? month[0] : month;

    let whereClause: any = { organization_id: Number(orgIdStr) };
    
    // If year and month are provided, use them; otherwise get the latest
    if (yearStr && monthStr) {
      whereClause.year = Number(yearStr);
      whereClause.month = Number(monthStr);
    }

    const rostering = await prisma.rostering.findFirst({
      where: whereClause,
      orderBy: { created_at: 'desc' }
    });

    if (!rostering) {
      return res.status(404).json({ error: 'No rostering data found' });
    }

    const dateCentric = rostering.date_centric as any;
    if (!dateCentric[dateStr]) {
      return res.status(404).json({ error: 'Date not found in rostering data' });
    }

    res.json({ success: true, data: dateCentric[dateStr] });
  } catch (err: any) {
    logger.error('Error in getDateRostering', err);
    res.status(500).json({ error: 'An unexpected error occurred while retrieving date rostering data' });
  }
}
