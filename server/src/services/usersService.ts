import { UsersRepository } from '../repositories/usersRepository';
import prisma from '../models/prisma';

export class UsersService {
  private repo = new UsersRepository();

  async list(params: { skip?: number; take?: number; search?: string; organizationId?: number }) {
    return this.repo.findAll(params);
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    const user = await this.repo.create({ ...data, created_by: actor.id });
    await prisma.user_activity_logs.create({
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

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    const before = await this.repo.findById(id);
    const user = await this.repo.update(id, { ...data, updated_by: actor.id });

    if (!user) throw new Error(`User ${id} not found`);

    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: user.organization_id,
        action_type: 'UPDATE_USER',
        entity_type: 'USER',
        entity_id: String(user.id),
        description: 'User updated',
        metadata: { before: before ?? {}, after: user },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return user;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const user = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        organization_id: user?.organization_id,
        action_type: 'DELETE_USER',
        entity_type: 'USER',
        entity_id: String(id),
        description: 'User deleted',
        metadata: user ?? {},   // null → {}
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return user;
  }
}
