import { ResourceDailyCapacityRepository } from '../repositories/resourceDailyCapacityRepository';
import prisma from '../models/prisma';

export class ResourceDailyCapacityService {
  private repo = new ResourceDailyCapacityRepository();

  async list(params: { organizationId?: number; resourceId?: number; dayNumber?: number }) {
    return this.repo.findAll(params);
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    let dailyCapacity: any;
    await prisma.$transaction(async (tx) => {
      dailyCapacity = await tx.resource_daily_capacity.create({ data: { ...data } });
      if (data.availability_windows && Array.isArray(data.availability_windows)) {
        for (const win of data.availability_windows) {
          await tx.resource_availability_windows.create({
            data: { ...win, daily_capacity_id: dailyCapacity.id }
          });
        }
      }
    });
    const capacity = dailyCapacity!; // assert assigned after transaction
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: data.organization_id,
        action_type: 'CREATE_RESOURCE_DAILY_CAPACITY',
        entity_type: 'RESOURCE_DAILY_CAPACITY',
        entity_id: String(capacity.id),
        description: 'Resource daily capacity created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return capacity;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    let dailyCapacity: any;
    await prisma.$transaction(async (tx) => {
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
    const capacity = dailyCapacity!;
    await prisma.user_activity_logs.create({
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
    return capacity;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const dailyCapacity = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: dailyCapacity?.organization_id,
        action_type: 'DELETE_RESOURCE_DAILY_CAPACITY',
        entity_type: 'RESOURCE_DAILY_CAPACITY',
        entity_id: String(id),
        description: 'Resource daily capacity deleted',
        metadata: dailyCapacity ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return dailyCapacity;
  }
}
