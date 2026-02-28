"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceDailyCapacityService = void 0;
const resourceDailyCapacityRepository_1 = require("../repositories/resourceDailyCapacityRepository");
const prisma_1 = __importDefault(require("../models/prisma"));
class ResourceDailyCapacityService {
    constructor() {
        this.repo = new resourceDailyCapacityRepository_1.ResourceDailyCapacityRepository();
    }
    async list(params) {
        return this.repo.findAll(params);
    }
    async get(id) {
        return this.repo.findById(id);
    }
    async create(data, actor, ip, userAgent) {
        // Use transaction if availability windows are included
        let dailyCapacity;
        await prisma_1.default.$transaction(async (tx) => {
            dailyCapacity = await tx.resource_daily_capacity.create({ data: { ...data } });
            if (data.availability_windows && Array.isArray(data.availability_windows)) {
                for (const win of data.availability_windows) {
                    await tx.resource_availability_windows.create({
                        data: { ...win, daily_capacity_id: dailyCapacity.id }
                    });
                }
            }
        });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: data.organization_id,
                action_type: 'CREATE_RESOURCE_DAILY_CAPACITY',
                entity_type: 'RESOURCE_DAILY_CAPACITY',
                entity_id: String(dailyCapacity.id),
                description: 'Resource daily capacity created',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return dailyCapacity;
    }
    async update(id, data, actor, ip, userAgent) {
        // Use transaction if availability windows are included
        let dailyCapacity;
        await prisma_1.default.$transaction(async (tx) => {
            dailyCapacity = await tx.resource_daily_capacity.update({ where: { id }, data: { ...data } });
            if (data.availability_windows && Array.isArray(data.availability_windows)) {
                await tx.resource_availability_windows.deleteMany({ where: { daily_capacity_id: id } });
                for (const win of data.availability_windows) {
                    await tx.resource_availability_windows.create({
                        data: { ...win, daily_capacity_id: id }
                    });
                }
            }
        });
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: data.organization_id,
                action_type: 'UPDATE_RESOURCE_DAILY_CAPACITY',
                entity_type: 'RESOURCE_DAILY_CAPACITY',
                entity_id: String(id),
                description: 'Resource daily capacity updated',
                metadata: data,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return dailyCapacity;
    }
    async delete(id, actor, ip, userAgent) {
        const dailyCapacity = await this.repo.delete(id);
        await prisma_1.default.user_activity_logs.create({
            data: {
                user_id: actor.id,
                organization_id: dailyCapacity?.organization_id,
                action_type: 'DELETE_RESOURCE_DAILY_CAPACITY',
                entity_type: 'RESOURCE_DAILY_CAPACITY',
                entity_id: String(id),
                description: 'Resource daily capacity deleted',
                metadata: dailyCapacity,
                ip_address: ip,
                user_agent: userAgent
            }
        });
        return dailyCapacity;
    }
}
exports.ResourceDailyCapacityService = ResourceDailyCapacityService;
