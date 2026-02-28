import prisma from '../models/prisma';
import { PlanningGlobalConfig } from '../models/planning_global_config';

export class PlanningGlobalConfigRepository {
  async findAll(params: { organizationId?: number; isActive?: boolean }) {
    return prisma.planning_global_config.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.isActive !== undefined ? { is_active: params.isActive } : {})
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findById(id: number): Promise<PlanningGlobalConfig | null> {
    return prisma.planning_global_config.findUnique({ where: { id } });
  }

  async create(data: Omit<PlanningGlobalConfig, "id" | "created_at">): Promise<PlanningGlobalConfig> {
    return prisma.planning_global_config.create({ data });
  }

  async update(id: number, data: Partial<PlanningGlobalConfig>): Promise<PlanningGlobalConfig | null> {
    return prisma.planning_global_config.update({ where: { id }, data });
  }

  async delete(id: number): Promise<PlanningGlobalConfig | null> {
    return prisma.planning_global_config.delete({ where: { id } });
  }
}
