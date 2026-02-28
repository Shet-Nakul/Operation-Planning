"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOrganizations = listOrganizations;
exports.getOrganization = getOrganization;
exports.createOrganization = createOrganization;
exports.updateOrganization = updateOrganization;
exports.deleteOrganization = deleteOrganization;
const organizationsService_1 = require("../services/organizationsService");
const service = new organizationsService_1.OrganizationsService();
async function listOrganizations(req, res) {
    const { skip, take, search } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
    const orgs = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search, organizationId: orgId });
    res.json(orgs);
}
async function getOrganization(req, res) {
    const org = await service.get(Number(req.params.id));
    if (!org)
        return res.status(404).json({ error: 'Not found' });
    res.json(org);
}
async function createOrganization(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const org = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(org);
}
async function updateOrganization(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const org = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(org);
}
async function deleteOrganization(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const org = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(org);
}
