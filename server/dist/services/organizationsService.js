"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsService = void 0;
const organizationsRepository_1 = require("../repositories/organizationsRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class OrganizationsService {
    constructor() {
        this.repo = new organizationsRepository_1.OrganizationsRepository();
    }
    async list(params) {
        return this.repo.findAll(params);
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        const org = await this.repo.create({ ...data, created_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: org.id,
                action_type: 'CREATE_ORGANIZATION',
                entity_type: 'ORGANIZATION',
                entity_id: String(org.id),
                description: 'Organization created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return org;
    }
    async update(id, data, actor, ip, userAgent) {
        const before = await this.repo.findById(id);
        const org = await this.repo.update(id, { ...data, updated_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: org.id,
                action_type: 'UPDATE_ORGANIZATION',
                entity_type: 'ORGANIZATION',
                entity_id: String(org.id),
                description: 'Organization updated',
                metadata: { before, after: org },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return org;
    }
    async delete(id, actor, ip, userAgent) {
        const org = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: org?.id,
                action_type: 'DELETE_ORGANIZATION',
                entity_type: 'ORGANIZATION',
                entity_id: String(id),
                description: 'Organization deleted',
                metadata: org,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return org;
    }
}
exports.OrganizationsService = OrganizationsService;
