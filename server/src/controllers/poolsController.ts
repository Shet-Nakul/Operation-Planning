import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import logger from '../config/logger';
import { generatePoolId } from '../utils/generatePoolId';
import { resolveDepartmentName } from '../utils/resolveDepartmentName';
import { markPlanningDirty } from '../services/planningAutoTrigger';
import { markSchedulingDirty } from '../services/schedulingAutoTrigger';
import { getOrgFilter } from '../utils/getOrgFilter';

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
        department: await resolveDepartmentName(validatedData.department_id),
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

    markPlanningDirty(pool.organization_id);
    markSchedulingDirty(pool.organization_id);
    res.status(201).json({ success: true, data: { ...pool, pool_type: 'human_resource_pool' }, message: 'Pool created successfully' });
  } catch (err: any) {
    logger.error('Error creating pool:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    if (err.code === 'P2002') return res.status(409).json({ error: 'A pool with this name already exists for this organization' });
    res.status(500).json({ error: 'Failed to create pool' });
  }
}

export async function getPools(req: Request, res: Response) {
  try {
    const pools = await prisma.resourcePool.findMany({
      where: getOrgFilter(req),
      include: {
        demand_configs: { orderBy: { created_at: 'desc' }, take: 1 },
        resources: { select: { resource_id: true } },
      }
    });

    const response = await Promise.all(pools.map(async (p: any) => {
      const latestDemand = p.demand_configs[0];
      const totalMembers = await prisma.staff.count({
        where: {
          organization_id: p.organization_id,
          pool_assignments: { array_contains: [{ pool_id: p.pool_id }] } as any
        }
      });
      return {
        pool_type: 'human_resource_pool',
        pool_id: p.pool_id,
        pool_name: p.pool_name,
        department_id: p.department_id,
        location: p.location,
        primary_role: p.primary_role,
        total_members: totalMembers,
        weekly_hours: latestDemand?.weekly_hours || 0,
        static_pct: p.static_pct,
        dynamic_pct: p.dynamic_pct,
        resources: (p.resources as Array<{ resource_id: string }>).map(r => r.resource_id),
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
        demand_configs: { orderBy: { created_at: 'desc' }, take: 1 },
        resources: true,
      }
    }) as any;

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const latestDemand = pool.demand_configs[0];

    const employees = await prisma.staff.findMany({
      where: {
        organization_id: pool.organization_id,
        pool_assignments: { array_contains: [{ pool_id: pool.pool_id }] } as any
      }
    });

    const coverage = {
      week_start: req.query.week_start || new Date().toISOString().split('T')[0],
      rows: (latestDemand?.demand_matrix as any[] || []).map((row: any) => ({
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
        pool_type: 'human_resource_pool',
        ...pool,
        total_members: employees.length,
        weekly_hours: latestDemand?.weekly_hours || 0,
        employees: employees.map(e => ({
          staff_id: e.staff_id,
          name: e.name,
          role: e.designation,
          contract_type: e.contract_id?.startsWith('STA') ? 'STATIC' : 'DYNAMIC'
        })),
        resources: (pool.resources as any[]).map(r => ({
          resource_id: r.resource_id,
          name: r.name,
          description: r.description,
          weekly_template: r.weekly_template,
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
    if (validatedData.department_id !== undefined) {
      updateData.department_id = validatedData.department_id;
      updateData.department = await resolveDepartmentName(validatedData.department_id);
    }
    if (validatedData.location) updateData.location = validatedData.location;
    if (validatedData.primary_role) updateData.primary_role = validatedData.primary_role;
    if (validatedData.static_pct) updateData.static_pct = validatedData.static_pct;
    if (validatedData.dynamic_pct) updateData.dynamic_pct = validatedData.dynamic_pct;
    if (validatedData.metadata) updateData.metadata = validatedData.metadata;

    const pool = await prisma.resourcePool.update({
      where: { pool_id: pool_id },
      data: updateData,
    });

    markPlanningDirty(pool.organization_id);
    markSchedulingDirty(pool.organization_id);
    res.json({ success: true, data: { ...pool, pool_type: 'human_resource_pool' }, message: 'Pool updated successfully' });
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

    markPlanningDirty(pool.organization_id);
    markSchedulingDirty(pool.organization_id);
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
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to update pool demand' });
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

// ─── Pool Resources ───────────────────────────────────────────────────────────

const RESOURCE_STATUSES = ['AVAILABLE', 'RESERVED', 'BLOCKED', 'MAINTENANCE'] as const;

const blockBookingSchema = z.object({
  day: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  start: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
  end: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
  reason: z.string().optional(),
});

const poolResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(RESOURCE_STATUSES).optional(),
  weekly_template: z.record(z.any()).optional(),
  block_bookings: z.array(blockBookingSchema).optional(),
});

const reservationSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format: YYYY-MM-DD'),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Format: HH:mm'),
  reason: z.string().optional(),
  reference_id: z.string().optional(),
  status: z.enum(['ACTIVE', 'CANCELLED', 'COMPLETED']).optional(),
});

function generatePoolResourceId(poolId: string, resourceName: string, seq: number): string {
  const poolPrefix = poolId.replace(/-/g, '').slice(0, 3).toUpperCase();
  const namePrefix = resourceName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
  return `${poolPrefix}-${namePrefix}-${seq.toString().padStart(4, '0')}`;
}

function generateReservationId(resourceId: string, seq: number): string {
  const prefix = resourceId.slice(0, 8).toUpperCase();
  return `RES-${prefix}-${seq.toString().padStart(4, '0')}`;
}

// Computes a live current_state by checking active reservations and block_bookings
// against the current UTC time, falling back to the stored status.
function computeCurrentState(
  storedStatus: string,
  blockBookings: Array<{ day: string; start: string; end: string }>,
  activeReservations: Array<{ date: string; start_time: string; end_time: string; status: string }>
): string {
  const now = new Date();
  const todayDate = now.toISOString().split('T')[0]; // YYYY-MM-DD UTC
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayDay = days[now.getUTCDay()];
  const currentTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;

  const isReservedNow = activeReservations.some(r =>
    r.status === 'ACTIVE' &&
    r.date === todayDate &&
    r.start_time <= currentTime &&
    currentTime <= r.end_time
  );
  if (isReservedNow) return 'RESERVED';

  const isBlockedNow = blockBookings.some(b =>
    b.day === todayDay &&
    b.start <= currentTime &&
    currentTime <= b.end
  );
  if (isBlockedNow) return 'BLOCKED';

  return storedStatus;
}

export async function createPoolResource(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.resourcePool.findUnique({ where: { pool_id } });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const validatedData = poolResourceSchema.parse(req.body);

    const existingResources = await prisma.poolResource.findMany({ where: { pool_id: pool.id } });
    const maxSeq = existingResources.reduce((mx, r) => {
      const match = r.resource_id.match(/-(\d{4})$/);
      const n = match ? parseInt(match[1]) : 0;
      return Math.max(mx, n);
    }, 0);

    const resource_id = generatePoolResourceId(pool.pool_id, validatedData.name, maxSeq + 1);

    const resource = await prisma.poolResource.create({
      data: {
        resource_id,
        pool_id: pool.id,
        name: validatedData.name,
        description: validatedData.description,
        status: validatedData.status || 'AVAILABLE',
        weekly_template: validatedData.weekly_template || {},
        block_bookings: validatedData.block_bookings || [],
      },
    });

    markPlanningDirty(pool.organization_id);
    res.status(201).json({ success: true, data: { ...resource, current_state: resource.status }, message: 'Pool resource created successfully' });
  } catch (err: any) {
    logger.error('Error creating pool resource:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to create pool resource' });
  }
}

export async function getPoolResources(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.resourcePool.findUnique({ where: { pool_id } });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const resources = await prisma.poolResource.findMany({
      where: { pool_id: pool.id },
      include: { reservations: true },
      orderBy: { created_at: 'asc' },
    });

    const data = resources.map(r => ({
      ...r,
      current_state: computeCurrentState(
        r.status,
        r.block_bookings as Array<{ day: string; start: string; end: string }>,
        r.reservations
      ),
    }));

    res.json({ success: true, data });
  } catch (err: any) {
    logger.error('Error getting pool resources:', err);
    res.status(500).json({ error: 'Failed to get pool resources' });
  }
}

export async function getPoolResourceById(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const resource = await prisma.poolResource.findUnique({
      where: { resource_id },
      include: { reservations: { orderBy: { date: 'asc' } } },
    });
    if (!resource) return res.status(404).json({ error: 'Pool resource not found' });

    res.json({
      success: true,
      data: {
        ...resource,
        current_state: computeCurrentState(
          resource.status,
          resource.block_bookings as Array<{ day: string; start: string; end: string }>,
          resource.reservations
        ),
      },
    });
  } catch (err: any) {
    logger.error('Error getting pool resource:', err);
    res.status(500).json({ error: 'Failed to get pool resource' });
  }
}

export async function updatePoolResource(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const existing = await prisma.poolResource.findUnique({ where: { resource_id }, include: { pool: true } });
    if (!existing) return res.status(404).json({ error: 'Pool resource not found' });

    const validatedData = poolResourceSchema.partial().parse(req.body);
    const resource = await prisma.poolResource.update({
      where: { resource_id },
      data: validatedData,
      include: { reservations: true },
    });

    res.json({
      success: true,
      data: {
        ...resource,
        current_state: computeCurrentState(
          resource.status,
          resource.block_bookings as Array<{ day: string; start: string; end: string }>,
          resource.reservations
        ),
      },
      message: 'Pool resource updated successfully',
    });
    markPlanningDirty(existing.pool.organization_id);
  } catch (err: any) {
    logger.error('Error updating pool resource:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to update pool resource' });
  }
}

export async function deletePoolResource(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const existing = await prisma.poolResource.findUnique({ where: { resource_id }, include: { pool: true } });
    if (!existing) return res.status(404).json({ error: 'Pool resource not found' });

    await prisma.poolResource.delete({ where: { resource_id } });
    markPlanningDirty(existing.pool.organization_id);
    res.json({ success: true, message: 'Pool resource deleted successfully' });
  } catch (err: any) {
    logger.error('Error deleting pool resource:', err);
    res.status(500).json({ error: 'Failed to delete pool resource' });
  }
}

// ─── Pool Resource Reservations ───────────────────────────────────────────────

export async function createReservation(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const resource = await prisma.poolResource.findUnique({ where: { resource_id } });
    if (!resource) return res.status(404).json({ error: 'Pool resource not found' });

    const validatedData = reservationSchema.parse(req.body);

    const existingReservations = await prisma.poolResourceReservation.findMany({
      where: { resource_id: resource.id },
    });
    const maxSeq = existingReservations.reduce((mx, r) => {
      const match = r.reservation_id.match(/-(\d{4})$/);
      const n = match ? parseInt(match[1]) : 0;
      return Math.max(mx, n);
    }, 0);

    const reservation_id = generateReservationId(resource.resource_id, maxSeq + 1);

    const reservation = await prisma.poolResourceReservation.create({
      data: {
        reservation_id,
        resource_id: resource.id,
        date: validatedData.date,
        start_time: validatedData.start_time,
        end_time: validatedData.end_time,
        reason: validatedData.reason,
        reference_id: validatedData.reference_id,
        status: validatedData.status || 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, data: reservation, message: 'Reservation created successfully' });
  } catch (err: any) {
    logger.error('Error creating reservation:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to create reservation' });
  }
}

export async function getReservations(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const resource = await prisma.poolResource.findUnique({ where: { resource_id } });
    if (!resource) return res.status(404).json({ error: 'Pool resource not found' });

    const { date, status } = req.query;
    const reservations = await prisma.poolResourceReservation.findMany({
      where: {
        resource_id: resource.id,
        ...(date ? { date: date as string } : {}),
        ...(status ? { status: status as string } : {}),
      },
      orderBy: [{ date: 'asc' }, { start_time: 'asc' }],
    });

    res.json({ success: true, data: reservations });
  } catch (err: any) {
    logger.error('Error getting reservations:', err);
    res.status(500).json({ error: 'Failed to get reservations' });
  }
}

export async function getReservationById(req: Request, res: Response) {
  try {
    const reservation_id = req.params.reservation_id as string;
    const reservation = await prisma.poolResourceReservation.findUnique({ where: { reservation_id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    res.json({ success: true, data: reservation });
  } catch (err: any) {
    logger.error('Error getting reservation:', err);
    res.status(500).json({ error: 'Failed to get reservation' });
  }
}

export async function updateReservation(req: Request, res: Response) {
  try {
    const reservation_id = req.params.reservation_id as string;
    const existing = await prisma.poolResourceReservation.findUnique({ where: { reservation_id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    const validatedData = reservationSchema.partial().parse(req.body);
    const reservation = await prisma.poolResourceReservation.update({
      where: { reservation_id },
      data: validatedData,
    });

    res.json({ success: true, data: reservation, message: 'Reservation updated successfully' });
  } catch (err: any) {
    logger.error('Error updating reservation:', err);
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to update reservation' });
  }
}

export async function deleteReservation(req: Request, res: Response) {
  try {
    const reservation_id = req.params.reservation_id as string;
    const existing = await prisma.poolResourceReservation.findUnique({ where: { reservation_id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    await prisma.poolResourceReservation.delete({ where: { reservation_id } });
    res.json({ success: true, message: 'Reservation deleted successfully' });
  } catch (err: any) {
    logger.error('Error deleting reservation:', err);
    res.status(500).json({ error: 'Failed to delete reservation' });
  }
}
