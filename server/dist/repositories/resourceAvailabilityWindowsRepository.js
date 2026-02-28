"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAvailabilityWindowsRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class ResourceAvailabilityWindowsRepository {
    async findAll(params) {
        return prisma_1.default.resource_availability_windows.findMany({
            where: {
                ...(params.dailyCapacityId ? { daily_capacity_id: params.dailyCapacityId } : {}),
                ...(params.isExtended !== undefined ? { is_extended: params.isExtended } : {})
            },
            orderBy: { start_time: 'asc' }
        });
    }
    async findById(id) {
        return prisma_1.default.resource_availability_windows.findUnique({ where: { id } });
    }
    async create(data) {
        return prisma_1.default.resource_availability_windows.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.resource_availability_windows.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.resource_availability_windows.delete({ where: { id } });
    }
}
exports.ResourceAvailabilityWindowsRepository = ResourceAvailabilityWindowsRepository;
