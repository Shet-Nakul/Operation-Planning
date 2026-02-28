"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InfectionTypesService = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const activityLogger_1 = require("../middlewares/activityLogger");
const prisma = new client_1.PrismaClient();
const InfectionTypeSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    name: zod_1.z.string().min(1),
    description: zod_1.z.string().optional(),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
class InfectionTypesService {
    static async list() {
        return prisma.infection_types.findMany();
    }
    static async getById(id) {
        return prisma.infection_types.findUnique({ where: { id } });
    }
    static async create(data, userId) {
        const parsed = InfectionTypeSchema.parse(data);
        const created = await prisma.infection_types.create({ data: parsed });
        await (0, activityLogger_1.logUserActivity)(userId, 'CREATE', 'infection_types', created.id, data);
        return created;
    }
    static async update(id, data, userId) {
        const parsed = InfectionTypeSchema.parse(data);
        const updated = await prisma.infection_types.update({ where: { id }, data: parsed });
        await (0, activityLogger_1.logUserActivity)(userId, 'UPDATE', 'infection_types', id, data);
        return updated;
    }
    static async delete(id, userId) {
        const deleted = await prisma.infection_types.delete({ where: { id } });
        await (0, activityLogger_1.logUserActivity)(userId, 'DELETE', 'infection_types', id, {});
        return deleted;
    }
}
exports.InfectionTypesService = InfectionTypesService;
