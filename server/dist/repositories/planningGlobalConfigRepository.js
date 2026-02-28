"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningGlobalConfigRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class PlanningGlobalConfigRepository {
    async findAll(params) {
        return prisma_1.default.planning_global_config.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.isActive !== undefined ? { is_active: params.isActive } : {})
            },
            orderBy: { created_at: 'desc' }
        });
    }
    async findById(id) {
        return prisma_1.default.planning_global_config.findUnique({ where: { id } });
    }
    async create(data) {
        return prisma_1.default.planning_global_config.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.planning_global_config.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.planning_global_config.delete({ where: { id } });
    }
}
exports.PlanningGlobalConfigRepository = PlanningGlobalConfigRepository;
