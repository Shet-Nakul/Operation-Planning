"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhaseRequirementsService = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class PhaseRequirementsService {
    async list(params) {
        return prisma_1.default.phase_requirements.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {})
            },
            orderBy: { name: 'asc' }
        });
    }
    async get(id) {
        return prisma_1.default.phase_requirements.findUnique({ where: { id } });
    }
    async create(data, actor, ip, userAgent) {
        const phase = await prisma_1.default.phase_requirements.create({ data: { ...data, created_by: actor.id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: phase.organization_id,
                action_type: 'CREATE_PHASE_REQUIREMENT',
                entity_type: 'PHASE',
                entity_id: String(phase.id),
                description: 'Phase requirement created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return phase;
    }
    async update(id, data, actor, ip, userAgent) {
        const before = await prisma_1.default.phase_requirements.findUnique({ where: { id } });
        const phase = await prisma_1.default.phase_requirements.update({ where: { id }, data: { ...data, updated_by: actor.id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: phase.organization_id,
                action_type: 'UPDATE_PHASE_REQUIREMENT',
                entity_type: 'PHASE',
                entity_id: String(phase.id),
                description: 'Phase requirement updated',
                metadata: { before, after: phase },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return phase;
    }
    async delete(id, actor, ip, userAgent) {
        const phase = await prisma_1.default.phase_requirements.delete({ where: { id } });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: phase.organization_id,
                action_type: 'DELETE_PHASE_REQUIREMENT',
                entity_type: 'PHASE',
                entity_id: String(id),
                description: 'Phase requirement deleted',
                metadata: phase,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return phase;
    }
}
exports.PhaseRequirementsService = PhaseRequirementsService;
