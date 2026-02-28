import prisma from '../models/prisma';
import { Role } from '../models/roles';

type CreateRoleInput = Omit<Role, 'id' | 'created_at'>;

export class RolesRepository {
  async findAll(): Promise<Role[]> {
    return prisma.roles.findMany({ orderBy: { name: 'asc' } });
  }

  async findById(id: number): Promise<Role | null> {
    return prisma.roles.findUnique({ where: { id } });
  }

  async findByName(name: string): Promise<Role | null> {
    return prisma.roles.findUnique({ where: { name } });
  }

  async create(data: CreateRoleInput): Promise<Role> {
    return prisma.roles.create({ data });
  }

  async update(id: number, data: Partial<Role>): Promise<Role | null> {
    return prisma.roles.update({ where: { id }, data });
  }

  async delete(id: number): Promise<Role | null> {
    return prisma.roles.delete({ where: { id } });
  }
}