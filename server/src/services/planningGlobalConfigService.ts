import { PlanningGlobalConfigRepository } from '../repositories/planningGlobalConfigRepository';
import prisma from '../models/prisma';

export class PlanningGlobalConfigService {
  private repo = new PlanningGlobalConfigRepository();

  async list(params: { organizationId?: number; isActive?: boolean }) {
    return this.repo.findAll(params);
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    if (data.is_active) {
      await prisma.$transaction([
        prisma.planning_global_config.updateMany({
          where: { organization_id: data.organization_id, is_active: true },
          data: { is_active: false }
        }),
        prisma.planning_global_config.create({ data: { ...data, created_by: actor.id } })
      ]);
    }
    const config = await this.repo.create({ ...data, created_by: actor.id });
    await prisma.user_activity_logs.create({
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

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    if (data.is_active) {
      await prisma.$transaction([
        prisma.planning_global_config.updateMany({
          where: { organization_id: data.organization_id, is_active: true },
          data: { is_active: false }
        }),
        prisma.planning_global_config.update({ where: { id }, data: { ...data, updated_by: actor.id } })
      ]);
    }
    const before = await this.repo.findById(id);
    const config = await this.repo.update(id, { ...data, updated_by: actor.id });

    if (!config) throw new Error(`Config ${id} not found`);

    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: config.organization_id,
        action_type: 'UPDATE_PLANNING_GLOBAL_CONFIG',
        entity_type: 'CONFIG',
        entity_id: String(config.id),
        description: 'Planning global config updated',
        metadata: { before: before ?? {}, after: config },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return config;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const config = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: config?.organization_id,
        action_type: 'DELETE_PLANNING_GLOBAL_CONFIG',
        entity_type: 'CONFIG',
        entity_id: String(id),
        description: 'Planning global config deleted',
        metadata: config ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return config;
  }
}
