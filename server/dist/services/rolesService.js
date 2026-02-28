"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const rolesRepository_1 = require("../repositories/rolesRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class RolesService {
    constructor() {
        this.repo = new rolesRepository_1.RolesRepository();
    }
    async list() {
        return this.repo.findAll();
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        const role = await this.repo.create(data);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                action_type: 'CREATE_ROLE',
                entity_type: 'ROLE',
                entity_id: String(role.id),
                description: 'Role created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return role;
    }
    async update(id, data, actor, ip, userAgent) {
        const before = await this.repo.findById(id);
        const role = await this.repo.update(id, data);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                action_type: 'UPDATE_ROLE',
                entity_type: 'ROLE',
                entity_id: String(role.id),
                description: 'Role updated',
                metadata: { before, after: role },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return role;
    }
    async delete(id, actor, ip, userAgent) {
        const role = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                action_type: 'DELETE_ROLE',
                entity_type: 'ROLE',
                entity_id: String(id),
                description: 'Role deleted',
                metadata: role,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return role;
    }
}
exports.RolesService = RolesService;
