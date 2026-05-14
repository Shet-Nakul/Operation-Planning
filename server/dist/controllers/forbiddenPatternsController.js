"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createForbiddenPattern = createForbiddenPattern;
exports.getForbiddenPatterns = getForbiddenPatterns;
exports.updateForbiddenPattern = updateForbiddenPattern;
exports.deleteForbiddenPattern = deleteForbiddenPattern;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const forbiddenPatternSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    scope: zod_1.z.string().optional(),
    applies_to: zod_1.z.string().optional(),
    forbidden_patterns: zod_1.z.array(zod_1.z.any()),
    metadata: zod_1.z.any().optional(),
});
async function createForbiddenPattern(req, res) {
    try {
        const validatedData = forbiddenPatternSchema.parse(req.body);
        const pattern = await prisma_1.default.forbiddenPattern.create({
            data: {
                organization_id: validatedData.organization_id,
                scope: validatedData.scope || "GLOBAL",
                applies_to: validatedData.applies_to || "ALL_CONTRACT_TYPES",
                forbidden_patterns: validatedData.forbidden_patterns,
                metadata: validatedData.metadata || {},
            },
        });
        res.status(201).json(pattern);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getForbiddenPatterns(req, res) {
    try {
        const { orgId } = req.query;
        const patterns = await prisma_1.default.forbiddenPattern.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(patterns);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function updateForbiddenPattern(req, res) {
    try {
        const { id } = req.params;
        const validatedData = forbiddenPatternSchema.partial().parse(req.body);
        const pattern = await prisma_1.default.forbiddenPattern.update({
            where: { id: Number(id) },
            data: validatedData,
        });
        res.json(pattern);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function deleteForbiddenPattern(req, res) {
    try {
        const { id } = req.params;
        await prisma_1.default.forbiddenPattern.delete({
            where: { id: Number(id) },
        });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
