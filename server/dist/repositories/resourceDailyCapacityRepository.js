"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceDailyCapacityRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class ResourceDailyCapacityRepository {
    async findAll(params) {
        return prisma_1.default.resource_daily_capacity.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.resourceId ? { resource_id: params.resourceId } : {}),
                ...(params.dayNumber ? { day_number: params.dayNumber } : {})
            },
            orderBy: { day_number: 'asc' }
        });
    }
    async findById(id) {
        return prisma_1.default.resource_daily_capacity.findUnique({ where: { id } });
    }
    async create(data) {
        return prisma_1.default.resource_daily_capacity.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.resource_daily_capacity.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.resource_daily_capacity.delete({ where: { id } });
    }
}
exports.ResourceDailyCapacityRepository = ResourceDailyCapacityRepository;
