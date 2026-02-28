"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SurgeryPhaseRequirementsService = void 0;
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const activityLogger_1 = require("../middlewares/activityLogger");
const prisma = new client_1.PrismaClient();
const SurgeryPhaseRequirementSchema = zod_1.z.object({
    id: zod_1.z.number().optional(),
    phase_name: zod_1.z.string().min(1),
    requirement: zod_1.z.string().min(1),
    created_at: zod_1.z.date().optional(),
    updated_at: zod_1.z.date().optional(),
});
class SurgeryPhaseRequirementsService {
    static async list() {
        return prisma.surgery_phase_requirements.findMany();
    }
    static async getById(id) {
        return prisma.surgery_phase_requirements.findUnique({ where: { id } });
    }
    static async create(data, userId) {
        const parsed = SurgeryPhaseRequirementSchema.parse(data);
        const created = await prisma.surgery_phase_requirements.create({ data: parsed });
        await (0, activityLogger_1.logUserActivity)(userId, 'CREATE', 'surgery_phase_requirements', created.id, data);
        return created;
    }
    static async update(id, data, userId) {
        const parsed = SurgeryPhaseRequirementSchema.parse(data);
        const updated = await prisma.surgery_phase_requirements.update({ where: { id }, data: parsed });
        await (0, activityLogger_1.logUserActivity)(userId, 'UPDATE', 'surgery_phase_requirements', id, data);
        return updated;
    }
    static async delete(id, userId) {
        const deleted = await prisma.surgery_phase_requirements.delete({ where: { id } });
        await (0, activityLogger_1.logUserActivity)(userId, 'DELETE', 'surgery_phase_requirements', id, {});
        return deleted;
    }
}
exports.SurgeryPhaseRequirementsService = SurgeryPhaseRequirementsService;
