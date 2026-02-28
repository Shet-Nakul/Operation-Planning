"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class OrganizationsRepository {
    async findAll(params) {
        return prisma_1.default.organizations.findMany({
            where: {
                ...(params.organizationId ? { id: params.organizationId } : {}),
                ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } } : {})
            },
            skip: params.skip,
            take: params.take,
            orderBy: { name: 'asc' }
        });
    }
    async findById(id) {
        return prisma_1.default.organizations.findUnique({ where: { id } });
    }
    async create(data) {
        return prisma_1.default.organizations.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.organizations.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.organizations.delete({ where: { id } });
    }
}
exports.OrganizationsRepository = OrganizationsRepository;
