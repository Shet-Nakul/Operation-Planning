"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceAvailabilityWindowsService = void 0;
const resourceAvailabilityWindowsRepository_1 = require("../repositories/resourceAvailabilityWindowsRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class ResourceAvailabilityWindowsService {
    constructor() {
        this.repo = new resourceAvailabilityWindowsRepository_1.ResourceAvailabilityWindowsRepository();
    }
    async list(params) {
        return this.repo.findAll(params);
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        const win = await this.repo.create(data);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                action_type: 'CREATE_RESOURCE_AVAILABILITY_WINDOW',
                entity_type: 'RESOURCE_AVAILABILITY_WINDOW',
                entity_id: String(win.id),
                description: 'Resource availability window created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return win;
    }
    async update(id, data, actor, ip, userAgent) {
        const before = await this.repo.findById(id);
        const win = await this.repo.update(id, data);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                action_type: 'UPDATE_RESOURCE_AVAILABILITY_WINDOW',
                entity_type: 'RESOURCE_AVAILABILITY_WINDOW',
                entity_id: String(win.id),
                description: 'Resource availability window updated',
                metadata: { before, after: win },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return win;
    }
    async delete(id, actor, ip, userAgent) {
        const win = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                action_type: 'DELETE_RESOURCE_AVAILABILITY_WINDOW',
                entity_type: 'RESOURCE_AVAILABILITY_WINDOW',
                entity_id: String(id),
                description: 'Resource availability window deleted',
                metadata: win,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return win;
    }
}
exports.ResourceAvailabilityWindowsService = ResourceAvailabilityWindowsService;
