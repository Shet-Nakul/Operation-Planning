"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPhaseRequirements = listPhaseRequirements;
exports.getPhaseRequirement = getPhaseRequirement;
exports.createPhaseRequirement = createPhaseRequirement;
exports.updatePhaseRequirement = updatePhaseRequirement;
exports.deletePhaseRequirement = deletePhaseRequirement;
const phaseRequirementsService_1 = require("../services/phaseRequirementsService");
const service = new phaseRequirementsService_1.PhaseRequirementsService();
async function listPhaseRequirements(req, res) {
    const { search } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
    const phases = await service.list({ search: search, organizationId: orgId });
    res.json(phases);
}
async function getPhaseRequirement(req, res) {
    const phase = await service.get(Number(req.params.id));
    if (!phase)
        return res.status(404).json({ error: 'Not found' });
    res.json(phase);
}
async function createPhaseRequirement(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const phase = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(phase);
}
async function updatePhaseRequirement(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const phase = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(phase);
}
async function deletePhaseRequirement(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const phase = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(phase);
}
