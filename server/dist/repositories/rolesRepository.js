"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesRepository = void 0;
const prisma_1 = __importDefault(require("../models/prisma"));
class RolesRepository {
    async findAll() {
        return prisma_1.default.roles.findMany({ orderBy: { name: 'asc' } });
    }
    async findById(id) {
        return prisma_1.default.roles.findUnique({ where: { id } });
    }
    async findByName(name) {
        return prisma_1.default.roles.findUnique({ where: { name } });
    }
    async create(data) {
        return prisma_1.default.roles.create({ data });
    }
    async update(id, data) {
        return prisma_1.default.roles.update({ where: { id }, data });
    }
    async delete(id) {
        return prisma_1.default.roles.delete({ where: { id } });
    }
}
exports.RolesRepository = RolesRepository;
