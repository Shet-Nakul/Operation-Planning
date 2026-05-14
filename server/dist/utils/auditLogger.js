"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
const prisma_1 = __importDefault(require("../models/prisma"));
async function createAuditLog(data) {
    try {
        await prisma_1.default.userActivityLog.create({
            data: {
                action: data.action,
                entity: data.entity,
                entity_id: data.entity_id,
                user_id: data.user_id,
                organization_id: data.organization_id,
                description: data.description,
                metadata: data.metadata || {},
            },
        });
    }
    catch (error) {
        console.error('Failed to create audit log:', error);
    }
}
