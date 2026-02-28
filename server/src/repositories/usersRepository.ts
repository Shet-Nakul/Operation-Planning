import prisma from '../models/prisma';
import { User } from '../models/users';
import { Prisma } from '@prisma/client';

export class UsersRepository {
  async findAll(params: { skip?: number; take?: number; search?: string; organizationId?: number }) {
    return prisma.users.findMany({
      where: {
        ...(params.organizationId ? { organization_id: params.organizationId } : {}),
        ...(params.search ? { email: { contains: params.search } } : {})
      },
      skip: params.skip,
      take: params.take,
      orderBy: { email: 'asc' }
    });
  }

  async findById(id: number): Promise<User | null> {
    return prisma.users.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.users.findUnique({ where: { email } });
  }

  async create(data: {
    organization_id?: number;
    role_id: number;
    first_name: string;
    last_name?: string;
    email: string;
    phone?: string;
    password_hash: string;
    avatar_url?: string;
    is_active?: boolean;
    is_email_verified?: boolean;
    last_login_at?: Date;
    created_at?: Date;
    updated_at?: Date;
  }): Promise<User> {
    const createData: Prisma.usersCreateInput = {
      first_name: data.first_name,
      last_name: data.last_name ?? undefined,
      email: data.email,
      phone: data.phone ?? undefined,
      password_hash: data.password_hash,
      avatar_url: data.avatar_url ?? undefined,
      is_active: data.is_active ?? undefined,
      is_email_verified: data.is_email_verified ?? undefined,
      last_login_at: data.last_login_at ?? undefined,
      created_at: data.created_at ?? undefined,
      updated_at: data.updated_at ?? undefined,
      role: { connect: { id: data.role_id } },
      ...(typeof data.organization_id === 'number' ? {
        organization: { connect: { id: data.organization_id } }
      } : {})
    };
    return prisma.users.create({ data: createData });
  }

  async update(
    id: number,
    data: {
      organization_id?: number;
      role_id?: number;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      password_hash?: string;
      avatar_url?: string;
      is_active?: boolean;
      is_email_verified?: boolean;
      last_login_at?: Date;
      updated_at?: Date;
    }
  ): Promise<User | null> {
    const updateData: Prisma.usersUpdateInput = {
      first_name: data.first_name ?? undefined,
      last_name: data.last_name ?? undefined,
      email: data.email ?? undefined,
      phone: data.phone ?? undefined,
      password_hash: data.password_hash ?? undefined,
      avatar_url: data.avatar_url ?? undefined,
      is_active: data.is_active ?? undefined,
      is_email_verified: data.is_email_verified ?? undefined,
      last_login_at: data.last_login_at ?? undefined,
      updated_at: data.updated_at ?? undefined,
      ...(typeof data.role_id === 'number' ? {
        role: { connect: { id: data.role_id } }
      } : {}),
      ...(typeof data.organization_id === 'number' ? {
        organization: { connect: { id: data.organization_id } }
      } : {})
    };
    return prisma.users.update({ where: { id }, data: updateData });
  }

  async delete(id: number): Promise<User | null> {
    return prisma.users.delete({ where: { id } });
  }
}
