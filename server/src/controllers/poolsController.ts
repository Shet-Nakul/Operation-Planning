import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import logger from '../config/logger';
import { generatePoolId } from '../utils/generatePoolId';

const demandMatrixItemSchema = z.object({
  shift: z.string(),
  mon: z.number(),
  tue: z.number(),
  wed: z.number(),
  thu: z.number(),
  fri: z.number(),
  sat: z.number(),
  sun: z.number(),
});

const poolNameRegex = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{0,98}[\p{L}\p{M}]$/u;

const resourcePoolSchema = z.object({
  organization_id: z.number(),
  pool_name: z.string().regex(poolNameRegex, 'Pool name must start and end with a letter, can include spaces, apostrophes, periods, and dashes, and be between 2-100 characters long.'),
  department_id: z.number().optional(),
  location: z.string().optional(),
  primary_role: z.string().optional(),
  static_pct: z.number().optional(),
  dynamic_pct: z.number().optional(),
  metadata: z.any().optional(),
  employees: z.array(z.string()).optional(), // staff_ids
  demand_matrix: z.array(demandMatrixItemSchema).optional(),
});

const demandUpdateSchema = z.object({
  effective_from: z.string(),
  effective_to: z.string().optional(),
  demand_matrix: z.array(demandMatrixItemSchema),
});

function calculateWeeklyHours(matrix: any[]) {
  let totalDemand = 0;
  matrix.forEach(row => {
    totalDemand += (row.mon + row.tue + row.wed + row.thu + row.fri + row.sat + row.sun);
  });
  // Assuming 8 hour shifts as a base for "weekly hours" calculation
  return totalDemand * 8; 
}

export async function createPool(req: Request, res: Response) {
  try {
    const validatedData = resourcePoolSchema.parse(req.body);
    // Get all existing pools for this organization
    const existingPools = await prisma.resourcePool.findMany({
      where: { organization_id: validatedData.organization_id }
    });

    // Find the maximum number from existing pool_ids
    let maxNumber = 0;
    existingPools.forEach(p => {
      const match = p.pool_id.match(/-(\d{4})$/);
      if (match && parseInt(match[1]) > maxNumber) {
        maxNumber = parseInt(match[1]);
      }
    });
    const nextNumber = maxNumber + 1;
    const pool_id = generatePoolId(validatedData.pool_name, nextNumber);

    const pool = await prisma.resourcePool.create({
      data: {
        organization_id: validatedData.organization_id,
        pool_id: pool_id,
        pool_name: validatedData.pool_name,
        department_id: validatedData.department_id,
        location: validatedData.location,
        primary_role: validatedData.primary_role,
        static_pct: validatedData.static_pct || 50,
        dynamic_pct: validatedData.dynamic_pct || 50,
        metadata: validatedData.metadata || {},
      },
    });

    if (validatedData.demand_matrix) {
      const weekly_hours = calculateWeeklyHours(validatedData.demand_matrix);
      await prisma.poolDemandConfig.create({
        data: {
          pool_id: pool.id,
          effective_from: new Date(),
          demand_matrix: validatedData.demand_matrix,
          weekly_hours: weekly_hours,
        }
      });
    }

    res.status(201).json({ success: true, data: pool, message: 'Pool created successfully' });
  } catch (err: any) {
    logger.error('Error creating pool:', err);
    res.status(400).json({ error: err.message || 'Failed to create pool' });
  }
}

export async function getPools(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const pools = await prisma.resourcePool.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
      include: {
        demand_configs: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    const response = await Promise.all(pools.map(async (p: any) => {
      const latestDemand = p.demand_configs[0];
      
      const totalMembers = await prisma.staff.count({
        where: {
          organization_id: p.organization_id,
          pool_assignments: {
            array_contains: [{ pool_id: p.pool_id }]
          } as any
        }
      });

      return {
        pool_id: p.pool_id,
        pool_name: p.pool_name,
        department_id: p.department_id,
        location: p.location,
        primary_role: p.primary_role,
        total_members: totalMembers,
        weekly_hours: latestDemand?.weekly_hours || 0,
        static_pct: p.static_pct,
        dynamic_pct: p.dynamic_pct,
        metadata: p.metadata
      };
    }));

    res.json({ success: true, data: response });
  } catch (err: any) {
    logger.error('Error getting pools:', err);
    res.status(500).json({ error: 'Failed to get pools' });
  }
}

export async function getPoolById(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.resourcePool.findUnique({
      where: { pool_id: pool_id },
      include: {
        demand_configs: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    }) as any;

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const latestDemand = pool.demand_configs[0];

    const employees = await prisma.staff.findMany({
      where: {
        organization_id: pool.organization_id,
        pool_assignments: {
          array_contains: [{ pool_id: pool.pool_id }]
        } as any
      }
    });

    const coverage = {
      week_start: req.query.week_start || new Date().toISOString().split('T')[0],
      rows: (latestDemand?.demand_matrix as any[] || []).map(row => ({
        shift: row.shift,
        days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => ({
          actual: row[day],
          required: row[day],
          status: 'FULFILLED'
        }))
      }))
    };

    res.json({
      success: true,
      data: {
        ...pool,
        total_members: employees.length,
        weekly_hours: latestDemand?.weekly_hours || 0,
        employees: employees.map(e => ({
          staff_id: e.staff_id,
          name: e.name,
          role: e.designation,
          contract_type: e.contract_id?.startsWith('STA') ? 'STATIC' : 'DYNAMIC'
        })),
        coverage
      }
    });
  } catch (err: any) {
    logger.error('Error getting pool by id:', err);
    res.status(500).json({ error: 'Failed to get pool' });
  }
}

export async function updatePool(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const validatedData = resourcePoolSchema.partial().parse(req.body);

    const existingPool = await prisma.resourcePool.findUnique({
      where: { pool_id: pool_id }
    });
    if (!existingPool) return res.status(404).json({ error: 'Pool not found' });

    const updateData: any = {};
    if (validatedData.pool_name) updateData.pool_name = validatedData.pool_name;
    if (validatedData.department_id !== undefined) updateData.department_id = validatedData.department_id;
    if (validatedData.location) updateData.location = validatedData.location;
    if (validatedData.primary_role) updateData.primary_role = validatedData.primary_role;
    if (validatedData.static_pct) updateData.static_pct = validatedData.static_pct;
    if (validatedData.dynamic_pct) updateData.dynamic_pct = validatedData.dynamic_pct;
    if (validatedData.metadata) updateData.metadata = validatedData.metadata;

    const pool = await prisma.resourcePool.update({
      where: { pool_id: pool_id },
      data: updateData,
    });

    res.json({ success: true, data: pool, message: 'Pool updated successfully' });
  } catch (err: any) {
    logger.error('Error updating pool:', err);
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: err.issues.map((issue: any) => issue.message).join(', ') });
    }
    res.status(500).json({ error: 'Failed to update pool' });
  }
}

export async function getPoolDemand(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.resourcePool.findUnique({
      where: { pool_id: pool_id },
      include: {
        demand_configs: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    }) as any;

    if (!pool || !pool.demand_configs[0]) return res.status(404).json({ error: 'Demand configuration not found' });

    const config = pool.demand_configs[0];
    res.json({
      success: true,
      data: {
        pool_id: pool.pool_id,
        effective_from: config.effective_from,
        effective_to: config.effective_to,
        weekly_hours: config.weekly_hours,
        demand_matrix: config.demand_matrix
      }
    });
  } catch (err: any) {
    logger.error('Error getting pool demand:', err);
    res.status(500).json({ error: 'Failed to get pool demand' });
  }
}

export async function updatePoolDemand(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const validatedData = demandUpdateSchema.parse(req.body);
    
    const pool = await prisma.resourcePool.findUnique({
      where: { pool_id: pool_id }
    });

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const weekly_hours = calculateWeeklyHours(validatedData.demand_matrix);

    const config = await prisma.poolDemandConfig.create({
      data: {
        pool_id: pool.id,
        effective_from: new Date(validatedData.effective_from),
        effective_to: validatedData.effective_to ? new Date(validatedData.effective_to) : null,
        demand_matrix: validatedData.demand_matrix,
        weekly_hours: weekly_hours,
      }
    });

    res.json({
      success: true,
      data: {
        pool_id: pool.pool_id,
        effective_from: config.effective_from,
        effective_to: config.effective_to,
        weekly_hours: config.weekly_hours,
        demand_matrix: config.demand_matrix
      },
      message: 'Pool demand updated successfully'
    });
  } catch (err: any) {
    logger.error('Error updating pool demand:', err);
    res.status(400).json({ error: err.message || 'Failed to update pool demand' });
  }
}

export async function getPoolShortages(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    res.json({
      success: true,
      data: [
        {
          pool_id: pool_id,
          shift: "Morning",
          day: "2026-05-27",
          shortfall: 1,
          severity: "WARNING"
        },
        {
          pool_id: pool_id,
          shift: "Night",
          day: "2026-05-30",
          shortfall: 1,
          severity: "CRITICAL"
        }
      ]
    });
  } catch (err: any) {
    logger.error('Error getting pool shortages:', err);
    res.status(500).json({ error: 'Failed to get pool shortages' });
  }
}
