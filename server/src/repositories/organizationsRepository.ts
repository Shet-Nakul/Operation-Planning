import prisma from '../models/prisma';
import { Prisma } from '@prisma/client';
import { Organization } from '../models/organizations';

type CreateOrganizationInput = Omit<Organization, 'id' | 'created_at' | 'updated_at'>;

export class OrganizationsRepository {
  async findAll(params: { skip?: number; take?: number; search?: string; organizationId?: number }) {
    return prisma.organizations.findMany({
      where: {
        ...(params.organizationId ? { id: params.organizationId } : {}),
        ...(params.search ? {
          name: {
            contains: params.search,
            mode: 'insensitive'
          } as any
        } : {})
      },
      skip: params.skip,
      take: params.take,
      orderBy: { name: 'asc' }
    });
  }

  async findById(id: number): Promise<Organization | null> {
    return prisma.organizations.findUnique({ where: { id } });
  }

  async create(data: CreateOrganizationInput): Promise<Organization> {
    return prisma.organizations.create({ data });
  }

  async update(id: number, data: Partial<Organization>): Promise<Organization | null> {
    return prisma.organizations.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Organization | null> {
    return prisma.organizations.delete({ where: { id } });
  }
}