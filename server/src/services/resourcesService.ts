import { ResourcesRepository } from '../repositories/resourcesRepository';
import prisma from '../models/prisma';

export class ResourcesService {
  private repo = new ResourcesRepository();

  async list(params: { organizationId?: number; skip?: number; take?: number; search?: string }) {
    return this.repo.findAll(params);
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    // Enforce unique (organization_id, code)
    const exists = await prisma.resources.findFirst({
      where: { organization_id: data.organization_id, code: data.code }
    });
    if (exists) throw new Error('Resource code must be unique within organization');
    const resource = await this.repo.create({ ...data, created_by: actor.id });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: resource.organization_id,
        action_type: 'CREATE_RESOURCE',
        entity_type: 'RESOURCE',
        entity_id: String(resource.id),
        description: 'Resource created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return resource;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    // Enforce unique (organization_id, code) if code is changing
    if (data.code) {
      const exists = await prisma.resources.findFirst({
        where: { organization_id: data.organization_id, code: data.code, id: { not: id } }
      });
      if (exists) throw new Error('Resource code must be unique within organization');
    }
    const before = await this.repo.findById(id);
    const resource = await this.repo.update(id, { ...data, updated_by: actor.id });
    if (!resource) throw new Error(`Resource ${id} not found`);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: resource.organization_id,
        action_type: 'UPDATE_RESOURCE',
        entity_type: 'RESOURCE',
        entity_id: String(resource.id),
        description: 'Resource updated',
        metadata: { before, after: resource },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return resource;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const resource = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: resource?.organization_id,
        action_type: 'DELETE_RESOURCE',
        entity_type: 'RESOURCE',
        entity_id: String(id),
        description: 'Resource deleted',
        metadata: resource ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return resource;
  }
}
