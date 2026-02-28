"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listUsers = listUsers;
exports.getUser = getUser;
exports.createUser = createUser;
exports.updateUser = updateUser;
exports.deleteUser = deleteUser;
const usersService_1 = require("../services/usersService");
const service = new usersService_1.UsersService();
async function listUsers(req, res) {
    const { skip, take, search } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
    const users = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search, organizationId: orgId });
    res.json(users);
}
async function getUser(req, res) {
    const user = await service.get(Number(req.params.id));
    if (!user)
        return res.status(404).json({ error: 'Not found' });
    res.json(user);
}
async function createUser(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const user = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(user);
}
async function updateUser(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const user = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(user);
}
async function deleteUser(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const user = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(user);
}
