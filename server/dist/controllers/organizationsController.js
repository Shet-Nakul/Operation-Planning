"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrganization = createOrganization;
exports.getOrganizations = getOrganizations;
exports.getOrganizationById = getOrganizationById;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const auditLogger_1 = require("../utils/auditLogger");
const organizationSchema = zod_1.z.object({
    name: zod_1.z.string(),
    contact_number: zod_1.z.string().optional(),
    contact_email: zod_1.z.string().email().optional(),
    status: zod_1.z.string().optional(),
});
async function createOrganization(req, res) {
    try {
        const validatedData = organizationSchema.parse(req.body);
        const org = await prisma_1.default.organization.create({
            data: validatedData,
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'CREATE_ORGANIZATION',
            entity: 'Organization',
            entity_id: String(org.id),
            user_id: actor?.id,
            organization_id: org.id,
            description: `Organization ${org.name} created`,
        });
        res.status(201).json(org);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getOrganizations(req, res) {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [orgs, total] = await Promise.all([
            prisma_1.default.organization.findMany({
                skip,
                take: Number(limit),
                orderBy: { created_at: 'desc' },
            }),
            prisma_1.default.organization.count(),
        ]);
        res.json({
            data: orgs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getOrganizationById(req, res) {
    try {
        const { id } = req.params;
        const org = await prisma_1.default.organization.findUnique({
            where: { id: Number(id) },
        });
        if (!org)
            return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateOrganization(req, res) {
    try {
        const { id } = req.params;
        const validatedData = organizationSchema.partial().parse(req.body);
        const org = await prisma_1.default.organization.update({
            where: { id: Number(id) },
            data: validatedData,
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'UPDATE_ORGANIZATION',
            entity: 'Organization',
            entity_id: String(org.id),
            user_id: actor?.id,
            organization_id: org.id,
            description: `Organization ${org.name} updated`,
        });
        res.json(org);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function deleteOrganization(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.organization.delete({
            where: { id: Number(id) },
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'DELETE_ORGANIZATION',
            entity: 'Organization',
            entity_id: String(id),
            user_id: actor?.id,
            description: `Organization with ID ${id} deleted`,
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
