"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class ResourcesRepository {
    async findAll(params) {
        return prisma_1.default.resources.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {})
            },
            skip: params.skip,
            take: params.take,
            orderBy: { name: 'asc' }
        });
    }
    async findById(id) {
        return prisma_1.default.resources.findUnique({ where: { id } });
    }
    async create(data) {
        return prisma_1.default.resources.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.resources.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.resources.delete({ where: { id } });
    }
}
exports.ResourcesRepository = ResourcesRepository;
