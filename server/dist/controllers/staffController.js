"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStaff = createStaff;
exports.getStaff = getStaff;
exports.getStaffById = getStaffById;
exports.updateStaff = updateStaff;
exports.deleteStaff = deleteStaff;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const staffSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    personal_details: zod_1.z.object({
        staff_id: zod_1.z.string(),
        name: zod_1.z.string(),
        address: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
        email: zod_1.z.string().email().optional(),
        profile_picture: zod_1.z.string().optional(),
    }),
    professional_primary_details: zod_1.z.object({
        department: zod_1.z.string().optional(),
        designation: zod_1.z.string().optional(),
        contract_id: zod_1.z.string().optional(),
        supervisor: zod_1.z.string().optional(),
    }),
    professional_secondary_details: zod_1.z.object({
        skills: zod_1.z.array(zod_1.z.string()).optional(),
        certifications: zod_1.z.array(zod_1.z.string()).optional(),
        roles: zod_1.z.array(zod_1.z.string()).optional(),
        role_distribution: zod_1.z.record(zod_1.z.number()).optional(),
        weekly_template: zod_1.z.any().optional(),
        pool_assignments: zod_1.z.array(zod_1.z.any()).optional(),
    }),
});
async function createStaff(req, res) {
    try {
        const validatedData = staffSchema.parse(req.body);
        const staff = await prisma_1.default.staff.create({
            data: {
                organization_id: validatedData.organization_id,
                staff_id: validatedData.personal_details.staff_id,
                name: validatedData.personal_details.name,
                address: validatedData.personal_details.address,
                phone: validatedData.personal_details.phone,
                email: validatedData.personal_details.email,
                profile_picture: validatedData.personal_details.profile_picture,
                department: validatedData.professional_primary_details.department,
                designation: validatedData.professional_primary_details.designation,
                contract_id: validatedData.professional_primary_details.contract_id,
                supervisor: validatedData.professional_primary_details.supervisor,
                skills: validatedData.professional_secondary_details.skills || [],
                certifications: validatedData.professional_secondary_details.certifications || [],
                roles: validatedData.professional_secondary_details.roles || [],
                role_distribution: validatedData.professional_secondary_details.role_distribution || {},
                weekly_template: validatedData.professional_secondary_details.weekly_template || {},
                pool_assignments: validatedData.professional_secondary_details.pool_assignments || [],
            },
        });
        res.status(201).json(staff);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getStaff(req, res) {
    try {
        const { orgId } = req.query;
        const staff = await prisma_1.default.staff.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(staff);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getStaffById(req, res) {
    try {
        const { id } = req.params;
        const staff = await prisma_1.default.staff.findUnique({
            where: { id: Number(id) },
        });
        if (!staff)
            return res.status(404).json({ error: 'Staff member not found' });
        res.json(staff);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateStaff(req, res) {
    try {
        const { id } = req.params;
        const validatedData = staffSchema.partial().parse(req.body);
        // Flatten updated data for Prisma
        const updateData = {};
        if (validatedData.personal_details) {
            if (validatedData.personal_details.name)
                updateData.name = validatedData.personal_details.name;
            if (validatedData.personal_details.staff_id)
                updateData.staff_id = validatedData.personal_details.staff_id;
            if (validatedData.personal_details.address)
                updateData.address = validatedData.personal_details.address;
            if (validatedData.personal_details.phone)
                updateData.phone = validatedData.personal_details.phone;
            if (validatedData.personal_details.email)
                updateData.email = validatedData.personal_details.email;
            if (validatedData.personal_details.profile_picture)
                updateData.profile_picture = validatedData.personal_details.profile_picture;
        }
        if (validatedData.professional_primary_details) {
            if (validatedData.professional_primary_details.department)
                updateData.department = validatedData.professional_primary_details.department;
            if (validatedData.professional_primary_details.designation)
                updateData.designation = validatedData.professional_primary_details.designation;
            if (validatedData.professional_primary_details.contract_id)
                updateData.contract_id = validatedData.professional_primary_details.contract_id;
            if (validatedData.professional_primary_details.supervisor)
                updateData.supervisor = validatedData.professional_primary_details.supervisor;
        }
        if (validatedData.professional_secondary_details) {
            if (validatedData.professional_secondary_details.skills)
                updateData.skills = validatedData.professional_secondary_details.skills;
            if (validatedData.professional_secondary_details.certifications)
                updateData.certifications = validatedData.professional_secondary_details.certifications;
            if (validatedData.professional_secondary_details.roles)
                updateData.roles = validatedData.professional_secondary_details.roles;
            if (validatedData.professional_secondary_details.role_distribution)
                updateData.role_distribution = validatedData.professional_secondary_details.role_distribution;
            if (validatedData.professional_secondary_details.weekly_template)
                updateData.weekly_template = validatedData.professional_secondary_details.weekly_template;
            if (validatedData.professional_secondary_details.pool_assignments)
                updateData.pool_assignments = validatedData.professional_secondary_details.pool_assignments;
        }
        const staff = await prisma_1.default.staff.update({
            where: { id: Number(id) },
            data: updateData,
        });
        res.json(staff);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function deleteStaff(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.staff.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
