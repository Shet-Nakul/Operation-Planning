import prisma from '../models/prisma';
import { Resource } from '../models/resources';

export class ResourcesRepository {
  async findAll(params: { organizationId?: number; skip?: number; take?: number; search?: string }) {
    return prisma.resources.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.search ? { name: { contains: params.search, mode: 'insensitive' } as any } : {})
      },
      skip: params.skip,
      take: params.take,
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: number): Promise<Resource | null> {
    return prisma.resources.findUnique({ where: { id } });
  }

  async create(data: Omit<Resource, "id" | "created_at">): Promise<Resource> {
    return prisma.resources.create({ data });
  }

  async update(id: number, data: Partial<Resource>): Promise<Resource | null> {
    return prisma.resources.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Resource | null> {
    return prisma.resources.delete({ where: { id } });
  }
}
