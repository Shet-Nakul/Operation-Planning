"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function logActivity(req, res, next) {
    // Only log for create/update/delete
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const userId = req.user?.id || null;
        const orgId = req.body.organization_id || null;
        const entityType = req.baseUrl.split('/')[1];
        const entityId = req.body.id || null;
        await prisma.userActivityLog.create({
            data: {
                userId,
                organizationId: orgId,
                actionType: req.method,
                entityType,
                entityId,
                metadata: JSON.stringify(req.body)
            }
        });
    }
    next();
}
