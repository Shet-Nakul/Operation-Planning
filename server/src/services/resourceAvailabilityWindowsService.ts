import { ResourceAvailabilityWindowsRepository } from '../repositories/resourceAvailabilityWindowsRepository';
import prisma from '../models/prisma';

export class ResourceAvailabilityWindowsService {
  private repo = new ResourceAvailabilityWindowsRepository();

  async list(params: { dailyCapacityId?: number; isExtended?: boolean }) {
    return this.repo.findAll(params);
  }

  async get(id: number) {
    return this.repo.findById(id);
  }

  async create(data: any, actor: any, ip: string, userAgent: string) {
    const win = await this.repo.create(data);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        action_type: 'CREATE_RESOURCE_AVAILABILITY_WINDOW',
        entity_type: 'RESOURCE_AVAILABILITY_WINDOW',
        entity_id: String(win.id),
        description: 'Resource availability window created',
        metadata: data,
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return win;
  }

  async update(id: number, data: any, actor: any, ip: string, userAgent: string) {
    const before = await this.repo.findById(id);
    const win = await this.repo.update(id, data);
    if (!win) throw new Error(`Availability window ${id} not found`);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        action_type: 'UPDATE_RESOURCE_AVAILABILITY_WINDOW',
        entity_type: 'RESOURCE_AVAILABILITY_WINDOW',
        entity_id: String(win.id),
        description: 'Resource availability window updated',
        metadata: { before, after: win },
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return win;
  }

  async delete(id: number, actor: any, ip: string, userAgent: string) {
    const win = await this.repo.delete(id);
    await prisma.user_activity_logs.create({
      data: {
        user_id: actor.id,
        action_type: 'DELETE_RESOURCE_AVAILABILITY_WINDOW',
        entity_type: 'RESOURCE_AVAILABILITY_WINDOW',
        entity_id: String(id),
        description: 'Resource availability window deleted',
        metadata: win ?? {},
        ip_address: ip,
        user_agent: userAgent
      }
    });
    return win;
  }
}
