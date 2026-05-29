"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNonRenewableResource = createNonRenewableResource;
exports.getNonRenewableResources = getNonRenewableResources;
exports.getNonRenewableResourceById = getNonRenewableResourceById;
exports.updateNonRenewableResource = updateNonRenewableResource;
exports.deleteNonRenewableResource = deleteNonRenewableResource;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const createNonRenewableResourceSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    name: zod_1.z.string(),
    spec: zod_1.z.string().optional(),
    category: zod_1.z.string(),
    uom: zod_1.z.string(),
    stockpile_qty: zod_1.z.number(),
    min_required_qty: zod_1.z.number(),
    status: zod_1.z.string().optional().default('AVAILABLE')
});
const updateNonRenewableResourceSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    spec: zod_1.z.string().optional(),
    category: zod_1.z.string().optional(),
    uom: zod_1.z.string().optional(),
    stockpile_qty: zod_1.z.number().optional(),
    min_required_qty: zod_1.z.number().optional(),
    status: zod_1.z.string().optional()
});
async function createNonRenewableResource(req, res) {
    try {
        const validatedData = createNonRenewableResourceSchema.parse(req.body);
        const resourceId = `NR-${Date.now()}`; // Simple ID generation
        const resource = await prisma_1.default.nonRenewableResource.create({
            data: {
                organization_id: validatedData.organization_id,
                resource_id: resourceId,
                name: validatedData.name,
                spec: validatedData.spec,
                category: validatedData.category,
                uom: validatedData.uom,
                stockpile_qty: validatedData.stockpile_qty,
                min_required_qty: validatedData.min_required_qty,
                status: validatedData.status,
            }
        });
        res.status(201).json(resource);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getNonRenewableResources(req, res) {
    try {
        const { query, category, status, limit, orgId } = req.query;
        const where = {};
        if (orgId)
            where.organization_id = Number(orgId);
        if (query)
            where.name = { contains: String(query), mode: 'insensitive' };
        if (category)
            where.category = category;
        if (status)
            where.status = status;
        const take = limit ? Number(limit) : undefined;
        const resources = await prisma_1.default.nonRenewableResource.findMany({
            where,
            take: take,
            orderBy: { updated_at: 'desc' }
        });
        res.json(resources);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getNonRenewableResourceById(req, res) {
    try {
        const resource_id = req.params.resource_id;
        const resource = await prisma_1.default.nonRenewableResource.findUnique({
            where: { resource_id: resource_id }
        });
        if (!resource) {
            return res.status(404).json({ error: 'Resource not found' });
        }
        res.json(resource);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateNonRenewableResource(req, res) {
    try {
        const resource_id = req.params.resource_id;
        const validatedData = updateNonRenewableResourceSchema.parse(req.body);
        const resource = await prisma_1.default.nonRenewableResource.update({
            where: { resource_id: resource_id },
            data: validatedData
        });
        res.json(resource);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function deleteNonRenewableResource(req, res) {
    try {
        const resource_id = req.params.resource_id;
        await prisma_1.default.nonRenewableResource.delete({
            where: { resource_id: resource_id }
        });
        res.json({
            resource_id: resource_id,
            deleted: true,
            deleted_at: new Date().toISOString()
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
