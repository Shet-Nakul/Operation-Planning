"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = getActivityLogs;
exports.getActivityLogById = getActivityLogById;
exports.deleteActivityLog = deleteActivityLog;
const prisma_1 = __importDefault(require("../models/prisma"));
async function getActivityLogs(req, res) {
    try {
        const { page = 1, limit = 20, orgId, userId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (orgId)
            where.organization_id = Number(orgId);
        if (userId)
            where.user_id = Number(userId);
        const [logs, total] = await Promise.all([
            prisma_1.default.userActivityLog.findMany({
                where,
                skip,
                take: Number(limit),
                include: { user: true, organization: true },
                orderBy: { created_at: 'desc' },
            }),
            prisma_1.default.userActivityLog.count({ where }),
        ]);
        res.json({
            data: logs,
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
async function getActivityLogById(req, res) {
    try {
        const { id } = req.params;
        const log = await prisma_1.default.userActivityLog.findUnique({
            where: { id: Number(id) },
            include: { user: true, organization: true },
        });
        if (!log)
            return res.status(404).json({ error: 'Activity log not found' });
        res.json(log);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function deleteActivityLog(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.userActivityLog.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
