"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const usersRepository_1 = require("../repositories/usersRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class UsersService {
    constructor() {
        this.repo = new usersRepository_1.UsersRepository();
    }
    async list(params) {
        return this.repo.findAll(params);
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        const user = await this.repo.create({ ...data, created_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: user.organization_id,
                action_type: 'CREATE_USER',
                entity_type: 'USER',
                entity_id: String(user.id),
                description: 'User created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return user;
    }
    async update(id, data, actor, ip, userAgent) {
        const before = await this.repo.findById(id);
        const user = await this.repo.update(id, { ...data, updated_by: actor.id });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: user.organization_id,
                action_type: 'UPDATE_USER',
                entity_type: 'USER',
                entity_id: String(user.id),
                description: 'User updated',
                metadata: { before, after: user },
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return user;
    }
    async delete(id, actor, ip, userAgent) {
        const user = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: user?.organization_id,
                action_type: 'DELETE_USER',
                entity_type: 'USER',
                entity_id: String(id),
                description: 'User deleted',
                metadata: user,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return user;
    }
}
exports.UsersService = UsersService;
