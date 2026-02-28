"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listOperations = listOperations;
exports.getOperation = getOperation;
exports.createOperation = createOperation;
exports.updateOperation = updateOperation;
exports.deleteOperation = deleteOperation;
const operationsService_1 = require("../services/operationsService");
const service = new operationsService_1.OperationsService();
async function listOperations(req, res) {
    const { skip, take, search, status } = req.query;
    const actor = req.user;
    const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
    const operations = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search, status: status, organizationId: orgId });
    res.json(operations);
}
async function getOperation(req, res) {
    const operation = await service.get(Number(req.params.id));
    if (!operation)
        return res.status(404).json({ error: 'Not found' });
    res.json(operation);
}
async function createOperation(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const operation = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(operation);
}
async function updateOperation(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const operation = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(operation);
}
async function deleteOperation(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const operation = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(operation);
}
