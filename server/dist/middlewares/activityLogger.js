"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = logActivity;
exports.logActivityDirect = logActivityDirect;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// Middleware version for app.use()
async function logActivity(req, res, next) {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const userId = req.user?.id || null;
        const orgId = req.body.organization_id || null;
        const entityType = req.baseUrl.split('/')[1];
        const entityId = req.body.id?.toString() || null;
        await prisma.userActivityLog.create({
            data: {
                user_id: userId,
                organization_id: orgId,
                action: req.method,
                entity: entityType,
                entity_id: entityId,
                metadata: req.body
            }
        });
    }
    next();
}
// Utility version for calling directly from services
async function logActivityDirect(req, action, entityType) {
    const userId = req.user?.id || null;
    const orgId = req.body.organization_id || null;
    const entityId = req.body.id?.toString() || null;
    await prisma.userActivityLog.create({
        data: {
            user_id: userId,
            organization_id: orgId,
            action: action,
            entity: entityType,
            entity_id: entityId,
            metadata: req.body
        }
    });
}
