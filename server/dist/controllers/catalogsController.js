"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaffTag = createStaffTag;
exports.getStaffTags = getStaffTags;
exports.updateStaffTag = updateStaffTag;
exports.deleteStaffTag = deleteStaffTag;
exports.createSpecialization = createSpecialization;
exports.getSpecializations = getSpecializations;
exports.updateSpecialization = updateSpecialization;
exports.deleteSpecialization = deleteSpecialization;
exports.createSkill = createSkill;
exports.getSkills = getSkills;
exports.updateSkill = updateSkill;
exports.deleteSkill = deleteSkill;
exports.createShift = createShift;
exports.getShifts = getShifts;
exports.updateShift = updateShift;
exports.deleteShift = deleteShift;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
// Schema for StaffTag
const staffTagSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    name: zod_1.z.string(),
    color: zod_1.z.string().optional(),
});
// Schema for Specialization
const specializationSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
// Schema for Skill
const skillSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
// Schema for Shift
const shiftSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    name: zod_1.z.string(),
    start_time: zod_1.z.string(),
    end_time: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
/**
 * Handle Prisma unique constraint violation errors
 */
function handleUniqueError(err, res, entityName) {
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return res.status(409).json({
            error: `A ${entityName} with this name already exists for this organization.`
        });
    }
    return res.status(400).json({ error: err.message });
}
// --- Staff Tags (Roles) ---
async function createStaffTag(req, res) {
    try {
        const validatedData = staffTagSchema.parse(req.body);
        const tag = await prisma_1.default.staffTag.create({ data: validatedData });
        res.status(201).json(tag);
    }
    catch (err) {
        return handleUniqueError(err, res, 'staff tag');
    }
}
async function getStaffTags(req, res) {
    try {
        const { orgId } = req.query;
        const tags = await prisma_1.default.staffTag.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(tags);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateStaffTag(req, res) {
    try {
        const { id } = req.params;
        const validatedData = staffTagSchema.partial().parse(req.body);
        const tag = await prisma_1.default.staffTag.update({
            where: { id: Number(id) },
            data: validatedData,
        });
        res.json(tag);
    }
    catch (err) {
        return handleUniqueError(err, res, 'staff tag');
    }
}
async function deleteStaffTag(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.staffTag.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// --- Specializations ---
async function createSpecialization(req, res) {
    try {
        const validatedData = specializationSchema.parse(req.body);
        const specialization = await prisma_1.default.specialization.create({ data: validatedData });
        res.status(201).json(specialization);
    }
    catch (err) {
        return handleUniqueError(err, res, 'specialization');
    }
}
async function getSpecializations(req, res) {
    try {
        const { orgId } = req.query;
        const specializations = await prisma_1.default.specialization.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(specializations);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateSpecialization(req, res) {
    try {
        const { id } = req.params;
        const validatedData = specializationSchema.partial().parse(req.body);
        const specialization = await prisma_1.default.specialization.update({
            where: { id: Number(id) },
            data: validatedData,
        });
        res.json(specialization);
    }
    catch (err) {
        return handleUniqueError(err, res, 'specialization');
    }
}
async function deleteSpecialization(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.specialization.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// --- Skills ---
async function createSkill(req, res) {
    try {
        const validatedData = skillSchema.parse(req.body);
        const skill = await prisma_1.default.skill.create({ data: validatedData });
        res.status(201).json(skill);
    }
    catch (err) {
        return handleUniqueError(err, res, 'skill');
    }
}
async function getSkills(req, res) {
    try {
        const { orgId } = req.query;
        const skills = await prisma_1.default.skill.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(skills);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateSkill(req, res) {
    try {
        const { id } = req.params;
        const validatedData = skillSchema.partial().parse(req.body);
        const skill = await prisma_1.default.skill.update({
            where: { id: Number(id) },
            data: validatedData,
        });
        res.json(skill);
    }
    catch (err) {
        return handleUniqueError(err, res, 'skill');
    }
}
async function deleteSkill(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.skill.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// --- Shifts ---
async function createShift(req, res) {
    try {
        const validatedData = shiftSchema.parse(req.body);
        const shift = await prisma_1.default.shift.create({ data: validatedData });
        res.status(201).json(shift);
    }
    catch (err) {
        return handleUniqueError(err, res, 'shift');
    }
}
async function getShifts(req, res) {
    try {
        const { orgId } = req.query;
        const shifts = await prisma_1.default.shift.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(shifts);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateShift(req, res) {
    try {
        const { id } = req.params;
        const validatedData = shiftSchema.partial().parse(req.body);
        const shift = await prisma_1.default.shift.update({
            where: { id: Number(id) },
            data: validatedData,
        });
        res.json(shift);
    }
    catch (err) {
        return handleUniqueError(err, res, 'shift');
    }
}
async function deleteShift(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.shift.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
