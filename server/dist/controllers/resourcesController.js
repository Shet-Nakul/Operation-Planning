"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResources = listResources;
exports.getResource = getResource;
exports.createResource = createResource;
exports.updateResource = updateResource;
exports.deleteResource = deleteResource;
const resourcesService_1 = require("../services/resourcesService");
const service = new resourcesService_1.ResourcesService();
async function listResources(req, res) {
    const { skip, take, search } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
    const resources = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search, organizationId: orgId });
    res.json(resources);
}
async function getResource(req, res) {
    const resource = await service.get(Number(req.params.id));
    if (!resource)
        return res.status(404).json({ error: 'Not found' });
    res.json(resource);
}
async function createResource(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const resource = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(resource);
}
async function updateResource(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const resource = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(resource);
}
async function deleteResource(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const resource = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(resource);
}
