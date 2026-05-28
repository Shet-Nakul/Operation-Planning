import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';

const resourceUnitSchema = z.object({
  unit_id: z.string(),
  variant: z.string().optional(),
  attributes: z.any().optional(),
  status: z.string().optional(),
});

const renewableResourcePoolSchema = z.object({
  organization_id: z.number(),
  pool_name: z.string(),
  resource_type: z.enum(['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE']),
  department: z.string().optional(),
  location: z.string().optional(),
  total_capacity: z.number(),
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
      units_preview: createdUnits.map((u) => ({
        unit_id: u.unit_id,
        status: u.status,
        variant: u.variant,
        attributes: u.attributes,
      })),
      metadata: pool.metadata,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getRenewablePools(req: Request, res: Response) {
  try {
    const { resource_type, department, status, orgId } = req.query;
    
    const where: any = {};
    if (orgId) where.organization_id = Number(orgId);
    if (resource_type) where.resource_type = resource_type as string;
    if (department) where.department = department as string;
    if (status) where.status = status as string;

    const pools = await prisma.renewableResourcePool.findMany({
      where,
      include: {
        _count: {
          select: { units: true }
        }
      }
    });

    const response = await Promise.all(pools.map(async (p: any) => {
      const units = await prisma.resourceUnit.groupBy({
        by: ['status'],
        where: { pool_id: p.id },
        _count: true
      });

      const stats = {
        AVAILABLE: 0,
        IN_USE: 0,
        MAINTENANCE: 0
      };

      units.forEach((u: any) => {
        if (u.status in stats) {
          (stats as any)[u.status] = u._count;
        }
      });

      const totalUnits = p._count.units;
      const capacity = typeof p.total_capacity === 'number' ? p.total_capacity : totalUnits;
      const denom = capacity > 0 ? capacity : totalUnits > 0 ? totalUnits : 1;
      const utilization_rate = denom > 0 ? (stats.IN_USE / denom) : 0;

      return {
        pool_id: p.pool_id,
        pool_name: p.pool_name,
        resource_type: p.resource_type,
        department: p.department,
        location: p.location,
        total_capacity: capacity,
        unit_count: totalUnits,
        in_use: stats.IN_USE,
        available: stats.AVAILABLE,
        in_maintenance: stats.MAINTENANCE,
        utilization_rate: parseFloat(utilization_rate.toFixed(2)),
        status: p.status,
        metadata: p.metadata
      };
    }));

    res.json(response);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getRenewablePoolById(req: Request, res: Response) {
  try {
    const pool_id = req.params.pool_id as string;
    const pool = await prisma.renewableResourcePool.findUnique({
      where: { pool_id: pool_id },
      include: {
        units: true
      }
    });

    if (!pool) return res.status(404).json({ error: 'Pool not found' });

    const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
    pool.units.forEach(u => {
      if (u.status in stats) (stats as any)[u.status]++;
    });

    const capacity = typeof pool.total_capacity === 'number' ? pool.total_capacity : pool.units.length;
    const denom = capacity > 0 ? capacity : pool.units.length > 0 ? pool.units.length : 1;
    const utilization_rate = denom > 0 ? (stats.IN_USE / denom) : 0;

    res.json({
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
      health: {
        maintenance_status: stats.MAINTENANCE > 0 ? "ATTENTION" : "OPTIMAL",
        avg_turnover_minutes: 14.2, // Mocked
        projected_load_24h: 0.92, // Mocked
        queue_length: 1 // Mocked
      },
      units: pool.units.map(u => ({
        unit_id: u.unit_id,
        status: u.status,
        variant: u.variant,
        attributes: u.attributes,
        last_released_at: u.last_released_at,
        assigned_to: u.assigned_to,
        assigned_at: u.assigned_at,
        estimated_release: u.estimated_release
      })),
      metadata: pool.metadata
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
  } catch (err: any) {
    res.status(400).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
}

export async function updateUnit(req: Request, res: Response) {
  try {
    const unit_id = req.params.unit_id as string;
    const validatedData = updateUnitSchema.parse(req.body);

    const unit = await prisma.resourceUnit.findUnique({
      where: { unit_id: unit_id }
    });

    if (!unit) return res.status(404).json({ error: 'Unit not found' });

    const updatedUnit = await prisma.resourceUnit.update({
      where: { id: unit.id },
      data: {
        variant: validatedData.variant,
        attributes: validatedData.attributes,
        status: validatedData.status,
        assigned_to: validatedData.status === 'MAINTENANCE' ? null : undefined, // Clear assignment if maintenance
      }
    });

    res.json({
      unit_id: updatedUnit.unit_id,
      pool_id: (await prisma.renewableResourcePool.findUnique({ where: { id: updatedUnit.pool_id } }))?.pool_id,
      status: updatedUnit.status,
      variant: updatedUnit.variant,
      attributes: updatedUnit.attributes,
      reason: validatedData.reason,
      assigned_to: updatedUnit.assigned_to,
      metadata: {
        updatedAt: updatedUnit.updated_at,
        lastModifiedBy: (req as any).user?.email || 'system'
      }
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
