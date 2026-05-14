"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRole = createRole;
exports.getRoles = getRoles;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const auditLogger_1 = require("../utils/auditLogger");
const roleSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
async function createRole(req, res) {
    try {
        const validatedData = roleSchema.parse(req.body);
        const role = await prisma_1.default.role.create({
            data: validatedData,
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'CREATE_ROLE',
            entity: 'Role',
            entity_id: String(role.id),
            user_id: actor?.id,
            description: `Role ${role.name} created`,
        });
        res.status(201).json(role);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getRoles(req, res) {
    try {
        const roles = await prisma_1.default.role.findMany();
        res.json(roles);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
