"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class UsersRepository {
    async findAll(params) {
        return prisma_1.default.users.findMany({
            where: {
                ...(params.organizationId ? { organization_id: params.organizationId } : {}),
                ...(params.search ? { email: { contains: params.search, mode: 'insensitive' } } : {})
            },
            skip: params.skip,
            take: params.take,
            orderBy: { email: 'asc' }
        });
    }
    async findById(id) {
        return prisma_1.default.users.findUnique({ where: { id } });
    }
    async findByEmail(email) {
        return prisma_1.default.users.findUnique({ where: { email } });
    }
    async create(data) {
        return prisma_1.default.users.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.users.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.users.delete({ where: { id } });
    }
}
exports.UsersRepository = UsersRepository;
