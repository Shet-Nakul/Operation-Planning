"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContract = createContract;
exports.getContracts = getContracts;
exports.getContractById = getContractById;
const prisma_1 = __importDefault(require("../models/prisma"));
const zod_1 = require("zod");
const contractSchema = zod_1.z.object({
    organization_id: zod_1.z.number(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(['STATIC', 'DYNAMIC']),
    status: zod_1.z.string().optional(),
    staff_tags: zod_1.z.array(zod_1.z.string()).optional(),
    configuration: zod_1.z.any().optional(),
    global_settings: zod_1.z.any().optional(),
    metadata: zod_1.z.any().optional(),
});
async function createContract(req, res) {
    try {
        const validatedData = contractSchema.parse(req.body);
        const contract = await prisma_1.default.contract.create({
            data: {
                organization_id: validatedData.organization_id,
                name: validatedData.name,
                type: validatedData.type,
                status: validatedData.status || "Active",
                staff_tags: validatedData.staff_tags || [],
                configuration: validatedData.configuration || {},
                global_settings: validatedData.global_settings || {},
                metadata: validatedData.metadata || {},
            },
        });
        res.status(201).json(contract);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
}
async function getContracts(req, res) {
    try {
        const { orgId } = req.query;
        const contracts = await prisma_1.default.contract.findMany({
            where: orgId ? { organization_id: Number(orgId) } : {},
        });
        res.json(contracts);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
async function getContractById(req, res) {
    try {
        const { id } = req.params;
        const contract = await prisma_1.default.contract.findUnique({
            where: { id: Number(id) },
        });
        if (!contract)
            return res.status(404).json({ error: 'Contract not found' });
        res.json(contract);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}
