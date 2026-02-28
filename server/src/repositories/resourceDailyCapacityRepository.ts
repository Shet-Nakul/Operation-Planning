import prisma from '../models/prisma';
import { ResourceDailyCapacity } from '../models/resource_daily_capacity';

export class ResourceDailyCapacityRepository {
  async findAll(params: { organizationId?: number; resourceId?: number; dayNumber?: number }) {
    return prisma.resource_daily_capacity.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.resourceId ? { resource_id: params.resourceId } : {}),
        ...(params.dayNumber ? { day_number: params.dayNumber } : {})
      },
      orderBy: { day_number: 'asc' }
    });
  }

  async findById(id: number): Promise<ResourceDailyCapacity | null> {
    return prisma.resource_daily_capacity.findUnique({ where: { id } });
  }

  async create(data: Omit<ResourceDailyCapacity, "id" | "created_at">): Promise<ResourceDailyCapacity> {
    return prisma.resource_daily_capacity.create({ data });
  }

  async update(id: number, data: Partial<ResourceDailyCapacity>): Promise<ResourceDailyCapacity | null> {
    return prisma.resource_daily_capacity.update({ where: { id }, data });
  }

  async delete(id: number): Promise<ResourceDailyCapacity | null> {
    return prisma.resource_daily_capacity.delete({ where: { id } });
  }
}
