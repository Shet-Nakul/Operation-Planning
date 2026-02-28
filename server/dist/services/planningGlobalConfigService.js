"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlanningGlobalConfigService = void 0;
const planningGlobalConfigRepository_1 = require("../repositories/planningGlobalConfigRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class PlanningGlobalConfigService {
    constructor() {
        this.repo = new planningGlobalConfigRepository_1.PlanningGlobalConfigRepository();
    }
    async list(params) {
        return this.repo.findAll(params);
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        // Enforce only one active config per org
        if (data.is_active) {
            await prisma_1.default.$transaction([
                prisma_1.default.planning_global_config.updateMany({
                    where: { organization_id: data.organization_id, is_active: true },
                    data: { is_active: false }
                }),
                prisma_1.default.planning_global_config.create({ data: { ...data, created_by: actor.id } })
            ]);
        }
        const config = await this.repo.create({ ...data, created_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: config.organization_id,
                action_type: 'CREATE_PLANNING_GLOBAL_CONFIG',
                entity_type: 'CONFIG',
                entity_id: String(config.id),
                description: 'Planning global config created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return config;
    }
    async update(id, data, actor, ip, userAgent) {
        // Enforce only one active config per org
        if (data.is_active) {
            await prisma_1.default.$transaction([
                prisma_1.default.planning_global_config.updateMany({
                    where: { organization_id: data.organization_id, is_active: true },
                    data: { is_active: false }
                }),
                prisma_1.default.planning_global_config.update({ where: { id }, data: { ...data, updated_by: actor.id } })
            ]);
        }
        const before = await this.repo.findById(id);
        const config = await this.repo.update(id, { ...data, updated_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: config.organization_id,
                action_type: 'UPDATE_PLANNING_GLOBAL_CONFIG',
                entity_type: 'CONFIG',
                entity_id: String(config.id),
                description: 'Planning global config updated',
                metadata: { before, after: config },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return config;
    }
    async delete(id, actor, ip, userAgent) {
        const config = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: config?.organization_id,
                action_type: 'DELETE_PLANNING_GLOBAL_CONFIG',
                entity_type: 'CONFIG',
                entity_id: String(id),
                description: 'Planning global config deleted',
                metadata: config,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return config;
    }
}
exports.PlanningGlobalConfigService = PlanningGlobalConfigService;
