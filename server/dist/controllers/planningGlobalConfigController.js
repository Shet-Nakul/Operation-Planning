"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPlanningGlobalConfigs = listPlanningGlobalConfigs;
exports.getPlanningGlobalConfig = getPlanningGlobalConfig;
exports.createPlanningGlobalConfig = createPlanningGlobalConfig;
exports.updatePlanningGlobalConfig = updatePlanningGlobalConfig;
exports.deletePlanningGlobalConfig = deletePlanningGlobalConfig;
const planningGlobalConfigService_1 = require("../services/planningGlobalConfigService");
const service = new planningGlobalConfigService_1.PlanningGlobalConfigService();
async function listPlanningGlobalConfigs(req, res) {
    const { organizationId, isActive } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? Number(organizationId) || undefined : actor.organization_id;
    const configs = await service.list({ organizationId: orgId, isActive: isActive === 'true' });
    res.json(configs);
}
async function getPlanningGlobalConfig(req, res) {
    const config = await service.get(Number(req.params.id));
    if (!config)
        return res.status(404).json({ error: 'Not found' });
    res.json(config);
}
async function createPlanningGlobalConfig(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const config = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(config);
}
async function updatePlanningGlobalConfig(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const config = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(config);
}
async function deletePlanningGlobalConfig(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const config = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(config);
}
