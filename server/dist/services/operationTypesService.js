"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationTypesService = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class OperationTypesService {
    async list(params) {
        return prisma_1.default.operation_types.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {})
            },
            orderBy: { name: 'asc' }
        });
    }
    async get(id) {
        return prisma_1.default.operation_types.findUnique({ where: { id } });
    }
    async create(data, actor, ip, userAgent) {
        const opType = await prisma_1.default.operation_types.create({ data: { ...data, created_by: actor.id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: opType.organization_id,
                action_type: 'CREATE_OPERATION_TYPE',
                entity_type: 'OPERATION_TYPE',
                entity_id: String(opType.id),
                description: 'Operation type created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return opType;
    }
    async update(id, data, actor, ip, userAgent) {
        const before = await prisma_1.default.operation_types.findUnique({ where: { id } });
        const opType = await prisma_1.default.operation_types.update({ where: { id }, data: { ...data, updated_by: actor.id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: opType.organization_id,
                action_type: 'UPDATE_OPERATION_TYPE',
                entity_type: 'OPERATION_TYPE',
                entity_id: String(opType.id),
                description: 'Operation type updated',
                metadata: { before, after: opType },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return opType;
    }
    async delete(id, actor, ip, userAgent) {
        const opType = await prisma_1.default.operation_types.delete({ where: { id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: opType.organization_id,
                action_type: 'DELETE_OPERATION_TYPE',
                entity_type: 'OPERATION_TYPE',
                entity_id: String(id),
                description: 'Operation type deleted',
                metadata: opType,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return opType;
    }
}
exports.OperationTypesService = OperationTypesService;
