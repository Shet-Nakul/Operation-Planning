import { RolesRepository } from '../repositories/rolesRepository';
import prisma from '../models/prisma';

export class RolesService {
  private repo = new RolesRepository();

  async list() {
    return this.repo.findAll();
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    const role = await this.repo.create(data);
    await prisma.user_activity_logs.create({
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

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    const before = await this.repo.findById(id);
    const role = await this.repo.update(id, data);

    if (!role) throw new Error(`Role ${id} not found`);

    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        action_type: 'UPDATE_ROLE',
        entity_type: 'ROLE',
        entity_id: String(role.id),
        description: 'Role updated',
        metadata: { before: before ?? {}, after: role },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return role;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const role = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        action_type: 'DELETE_ROLE',
        entity_type: 'ROLE',
        entity_id: String(id),
        description: 'Role deleted',
        metadata: role ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return role;
  }
}
