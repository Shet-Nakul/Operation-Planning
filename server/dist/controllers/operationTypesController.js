"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOperationTypes = listOperationTypes;
exports.getOperationType = getOperationType;
exports.createOperationType = createOperationType;
exports.updateOperationType = updateOperationType;
exports.deleteOperationType = deleteOperationType;
const operationTypesService_1 = require("../services/operationTypesService");
const service = new operationTypesService_1.OperationTypesService();
async function listOperationTypes(req, res) {
    const { search } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
    const types = await service.list({ search: search, organizationId: orgId });
    res.json(types);
}
async function getOperationType(req, res) {
    const type = await service.get(Number(req.params.id));
    if (!type)
        return res.status(404).json({ error: 'Not found' });
    res.json(type);
}
async function createOperationType(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const type = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(type);
}
async function updateOperationType(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const type = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(type);
}
async function deleteOperationType(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const type = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(type);
}
