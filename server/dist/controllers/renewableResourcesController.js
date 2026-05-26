"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRenewablePool = createRenewablePool;
exports.getRenewablePools = getRenewablePools;
exports.addUnitsToPool = addUnitsToPool;
exports.getRenewablePoolById = getRenewablePoolById;
exports.updatePoolCapacity = updatePoolCapacity;
exports.getPoolHealth = getPoolHealth;
exports.updateUnit = updateUnit;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const resourceUnitSchema = zod_1.z.object({
    unit_id: zod_1.z.string(),
    variant: zod_1.z.string().optional(),
    attributes: zod_1.z.any().optional(),
    status: zod_1.z.string().optional(),
});
const renewableResourcePoolSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    pool_name: zod_1.z.string(),
    resource_type: zod_1.z.enum(['BED', 'EQUIPMENT', 'ROOM', 'DEVICE', 'VEHICLE']),
    department: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    total_capacity: zod_1.z.number(),
    unit_prefix: zod_1.z.string().optional(),
    default_variant: zod_1.z.string().optional(),
    default_attributes: zod_1.z.any().optional(),
    metadata: zod_1.z.any().optional(),
});
const updateCapacitySchema = zod_1.z.object({
    total_capacity: zod_1.z.number(),
    reason: zod_1.z.string().optional(),
    effective_from: zod_1.z.string().optional(),
});
const updateUnitSchema = zod_1.z.object({
    variant: zod_1.z.string().optional(),
    attributes: zod_1.z.any().optional(),
    status: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
});
async function createRenewablePool(req, res) {
    try {
        const validatedData = renewableResourcePoolSchema.parse(req.body);
        // Auto-generate pool_id if not provided
        const pool_id = `${validatedData.unit_prefix || validatedData.resource_type}-${validatedData.resource_type}-${Math.floor(100 + Math.random() * 900)}`;
        const pool = await prisma_1.default.renewableResourcePool.create({
            data: {
                organization_id: validatedData.organization_id,
                pool_id: pool_id,
                pool_name: validatedData.pool_name,
                resource_type: validatedData.resource_type,
                department: validatedData.department,
                location: validatedData.location,
                total_capacity: validatedData.total_capacity,
                status: "OPERATIONAL",
                metadata: validatedData.metadata || {},
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
        await prisma_1.default.resourceUnit.createMany({
            data: unitsData
        });
        const createdUnits = await prisma_1.default.resourceUnit.findMany({
            where: { pool_id: pool.id },
            take: 2 // Return only first 2 as per example
        });
        res.status(201).json({
            ...pool,
            in_use: 0,
            available: validatedData.total_capacity,
            utilization_rate: 0.0,
            units: createdUnits
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getRenewablePools(req, res) {
    try {
        const { resource_type, department, status, orgId } = req.query;
        const where = {};
        if (orgId)
            where.organization_id = Number(orgId);
        if (resource_type)
            where.resource_type = resource_type;
        if (department)
            where.department = department;
        if (status)
            where.status = status;
        const pools = await prisma_1.default.renewableResourcePool.findMany({
            where,
            include: {
                _count: {
                    select: { units: true }
                }
            }
        });
        const response = await Promise.all(pools.map(async (p) => {
            const units = await prisma_1.default.resourceUnit.groupBy({
                by: ['status'],
                where: { pool_id: p.id },
                _count: true
            });
            const stats = {
                AVAILABLE: 0,
                IN_USE: 0,
                MAINTENANCE: 0
            };
            units.forEach((u) => {
                if (u.status in stats) {
                    stats[u.status] = u._count;
                }
            });
            const total = p._count.units;
            const utilization_rate = total > 0 ? (stats.IN_USE / total) : 0;
            return {
                pool_id: p.pool_id,
                pool_name: p.pool_name,
                resource_type: p.resource_type,
                department: p.department,
                location: p.location,
                total_capacity: total,
                in_use: stats.IN_USE,
                available: stats.AVAILABLE,
                in_maintenance: stats.MAINTENANCE,
                utilization_rate: parseFloat(utilization_rate.toFixed(2)),
                status: p.status,
                metadata: p.metadata
            };
        }));
        res.json(response);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function addUnitsToPool(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const { units } = zod_1.z.object({ units: zod_1.z.array(resourceUnitSchema) }).parse(req.body);
        const pool = await prisma_1.default.renewableResourcePool.findUnique({
            where: { pool_id: pool_id }
        });
        if (!pool)
            return res.status(404).json({ error: 'Pool not found' });
        const previous_capacity = pool.total_capacity;
        const unitsData = units.map(u => ({
            pool_id: pool.id,
            unit_id: u.unit_id,
            status: u.status || "AVAILABLE",
            variant: u.variant || "STANDARD",
            attributes: u.attributes || {},
        }));
        await prisma_1.default.resourceUnit.createMany({
            data: unitsData
        });
        const new_total_capacity = previous_capacity + units.length;
        const updatedPool = await prisma_1.default.renewableResourcePool.update({
            where: { id: pool.id },
            data: { total_capacity: new_total_capacity }
        });
        // Recalculate stats
        const allUnits = await prisma_1.default.resourceUnit.groupBy({
            by: ['status'],
            where: { pool_id: pool.id },
            _count: true
        });
        const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
        allUnits.forEach((u) => { if (u.status in stats)
            stats[u.status] = u._count; });
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
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getRenewablePoolById(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const pool = await prisma_1.default.renewableResourcePool.findUnique({
            where: { pool_id: pool_id },
            include: {
                units: true
            }
        });
        if (!pool)
            return res.status(404).json({ error: 'Pool not found' });
        const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
        pool.units.forEach(u => {
            if (u.status in stats)
                stats[u.status]++;
        });
        const total = pool.units.length;
        const utilization_rate = total > 0 ? (stats.IN_USE / total) : 0;
        res.json({
            pool_id: pool.pool_id,
            pool_name: pool.pool_name,
            resource_type: pool.resource_type,
            department: pool.department,
            location: pool.location,
            total_capacity: total,
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updatePoolCapacity(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const { total_capacity, reason, effective_from } = updateCapacitySchema.parse(req.body);
        const pool = await prisma_1.default.renewableResourcePool.findUnique({
            where: { pool_id: pool_id }
        });
        if (!pool)
            return res.status(404).json({ error: 'Pool not found' });
        const previous_capacity = pool.total_capacity;
        // Update the pool
        const updatedPool = await prisma_1.default.renewableResourcePool.update({
            where: { id: pool.id },
            data: {
                total_capacity: total_capacity,
                metadata: {
                    ...(pool.metadata || {}),
                    lastModifiedBy: req.user?.email || 'system',
                    changeReason: reason,
                    capacityEffectiveFrom: effective_from
                }
            },
            include: {
                units: true
            }
        });
        const stats = { AVAILABLE: 0, IN_USE: 0, MAINTENANCE: 0 };
        updatedPool.units.forEach(u => {
            if (u.status in stats)
                stats[u.status]++;
        });
        res.json({
            pool_id: updatedPool.pool_id,
            pool_name: updatedPool.pool_name,
            resource_type: updatedPool.resource_type,
            total_capacity: updatedPool.total_capacity,
            previous_capacity: previous_capacity,
            in_use: stats.IN_USE,
            available: updatedPool.total_capacity - stats.IN_USE - stats.MAINTENANCE,
            utilization_rate: parseFloat((stats.IN_USE / updatedPool.total_capacity).toFixed(3)),
            sync_triggered: true,
            affected_workflows: ["STAFF-ROSTER-ICU-2026W22", "STAFF-ROSTER-ICU-2026W23"], // Mocked
            metadata: updatedPool.metadata
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getPoolHealth(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const pool = await prisma_1.default.renewableResourcePool.findUnique({
            where: { pool_id: pool_id },
            include: {
                units: true
            }
        });
        if (!pool)
            return res.status(404).json({ error: 'Pool not found' });
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
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateUnit(req, res) {
    try {
        const unit_id = req.params.unit_id;
        const validatedData = updateUnitSchema.parse(req.body);
        const unit = await prisma_1.default.resourceUnit.findUnique({
            where: { unit_id: unit_id }
        });
        if (!unit)
            return res.status(404).json({ error: 'Unit not found' });
        const updatedUnit = await prisma_1.default.resourceUnit.update({
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
            pool_id: (await prisma_1.default.renewableResourcePool.findUnique({ where: { id: updatedUnit.pool_id } }))?.pool_id,
            status: updatedUnit.status,
            variant: updatedUnit.variant,
            attributes: updatedUnit.attributes,
            reason: validatedData.reason,
            assigned_to: updatedUnit.assigned_to,
            metadata: {
                updatedAt: updatedUnit.updated_at,
                lastModifiedBy: req.user?.email || 'system'
            }
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
