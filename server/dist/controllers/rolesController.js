"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listRoles = listRoles;
exports.getRole = getRole;
exports.createRole = createRole;
exports.updateRole = updateRole;
exports.deleteRole = deleteRole;
const rolesService_1 = require("../services/rolesService");
const service = new rolesService_1.RolesService();
async function listRoles(req, res) {
    const roles = await service.list();
    res.json(roles);
}
async function getRole(req, res) {
    const role = await service.get(Number(req.params.id));
    if (!role)
        return res.status(404).json({ error: 'Not found' });
    res.json(role);
}
async function createRole(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const role = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(role);
}
async function updateRole(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const role = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(role);
}
async function deleteRole(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const role = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(role);
}
