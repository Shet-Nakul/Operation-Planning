"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPool = createPool;
exports.getPools = getPools;
exports.getPoolById = getPoolById;
exports.getPoolDemand = getPoolDemand;
exports.updatePoolDemand = updatePoolDemand;
exports.getPoolShortages = getPoolShortages;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const demandMatrixItemSchema = zod_1.z.object({
    shift: zod_1.z.string(),
    mon: zod_1.z.number(),
    tue: zod_1.z.number(),
    wed: zod_1.z.number(),
    thu: zod_1.z.number(),
    fri: zod_1.z.number(),
    sat: zod_1.z.number(),
    sun: zod_1.z.number(),
});
const resourcePoolSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    pool_name: zod_1.z.string(),
    department: zod_1.z.string().optional(),
    location: zod_1.z.string().optional(),
    primary_role: zod_1.z.string().optional(),
    static_pct: zod_1.z.number().optional(),
    dynamic_pct: zod_1.z.number().optional(),
    metadata: zod_1.z.any().optional(),
    employees: zod_1.z.array(zod_1.z.string()).optional(), // staff_ids
    demand_matrix: zod_1.z.array(demandMatrixItemSchema).optional(),
});
const demandUpdateSchema = zod_1.z.object({
    effective_from: zod_1.z.string(),
    effective_to: zod_1.z.string().optional(),
    demand_matrix: zod_1.z.array(demandMatrixItemSchema),
});
function calculateWeeklyHours(matrix) {
    let totalDemand = 0;
    matrix.forEach(row => {
        totalDemand += (row.mon + row.tue + row.wed + row.thu + row.fri + row.sat + row.sun);
    });
    // Assuming 8 hour shifts as a base for "weekly hours" calculation
    return totalDemand * 8;
}
async function createPool(req, res) {
    try {
        const validatedData = resourcePoolSchema.parse(req.body);
        const pool_id = validatedData.pool_name.split(' ').map(w => w[0]).join('').toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
        const pool = await prisma_1.default.resourcePool.create({
            data: {
                organization_id: validatedData.organization_id,
                pool_id: pool_id,
                pool_name: validatedData.pool_name,
                department: validatedData.department,
                location: validatedData.location,
                primary_role: validatedData.primary_role,
                static_pct: validatedData.static_pct || 50,
                dynamic_pct: validatedData.dynamic_pct || 50,
                metadata: validatedData.metadata || {},
            },
        });
        if (validatedData.demand_matrix) {
            const weekly_hours = calculateWeeklyHours(validatedData.demand_matrix);
            await prisma_1.default.poolDemandConfig.create({
                data: {
                    pool_id: pool.id,
                    effective_from: new Date(),
                    demand_matrix: validatedData.demand_matrix,
                    weekly_hours: weekly_hours,
                }
            });
        }
        res.status(201).json(pool);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getPools(req, res) {
    try {
        const { orgId } = req.query;
        const pools = await prisma_1.default.resourcePool.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
            include: {
                demand_configs: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            }
        });
        const response = await Promise.all(pools.map(async (p) => {
            const latestDemand = p.demand_configs[0];
            const totalMembers = await prisma_1.default.staff.count({
                where: {
                    organization_id: p.organization_id,
                    pool_assignments: {
                        array_contains: [{ pool_id: p.pool_id }]
                    }
                }
            });
            return {
                pool_id: p.pool_id,
                pool_name: p.pool_name,
                department: p.department,
                location: p.location,
                primary_role: p.primary_role,
                total_members: totalMembers,
                weekly_hours: latestDemand?.weekly_hours || 0,
                static_pct: p.static_pct,
                dynamic_pct: p.dynamic_pct,
                metadata: p.metadata
            };
        }));
        res.json(response);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getPoolById(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const pool = await prisma_1.default.resourcePool.findUnique({
            where: { pool_id: pool_id },
            include: {
                demand_configs: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            }
        });
        if (!pool)
            return res.status(404).json({ error: 'Pool not found' });
        const latestDemand = pool.demand_configs[0];
        const employees = await prisma_1.default.staff.findMany({
            where: {
                organization_id: pool.organization_id,
                pool_assignments: {
                    array_contains: [{ pool_id: pool.pool_id }]
                }
            }
        });
        const coverage = {
            week_start: req.query.week_start || new Date().toISOString().split('T')[0],
            rows: (latestDemand?.demand_matrix || []).map(row => ({
                shift: row.shift,
                days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => ({
                    actual: row[day],
                    required: row[day],
                    status: 'FULFILLED'
                }))
            }))
        };
        res.json({
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
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getPoolDemand(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const pool = await prisma_1.default.resourcePool.findUnique({
            where: { pool_id: pool_id },
            include: {
                demand_configs: {
                    orderBy: { created_at: 'desc' },
                    take: 1
                }
            }
        });
        if (!pool || !pool.demand_configs[0])
            return res.status(404).json({ error: 'Demand configuration not found' });
        const config = pool.demand_configs[0];
        res.json({
            pool_id: pool.pool_id,
            effective_from: config.effective_from,
            effective_to: config.effective_to,
            weekly_hours: config.weekly_hours,
            demand_matrix: config.demand_matrix
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updatePoolDemand(req, res) {
    try {
        const pool_id = req.params.pool_id;
        const validatedData = demandUpdateSchema.parse(req.body);
        const pool = await prisma_1.default.resourcePool.findUnique({
            where: { pool_id: pool_id }
        });
        if (!pool)
            return res.status(404).json({ error: 'Pool not found' });
        const weekly_hours = calculateWeeklyHours(validatedData.demand_matrix);
        const config = await prisma_1.default.poolDemandConfig.create({
            data: {
                pool_id: pool.id,
                effective_from: new Date(validatedData.effective_from),
                effective_to: validatedData.effective_to ? new Date(validatedData.effective_to) : null,
                demand_matrix: validatedData.demand_matrix,
                weekly_hours: weekly_hours,
            }
        });
        res.json({
            pool_id: pool.pool_id,
            effective_from: config.effective_from,
            effective_to: config.effective_to,
            weekly_hours: config.weekly_hours,
            demand_matrix: config.demand_matrix
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getPoolShortages(req, res) {
    try {
        const pool_id = req.params.pool_id;
        res.json([
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
        ]);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
