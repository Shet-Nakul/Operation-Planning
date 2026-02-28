"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResourceDailyCapacities = listResourceDailyCapacities;
exports.getResourceDailyCapacity = getResourceDailyCapacity;
exports.createResourceDailyCapacity = createResourceDailyCapacity;
exports.updateResourceDailyCapacity = updateResourceDailyCapacity;
exports.deleteResourceDailyCapacity = deleteResourceDailyCapacity;
const resourceDailyCapacityService_1 = require("../services/resourceDailyCapacityService");
const service = new resourceDailyCapacityService_1.ResourceDailyCapacityService();
async function listResourceDailyCapacities(req, res) {
    const { organizationId, resourceId, dayNumber } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? Number(organizationId) || undefined : actor.organization_id;
    const capacities = await service.list({ organizationId: orgId, resourceId: resourceId ? Number(resourceId) : undefined, dayNumber: dayNumber ? Number(dayNumber) : undefined });
    res.json(capacities);
}
async function getResourceDailyCapacity(req, res) {
    const capacity = await service.get(Number(req.params.id));
    if (!capacity)
        return res.status(404).json({ error: 'Not found' });
    res.json(capacity);
}
async function createResourceDailyCapacity(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const capacity = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(capacity);
}
async function updateResourceDailyCapacity(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const capacity = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(capacity);
}
async function deleteResourceDailyCapacity(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const capacity = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(capacity);
}
