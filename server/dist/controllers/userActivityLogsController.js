"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActivityLogs = getActivityLogs;
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
