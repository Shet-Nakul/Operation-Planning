"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertGlobalSettings = upsertGlobalSettings;
exports.getGlobalSettings = getGlobalSettings;
exports.deleteGlobalSettings = deleteGlobalSettings;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const globalSettingsSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    business_hours_start: zod_1.z.string().optional(),
    business_hours_end: zod_1.z.string().optional(),
    surgery_planning_horizon: zod_1.z.number().optional(),
    roster_planning_horizon: zod_1.z.number().optional(),
    surgery_planning_resolution: zod_1.z.number().optional(),
});
async function upsertGlobalSettings(req, res) {
    try {
        const validatedData = globalSettingsSchema.parse(req.body);
        const settings = await prisma_1.default.globalSettings.upsert({
            where: { organization_id: validatedData.organization_id },
            update: validatedData,
            create: validatedData,
        });
        res.json(settings);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getGlobalSettings(req, res) {
    try {
        const { orgId } = req.params;
        const settings = await prisma_1.default.globalSettings.findUnique({
            where: { organization_id: Number(orgId) },
        });
        if (!settings)
            return res.status(404).json({ error: 'Global settings not found' });
        res.json(settings);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function deleteGlobalSettings(req, res) {
    try {
        const { orgId } = req.params;
        await prisma_1.default.globalSettings.delete({
            where: { organization_id: Number(orgId) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
