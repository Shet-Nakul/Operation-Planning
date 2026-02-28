import { OrganizationsRepository } from '../repositories/organizationsRepository';
import prisma from '../models/prisma';

export class OrganizationsService {
  private repo = new OrganizationsRepository();

  async list(params: { skip?: number; take?: number; search?: string; organizationId?: number }) {
    return this.repo.findAll(params);
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    const org = await this.repo.create({ ...data, created_by: actor.id });
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: org.id,
        action_type: 'CREATE_ORGANIZATION',
        entity_type: 'ORGANIZATION',
        entity_id: String(org.id),
        description: 'Organization created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return org;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    const before = await this.repo.findById(id);
    const org = await this.repo.update(id, { ...data, updated_by: actor.id });
    
    if (!org) throw new Error(`Organization ${id} not found`);

    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: org.id,
        action_type: 'UPDATE_ORGANIZATION',
        entity_type: 'ORGANIZATION',
        entity_id: String(org.id),
        description: 'Organization updated',
        metadata: { before: before ?? {}, after: org },  // null-safe
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return org;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const org = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: org?.id,
        action_type: 'DELETE_ORGANIZATION',
        entity_type: 'ORGANIZATION',
        entity_id: String(id),
        description: 'Organization deleted',
        metadata: org ?? {},   // can't pass null directly
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return org;
  }
}
