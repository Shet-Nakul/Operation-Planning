"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.getUsers = getUsers;
exports.getUserById = getUserById;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auditLogger_1 = require("../utils/auditLogger");
const userSchema = zod_1.z.object({
    organization_id: zod_1.z.number().optional(),
    role_id: zod_1.z.number(),
    first_name: zod_1.z.string(),
    last_name: zod_1.z.string().optional(),
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    is_active: zod_1.z.boolean().optional(),
});
async function createUser(req, res) {
    try {
        const validatedData = userSchema.parse(req.body);
        const hashedPassword = await bcrypt_1.default.hash(validatedData.password, 10);
        const user = await prisma_1.default.user.create({
            data: {
                organization_id: validatedData.organization_id,
                role_id: validatedData.role_id,
                first_name: validatedData.first_name,
                last_name: validatedData.last_name,
                email: validatedData.email,
                password_hash: hashedPassword,
                is_active: validatedData.is_active !== undefined ? validatedData.is_active : true,
            },
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'CREATE_USER',
            entity: 'User',
            entity_id: String(user.id),
            user_id: actor?.id,
            organization_id: user.organization_id || undefined,
            description: `User ${user.email} created`,
        });
        const { password_hash, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getUsers(req, res) {
    try {
        const { page = 1, limit = 10, orgId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (orgId)
            where.organization_id = Number(orgId);
        const [users, total] = await Promise.all([
            prisma_1.default.user.findMany({
                where,
                skip,
                take: Number(limit),
                include: { role: true, organization: true },
                orderBy: { created_at: 'desc' },
            }),
            prisma_1.default.user.count({ where }),
        ]);
        const usersWithoutPasswords = users.map((u) => {
            const { password_hash, refresh_token, ...rest } = u;
            return rest;
        });
        res.json({
            data: usersWithoutPasswords,
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
async function getUserById(req, res) {
    try {
        const { id } = req.params;
        const user = await prisma_1.default.user.findUnique({
            where: { id: Number(id) },
            include: { role: true, organization: true },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const { password_hash, refresh_token, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const validatedData = userSchema.partial().parse(req.body);
        const updateData = { ...validatedData };
        if (validatedData.password) {
            updateData.password_hash = await bcrypt_1.default.hash(validatedData.password, 10);
            delete updateData.password;
        }
        const user = await prisma_1.default.user.update({
            where: { id: Number(id) },
            data: updateData,
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'UPDATE_USER',
            entity: 'User',
            entity_id: String(user.id),
            user_id: actor?.id,
            organization_id: user.organization_id || undefined,
            description: `User ${user.email} updated`,
        });
        const { password_hash, refresh_token, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function deleteUser(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.user.delete({
            where: { id: Number(id) },
        });
        const actor = req.user;
        await (0, auditLogger_1.createAuditLog)({
            action: 'DELETE_USER',
            entity: 'User',
            entity_id: String(id),
            user_id: actor?.id,
            description: `User with ID ${id} deleted`,
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
