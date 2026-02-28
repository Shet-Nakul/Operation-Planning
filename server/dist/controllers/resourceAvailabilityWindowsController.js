"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listResourceAvailabilityWindows = listResourceAvailabilityWindows;
exports.getResourceAvailabilityWindow = getResourceAvailabilityWindow;
exports.createResourceAvailabilityWindow = createResourceAvailabilityWindow;
exports.updateResourceAvailabilityWindow = updateResourceAvailabilityWindow;
exports.deleteResourceAvailabilityWindow = deleteResourceAvailabilityWindow;
const resourceAvailabilityWindowsService_1 = require("../services/resourceAvailabilityWindowsService");
const service = new resourceAvailabilityWindowsService_1.ResourceAvailabilityWindowsService();
async function listResourceAvailabilityWindows(req, res) {
    const { dailyCapacityId, isExtended } = req.query;
    const windows = await service.list({
        dailyCapacityId: dailyCapacityId ? Number(dailyCapacityId) : undefined,
        isExtended: isExtended === 'true' ? true : isExtended === 'false' ? false : undefined
    });
    res.json(windows);
}
async function getResourceAvailabilityWindow(req, res) {
    const win = await service.get(Number(req.params.id));
    if (!win)
        return res.status(404).json({ error: 'Not found' });
    res.json(win);
}
async function createResourceAvailabilityWindow(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const win = await service.create(req.body, actor, ip, userAgent);
    res.status(201).json(win);
}
async function updateResourceAvailabilityWindow(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const win = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
    res.json(win);
}
async function deleteResourceAvailabilityWindow(req, res) {
    const actor = req.user;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'] || '';
    const win = await service.delete(Number(req.params.id), actor, ip, userAgent);
    res.json(win);
}
