import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { getOrgFilter } from '../utils/getOrgFilter';
import { markPlanningDirty } from '../services/planningAutoTrigger';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const TIME_RE = /^\d{2}:\d{2}$/;

const blockBookingSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('date_range'),
    from: z.string(),
    to: z.string(),
    reason: z.string().optional(),
  }),
  z.object({
    type: z.literal('weekly'),
    day: z.enum(DAYS),
    start: z.string().regex(TIME_RE, 'start must be HH:mm'),
    end: z.string().regex(TIME_RE, 'end must be HH:mm'),
    reason: z.string().optional(),
  }),
]);

const unitReservationSchema = z.object({
  from_datetime: z.string(),
  to_datetime: z.string(),
  reason: z.string().optional(),
  reference_id: z.string().optional(),
});

const resourceUnitSchema = z.object({
  unit_id: z.string(),
  variant: z.string().optional(),
  attributes: z.any().optional(),
  status: z.string().optional(),
});

function computeCurrentStatus(
  storedStatus: string,
  statusTill: Date | null,
  blockBookings: any[],
  activeReservations: Array<{ from_datetime: string; to_datetime: string }>,
): { current_status: string; status_till: string | null } {
  const now = new Date();
  const nowMs = now.getTime();

  // 1. Active reservation covering now → RESERVED
  for (const r of activeReservations) {
    const from = new Date(r.from_datetime + (r.from_datetime.includes('Z') || r.from_datetime.includes('+') ? '' : 'Z'));
    const to   = new Date(r.to_datetime   + (r.to_datetime.includes('Z')   || r.to_datetime.includes('+')   ? '' : 'Z'));
    if (nowMs >= from.getTime() && nowMs <= to.getTime()) {
      return { current_status: 'RESERVED', status_till: r.to_datetime };
    }
  }

  // 2. Block booking covering now → BLOCKED
  const todayDay = DAYS[now.getUTCDay() === 0 ? 6 : now.getUTCDay() - 1];
  const nowTime = `${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}`;
  for (const bb of blockBookings) {
    if (bb.type === 'date_range') {
      const from = new Date(bb.from + (bb.from.includes('Z') || bb.from.includes('+') ? '' : 'Z'));
      const to   = new Date(bb.to   + (bb.to.includes('Z')   || bb.to.includes('+')   ? '' : 'Z'));
      if (nowMs >= from.getTime() && nowMs <= to.getTime()) {
        return { current_status: 'BLOCKED', status_till: bb.to };
      }
    } else if (bb.type === 'weekly' && bb.day === todayDay) {
      if (nowTime >= bb.start && nowTime <= bb.end) {
        return { current_status: 'BLOCKED', status_till: null };
      }
    }
  }

  // 3. status_till expired → flip to AVAILABLE
  if (statusTill && nowMs > statusTill.getTime()) {
    return { current_status: 'AVAILABLE', status_till: null };
  }

  return { current_status: storedStatus, status_till: statusTill ? statusTill.toISOString() : null };
}

function formatUnit(u: any, reservations: Array<{ from_datetime: string; to_datetime: string }> = []) {
  const { current_status, status_till } = computeCurrentStatus(
    u.status,
    u.status_till ? new Date(u.status_till) : null,
    (u.block_bookings as any[]) || [],
    reservations,
  );
  return {
    unit_id: u.unit_id,
    status: u.status,
    current_status,
    status_till,
    variant: u.variant,
    attributes: u.attributes,
    block_bookings: u.block_bookings || [],
    assigned_to: u.assigned_to,
    assigned_at: u.assigned_at,
    estimated_release: u.estimated_release,
    last_released_at: u.last_released_at,
  };
}

// Each day has an object with `hours`: a list of [start, end] open-hour pairs.  Empty list = closed.
const openHoursPeriodSchema = z.tuple([z.string(), z.string()]);
const dayHoursSchema = z.object({ hours: z.array(openHoursPeriodSchema) });
const weeklyTemplateSchema = z.object({
  monday: dayHoursSchema.optional(),
  tuesday: dayHoursSchema.optional(),
  wednesday: dayHoursSchema.optional(),
  thursday: dayHoursSchema.optional(),
  friday: dayHoursSchema.optional(),
  saturday: dayHoursSchema.optional(),
  sunday: dayHoursSchema.optional(),
});

const renewableResourcePoolSchema = z.object({
  organization_id: z.number(),
  pool_name: z.string(),
  resource_type: z.enum(['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE']),
  department: z.string().optional(),
  location: z.string().optional(),
  total_capacity: z.number(),
  weekly_template: weeklyTemplateSchema.optional(),
  unit_prefix: z.string().optional(),
  default_variant: z.string().optional(),
  default_attributes: z.any().optional(),
  metadata: z.any().optional(),
});

const updateCapacitySchema = z.object({
  total_capacity: z.number(),
  reason: z.string().optional(),
  effective_from: z.string().optional(),
});

const updateUnitSchema = z.object({
  variant: z.string().optional(),
  attributes: z.any().optional(),
  status: z.string().optional(),
  status_till: z.string().optional().nullable(),
  block_bookings: z.array(blockBookingSchema).optional(),
  reason: z.string().optional(),
});

export async function createRenewablePool(req: Request, res: Response) {
  try {
    const validatedData = renewableResourcePoolSchema.parse(req.body);
    
    // Auto-generate pool_id if not provided
    const pool_id = `${validatedData.unit_prefix || validatedData.resource_type}-${validatedData.resource_type}-${Math.floor(100 + Math.random() * 900)}`;

    const pool = await prisma.renewableResourcePool.create({
      data: {
        organization_id: validatedData.organization_id,
        pool_id: pool_id,
        pool_name: validatedData.pool_name,
        resource_type: validatedData.resource_type,
        department: validatedData.department,
        location: validatedData.location,
        total_capacity: validatedData.total_capacity,
        weekly_template: validatedData.weekly_template || {},
        status: "OPERATIONAL",
        metadata: {
          ...(validatedData.metadata || {}),
          unit_prefix: validatedData.unit_prefix || validatedData.resource_type,
          default_variant: validatedData.default_variant || "STANDARD",
          default_attributes: validatedData.default_attributes || {},
        },
      },
    });

    // Auto-generate units based on total_capacity and unit_prefix
    const unitsData = [];
    const prefix = validatedData.unit_prefix || validatedData.resource_type;
    for (let i = 1; i <= validatedData.total_capacity; i++) {
      unitsData.push({
        pool_id: pool.id,
        unit_id: `${prefix}-${i.toString().padStart(2, '0')}`,
        status: "AVAILABLE",
        variant: validatedData.default_variant || "STANDARD",
        attributes: validatedData.default_attributes || {},
      });
    }

    await prisma.resourceUnit.createMany({
      data: unitsData
    });

    const createdUnits = await prisma.resourceUnit.findMany({
      where: { pool_id: pool.id },
      take: 2 // Return only first 2 as per example
    });

    res.status(201).json({
      pool_type: 'renewable_resource_pool',
      pool_id: pool.pool_id,
      pool_name: pool.pool_name,
      resource_type: pool.resource_type,
      department: pool.department,
      location: pool.location,
      total_capacity: pool.total_capacity,
      in_use: 0,
      available: pool.total_capacity,
      in_maintenance: 0,
      utilization_rate: 0.0,
      status: pool.status,
      resources: createdUnits.map(u => u.unit_id),
      weekly_template: pool.weekly_template || {},
      reservations: pool.reservations || [],
      units_preview: createdUnits.map((u) => ({
        unit_id: u.unit_id,
        status: u.status,
        variant: u.variant,
        attributes: u.attributes,
      })),
      metadata: pool.metadata,
    });
    markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function getRenewablePools(req: Request, res: Response) {
  try {
    const { resource_type, department, status, orgId } = req.query;
    
    const where: any = { ...getOrgFilter(req) };
    if (resource_type) where.resource_type = resource_type as string;
    if (department) where.department = department as string;
    if (status) where.status = status as string;

    const pools = await prisma.renewableResourcePool.findMany({
      where,
      include: {
        units: { select: { unit_id: true, status: true } },
        _count: { select: { units: true } }
      }
    });

    const response = pools.map((p: any) => {
      const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
      (p.units as Array<{ unit_id: string; status: string }>).forEach(u => {
        if (u.status in stats) (stats as any)[u.status]++;
      });

      const totalUnits = p._count.units;
      const capacity = typeof p.total_capacity === 'number' ? p.total_capacity : totalUnits;
      const denom = capacity > 0 ? capacity : totalUnits > 0 ? totalUnits : 1;
      const utilization_rate = denom > 0 ? (stats.IN_USE / denom) : 0;

      return {
        pool_type: 'renewable_resource_pool',
        pool_id: p.pool_id,
        pool_name: p.pool_name,
        resource_type: p.resource_type,
        department: p.department,
        location: p.location,
        total_capacity: capacity,
        unit_count: totalUnits,
        resources: (p.units as Array<{ unit_id: string }>).map(u => u.unit_id),
        in_use: stats.IN_USE,
        available: stats.AVAILABLE,
        in_maintenance: stats.MAINTENANCE,
        utilization_rate: parseFloat(utilization_rate.toFixed(2)),
        status: p.status,
        weekly_template: p.weekly_template || {},
        reservations: p.reservations || [],
        metadata: p.metadata
      };
    });

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function addUnitsToPool(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const { units } = z.object({ units: z.array(resourceUnitSchema) }).parse(req.body);

    const pool = await prisma.renewableResourcePool.findUnique({
      where: { pool_id: pool_id }
    });

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const previous_capacity = pool.total_capacity;

    const unitsData = units.map(u => ({
      pool_id: pool.id,
      unit_id: u.unit_id,
      status: u.status || "AVAILABLE",
      variant: u.variant || "STANDARD",
      attributes: u.attributes || {},
    }));

    await prisma.resourceUnit.createMany({
      data: unitsData
    });

    const new_total_capacity = previous_capacity + units.length;

    const updatedPool = await prisma.renewableResourcePool.update({
      where: { id: pool.id },
      data: { total_capacity: new_total_capacity }
    });

    // Recalculate stats
    const allUnits = await prisma.resourceUnit.groupBy({
      by: ['status'],
      where: { pool_id: pool.id },
      _count: true
    });

    const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
    allUnits.forEach((u: any) => { if (u.status in stats) (stats as any)[u.status] = u._count; });

    res.json({
      pool_type: 'renewable_resource_pool',
      pool_id: updatedPool.pool_id,
      pool_name: updatedPool.pool_name,
      total_capacity: updatedPool.total_capacity,
      previous_capacity: previous_capacity,
      in_use: stats.IN_USE,
      available: stats.AVAILABLE,
      utilization_rate: parseFloat((stats.IN_USE / updatedPool.total_capacity).toFixed(3)),
      units_added: unitsData,
      sync_triggered: true,
      metadata: updatedPool.metadata
    });
    markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function getRenewablePoolById(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.renewableResourcePool.findUnique({
      where: { pool_id: pool_id },
      include: {
        units: { include: { reservations: { where: { status: 'ACTIVE' } } } },
      },
    });

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0, RESERVED: 0, BLOCKED: 0 };
    pool.units.forEach(u => {
      const { current_status } = computeCurrentStatus(
        u.status, u.status_till ? new Date(u.status_till) : null,
        (u.block_bookings as any[]) || [], u.reservations,
      );
      if (current_status in stats) (stats as any)[current_status]++;
    });

    const capacity = typeof pool.total_capacity === 'number' ? pool.total_capacity : pool.units.length;
    const denom = capacity > 0 ? capacity : pool.units.length > 0 ? pool.units.length : 1;
    const utilization_rate = denom > 0 ? (stats.IN_USE / denom) : 0;

    res.json({
      pool_type: 'renewable_resource_pool',
      pool_id: pool.pool_id,
      pool_name: pool.pool_name,
      resource_type: pool.resource_type,
      department: pool.department,
      location: pool.location,
      total_capacity: capacity,
      unit_count: pool.units.length,
      in_use: stats.IN_USE,
      available: stats.AVAILABLE,
      in_maintenance: stats.MAINTENANCE,
      utilization_rate: parseFloat(utilization_rate.toFixed(2)),
      status: pool.status,
      resources: pool.units.map(u => u.unit_id),
      weekly_template: pool.weekly_template || {},
      reservations: pool.reservations || [],
      health: {
        maintenance_status: stats.MAINTENANCE > 0 ? "ATTENTION" : "OPTIMAL",
        avg_turnover_minutes: 14.2, // Mocked
        projected_load_24h: 0.92, // Mocked
        queue_length: 1 // Mocked
      },
      units: pool.units.map(u => formatUnit(u, (u as any).reservations || [])),
      metadata: pool.metadata
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function updatePoolCapacity(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const { total_capacity, reason, effective_from } = updateCapacitySchema.parse(req.body);

    const pool = await prisma.renewableResourcePool.findUnique({
      where: { pool_id: pool_id },
      include: { units: true },
    });

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const previous_capacity = pool.total_capacity;
    const currentUnitCount = pool.units.length;

    if (total_capacity < 0) {
      return res.status(400).json({ error: 'total_capacity must be >= 0' });
    }

    const delta = total_capacity - currentUnitCount;
    let units_added: string[] = [];
    let units_removed: string[] = [];

    if (delta > 0) {
      const meta = (pool.metadata as any) || {};
      const inferredPrefix =
        typeof meta.unit_prefix === 'string'
          ? meta.unit_prefix
          : typeof pool.units[0]?.unit_id === 'string'
            ? String(pool.units[0].unit_id).split('-')[0]
            : pool.resource_type;

      const defaultVariant = typeof meta.default_variant === 'string' ? meta.default_variant : 'STANDARD';
      const defaultAttrs = meta.default_attributes ?? {};

      const parseSuffix = (id: string) => {
        const parts = id.split('-');
        const last = parts[parts.length - 1] ?? '';
        const n = Number(last);
        return Number.isFinite(n) ? n : null;
      };

      const maxSuffix = pool.units.reduce((mx, u) => {
        if (typeof u.unit_id !== 'string') return mx;
        const n = parseSuffix(u.unit_id);
        if (n === null) return mx;
        return Math.max(mx, n);
      }, 0);

      const start = maxSuffix + 1;
      const newUnits = Array.from({ length: delta }, (_, i) => {
        const n = start + i;
        const unitId = `${inferredPrefix}-${String(n).padStart(2, '0')}`;
        units_added.push(unitId);
        return {
          pool_id: pool.id,
          unit_id: unitId,
          status: 'AVAILABLE',
          variant: defaultVariant,
          attributes: defaultAttrs,
        };
      });

      await prisma.resourceUnit.createMany({ data: newUnits });
    } else if (delta < 0) {
      const toRemove = -delta;
      const removable = pool.units
        .filter((u) => u.status === 'AVAILABLE')
        .sort((a, b) => String(b.unit_id).localeCompare(String(a.unit_id)));

      if (removable.length < toRemove) {
        return res.status(409).json({
          error: `Cannot reduce capacity to ${total_capacity}. ${toRemove} unit(s) must be removed but only ${removable.length} unit(s) are AVAILABLE.`,
        });
      }

      const removing = removable.slice(0, toRemove);
      units_removed = removing.map((u) => u.unit_id);
      await prisma.resourceUnit.deleteMany({
        where: { id: { in: removing.map((u) => u.id) } },
      });
    }

    const updatedPool = await prisma.renewableResourcePool.update({
      where: { id: pool.id },
      data: {
        total_capacity: total_capacity,
        metadata: {
          ...(((pool.metadata as any) || {}) as any),
          lastModifiedBy: (req as any).user?.email || 'system',
          changeReason: reason,
          capacityEffectiveFrom: effective_from,
        },
      },
    });

    const byStatus = await prisma.resourceUnit.groupBy({
      by: ['status'],
      where: { pool_id: pool.id },
      _count: true,
    });

    const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
    byStatus.forEach((u: any) => {
      if (u.status in stats) (stats as any)[u.status] = u._count;
    });

    const denom = updatedPool.total_capacity > 0 ? updatedPool.total_capacity : 1;

    res.json({
      pool_type: 'renewable_resource_pool',
      pool_id: updatedPool.pool_id,
      pool_name: updatedPool.pool_name,
      resource_type: updatedPool.resource_type,
      total_capacity: updatedPool.total_capacity,
      previous_capacity: previous_capacity,
      in_use: stats.IN_USE,
      available: stats.AVAILABLE,
      in_maintenance: stats.MAINTENANCE,
      utilization_rate: parseFloat((stats.IN_USE / denom).toFixed(3)),
      sync_triggered: true,
      affected_workflows: ["STAFF-ROSTER-ICU-2026W22", "STAFF-ROSTER-ICU-2026W23"], // Mocked
      units_added,
      units_removed,
      metadata: updatedPool.metadata
    });
    markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function getPoolHealth(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.renewableResourcePool.findUnique({
      where: { pool_id: pool_id },
      include: {
        units: true
      }
    });

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const inMaintenance = pool.units.filter(u => u.status === 'MAINTENANCE').length;
    const inUse = pool.units.filter(u => u.status === 'IN_USE').length;
    const utilization = pool.units.length > 0 ? (inUse / pool.units.length) : 0;

    res.json({
      pool_type: 'renewable_resource_pool',
      pool_id: pool.pool_id,
      pool_name: pool.pool_name,
      resource_type: pool.resource_type,
      current_utilization: parseFloat(utilization.toFixed(2)),
      maintenance: {
        status: inMaintenance > 0 ? "ATTENTION" : "OPTIMAL",
        units_in_maintenance: inMaintenance,
        next_scheduled: "2026-05-28T06:00:00Z" // Mocked
      },
      turnover: {
        avg_minutes: 14.2,
        median_minutes: 12.0,
        p95_minutes: 22.5
      },
      projections: {
        load_6h: 0.85,
        load_12h: 0.88,
        load_24h: 0.92,
        expected_assignments_24h: 5,
        expected_releases_24h: 2
      },
      alerts: [
        {
          severity: "WARNING",
          message: "Projected 24h load exceeds 90% threshold",
          triggered_at: new Date().toISOString()
        }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function updateUnit(req: Request, res: Response) {
  try {
    const unit_id = req.params.unit_id as string;
    const validatedData = updateUnitSchema.parse(req.body);

    const unit = await prisma.resourceUnit.findUnique({
      where: { unit_id },
      include: { reservations: { where: { status: 'ACTIVE' } } },
    });

    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const updatedUnit = await prisma.resourceUnit.update({
      where: { id: unit.id },
      data: {
        variant: validatedData.variant,
        attributes: validatedData.attributes,
        status: validatedData.status,
        status_till: validatedData.status_till !== undefined
          ? (validatedData.status_till ? new Date(validatedData.status_till) : null)
          : undefined,
        block_bookings: validatedData.block_bookings !== undefined
          ? (validatedData.block_bookings as any)
          : undefined,
        assigned_to: validatedData.status === 'MAINTENANCE' ? null : undefined,
      },
      include: { reservations: { where: { status: 'ACTIVE' } } },
    });

    const pool = await prisma.renewableResourcePool.findUnique({ where: { id: updatedUnit.pool_id } });
    const formatted = formatUnit(updatedUnit, updatedUnit.reservations);

    res.json({
      ...formatted,
      pool_id: pool?.pool_id,
      reason: validatedData.reason,
      metadata: { updatedAt: updatedUnit.updated_at, lastModifiedBy: (req as any).user?.email || 'system' },
    });
    if (pool) markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function updateWeeklyTemplate(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const { weekly_template } = z.object({ weekly_template: weeklyTemplateSchema }).parse(req.body);

    const pool = await prisma.renewableResourcePool.findUnique({
      where: { pool_id: pool_id }
    });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const updatedPool = await prisma.renewableResourcePool.update({
      where: { id: pool.id },
      data: { weekly_template }
    });

    res.json({
      pool_type: 'renewable_resource_pool',
      pool_id: updatedPool.pool_id,
      pool_name: updatedPool.pool_name,
      weekly_template: updatedPool.weekly_template,
      message: 'Weekly template updated successfully'
    });
    markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// ── Unit reservations ─────────────────────────────────────────────────────────

export async function createUnitReservation(req: Request, res: Response) {
  try {
    const unit_id = req.params.unit_id as string;
    const data = unitReservationSchema.parse(req.body);

    const unit = await prisma.resourceUnit.findUnique({ where: { unit_id } });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const reservation = await prisma.resourceUnitReservation.create({
      data: {
        reservation_id: randomUUID(),
        unit_id: unit.id,
        from_datetime: data.from_datetime,
        to_datetime: data.to_datetime,
        reason: data.reason,
        reference_id: data.reference_id,
        status: 'ACTIVE',
      },
    });

    res.status(201).json({ success: true, data: reservation });
    markPlanningDirty((req as any).user.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function getUnitReservations(req: Request, res: Response) {
  try {
    const unit_id = req.params.unit_id as string;
    const unit = await prisma.resourceUnit.findUnique({ where: { unit_id } });
    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const { status } = req.query;
    const reservations = await prisma.resourceUnitReservation.findMany({
      where: { unit_id: unit.id, ...(status ? { status: status as string } : {}) },
      orderBy: { from_datetime: 'asc' },
    });

    res.json({ success: true, data: reservations });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function getUnitReservationById(req: Request, res: Response) {
  try {
    const reservation_id = req.params.reservation_id as string;
    const reservation = await prisma.resourceUnitReservation.findUnique({ where: { reservation_id } });
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json({ success: true, data: reservation });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function updateUnitReservation(req: Request, res: Response) {
  try {
    const reservation_id = req.params.reservation_id as string;
    const data = unitReservationSchema.partial().extend({ status: z.enum(['ACTIVE','CANCELLED']).optional() }).parse(req.body);

    const existing = await prisma.resourceUnitReservation.findUnique({ where: { reservation_id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    const updated = await prisma.resourceUnitReservation.update({
      where: { reservation_id },
      data,
    });

    res.json({ success: true, data: updated });
    markPlanningDirty((req as any).user.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function deleteUnitReservation(req: Request, res: Response) {
  try {
    const reservation_id = req.params.reservation_id as string;
    const existing = await prisma.resourceUnitReservation.findUnique({ where: { reservation_id } });
    if (!existing) return res.status(404).json({ error: 'Reservation not found' });

    await prisma.resourceUnitReservation.delete({ where: { reservation_id } });
    res.json({ success: true, message: 'Reservation deleted' });
    markPlanningDirty((req as any).user.organization_id);
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

// ── Pool-level reservations (legacy JSON blob) ────────────────────────────────

const reservationSchema = z.object({
  resource_id: z.string(),
  start: z.string(),
  end: z.string(),
  type: z.string(),
});

export async function getReservations(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.renewableResourcePool.findUnique({ where: { pool_id } });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });
    res.json({ pool_id: pool.pool_id, reservations: pool.reservations || [] });
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function createReservation(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.renewableResourcePool.findUnique({ where: { pool_id } });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const data = reservationSchema.parse(req.body);
    const newReservation = { id: randomUUID(), ...data };

    const existing = (pool.reservations as any[]) || [];
    const updated = await prisma.renewableResourcePool.update({
      where: { id: pool.id },
      data: { reservations: [...existing, newReservation] },
    });

    res.status(201).json({ success: true, reservation: newReservation, reservations: updated.reservations, message: 'Reservation created successfully' });
    markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}

export async function deleteReservation(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const reservation_id = req.params.reservation_id as string;
    const pool = await prisma.renewableResourcePool.findUnique({ where: { pool_id } });
    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const existing = (pool.reservations as Array<{ id: string }>) || [];
    if (!existing.find(r => r.id === reservation_id)) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    const updated = await prisma.renewableResourcePool.update({
      where: { id: pool.id },
      data: { reservations: existing.filter(r => r.id !== reservation_id) },
    });

    res.json({ success: true, reservations: updated.reservations, message: 'Reservation deleted successfully' });
    markPlanningDirty(pool.organization_id);
  } catch (err: any) {
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
}
