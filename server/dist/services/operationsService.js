"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperationsService = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class OperationsService {
    async list(params) {
        return prisma_1.default.operations.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.status ? { status: params.status } : {}),
                ...(params.search ? { operation_code: { contains: params.search, mode: 'insensitive' } } : {})
            },
            skip: params.skip,
            take: params.take,
            orderBy: { created_at: 'desc' }
        });
    }
    async get(id) {
        return prisma_1.default.operations.findUnique({ where: { id } });
    }
    async create(data, actor, ip, userAgent) {
        // Validate earliest_day <= latest_day
        if (data.earliest_day > data.latest_day)
            throw new Error('earliest_day must be <= latest_day');
        let operation;
        await prisma_1.default.$transaction(async (tx) => {
            operation = await tx.operations.create({ data: { ...data, created_by: actor.id } });
            if (data.surgery_phase_requirements && Array.isArray(data.surgery_phase_requirements)) {
                for (const phase of data.surgery_phase_requirements) {
                    const spr = await tx.surgery_phase_requirements.create({
                        data: { ...phase, operation_id: operation.id, organization_id: operation.organization_id }
                    });
                    if (phase.assigned_resources) {
                        for (const ar of phase.assigned_resources) {
                            await tx.surgery_phase_assigned_resources.create({
                                data: { ...ar, phase_requirement_id: spr.id }
                            });
                        }
                    }
                    if (phase.candidate_resources) {
                        for (const cr of phase.candidate_resources) {
                            await tx.surgery_phase_candidate_resources.create({
                                data: { ...cr, phase_requirement_id: spr.id }
                            });
                        }
                    }
                }
            }
        });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: data.organization_id,
                action_type: 'CREATE_OPERATION',
                entity_type: 'OPERATION',
                entity_id: String(operation.id),
                description: 'Operation created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return operation;
    }
    async update(id, data, actor, ip, userAgent) {
        if (data.earliest_day && data.latest_day && data.earliest_day > data.latest_day)
            throw new Error('earliest_day must be <= latest_day');
        const before = await prisma_1.default.operations.findUnique({ where: { id } });
        const operation = await prisma_1.default.operations.update({ where: { id }, data: { ...data, updated_by: actor.id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: operation.organization_id,
                action_type: 'UPDATE_OPERATION',
                entity_type: 'OPERATION',
                entity_id: String(operation.id),
                description: 'Operation updated',
                metadata: { before, after: operation },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return operation;
    }
    async delete(id, actor, ip, userAgent) {
        const operation = await prisma_1.default.operations.delete({ where: { id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: operation.organization_id,
                action_type: 'DELETE_OPERATION',
                entity_type: 'OPERATION',
                entity_id: String(id),
                description: 'Operation deleted',
                metadata: operation,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return operation;
    }
}
exports.OperationsService = OperationsService;
