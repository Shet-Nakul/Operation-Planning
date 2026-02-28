"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourcesService = void 0;
const resourcesRepository_1 = require("../repositories/resourcesRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class ResourcesService {
    constructor() {
        this.repo = new resourcesRepository_1.ResourcesRepository();
    }
    async list(params) {
        return this.repo.findAll(params);
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        // Enforce unique (organization_id, code)
        const exists = await prisma_1.default.resources.findFirst({
            where: { organization_id: data.organization_id, code: data.code }
        });
        if (exists)
            throw new Error('Resource code must be unique within organization');
        const resource = await this.repo.create({ ...data, created_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: resource.organization_id,
                action_type: 'CREATE_RESOURCE',
                entity_type: 'RESOURCE',
                entity_id: String(resource.id),
                description: 'Resource created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return resource;
    }
    async update(id, data, actor, ip, userAgent) {
        // Enforce unique (organization_id, code) if code is changing
        if (data.code) {
            const exists = await prisma_1.default.resources.findFirst({
                where: { organization_id: data.organization_id, code: data.code, id: { not: id } }
            });
            if (exists)
                throw new Error('Resource code must be unique within organization');
        }
        const before = await this.repo.findById(id);
        const resource = await this.repo.update(id, { ...data, updated_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: resource.organization_id,
                action_type: 'UPDATE_RESOURCE',
                entity_type: 'RESOURCE',
                entity_id: String(resource.id),
                description: 'Resource updated',
                metadata: { before, after: resource },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return resource;
    }
    async delete(id, actor, ip, userAgent) {
        const resource = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: resource?.organization_id,
                action_type: 'DELETE_RESOURCE',
                entity_type: 'RESOURCE',
                entity_id: String(id),
                description: 'Resource deleted',
                metadata: resource,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return resource;
    }
}
exports.ResourcesService = ResourcesService;
