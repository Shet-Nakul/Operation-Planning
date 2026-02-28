import prisma from '../models/prisma';
import { ResourceAvailabilityWindow } from '../models/resource_availability_windows';

export class ResourceAvailabilityWindowsRepository {
  async findAll(params: { dailyCapacityId?: number; isExtended?: boolean }) {
    return prisma.resource_availability_windows.findMany({
      where: {
        ...(params.dailyCapacityId ? { daily_capacity_id: params.dailyCapacityId } : {}),
        ...(params.isExtended !== undefined ? { is_extended: params.isExtended } : {})
      },
      orderBy: { start_time: 'asc' }
    });
  }

  async findById(id: number): Promise<ResourceAvailabilityWindow | null> {
    return prisma.resource_availability_windows.findUnique({ where: { id } });
  }

  async create(data: Omit<ResourceAvailabilityWindow, "id" | "created_at">): Promise<ResourceAvailabilityWindow> {
    return prisma.resource_availability_windows.create({ data });
  }

  async update(id: number, data: Partial<ResourceAvailabilityWindow>): Promise<ResourceAvailabilityWindow | null> {
    return prisma.resource_availability_windows.update({ where: { id }, data });
  }

  async delete(id: number): Promise<ResourceAvailabilityWindow | null> {
    return prisma.resource_availability_windows.delete({ where: { id } });
  }
}
