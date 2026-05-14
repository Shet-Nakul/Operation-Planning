import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { createAuditLog } from '../utils/auditLogger';

const userSchema = z.object({
  organization_id: z.number().optional(),
  role_id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  is_active: z.boolean().optional(),
});

export async function createUser(req: Request, res: Response) {
  try {
    const validatedData = userSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    const user = await prisma.user.create({
      data: {
        organization_id: validatedData.organization_id,
        role_id: validatedData.role_id,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        email: validatedData.email,
        password_hash: hashedPassword,
        is_active: validatedData.is_active !== undefined ? validatedData.is_active : true,
      },
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'CREATE_USER',
      entity: 'User',
      entity_id: String(user.id),
      user_id: actor?.id,
      organization_id: user.organization_id || undefined,
      description: `User ${user.email} created`,
    });

    const { password_hash, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, orgId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (orgId) where.organization_id = Number(orgId);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        include: { role: true, organization: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const usersWithoutPasswords = users.map((u: any) => {
      const { password_hash, refresh_token, ...rest } = u;
      return rest;
    });

    res.json({
      data: usersWithoutPasswords,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { role: true, organization: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { password_hash, refresh_token, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = userSchema.partial().parse(req.body);
    
    const updateData: any = { ...validatedData };
    if (validatedData.password) {
      updateData.password_hash = await bcrypt.hash(validatedData.password, 10);
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'UPDATE_USER',
      entity: 'User',
      entity_id: String(user.id),
      user_id: actor?.id,
      organization_id: user.organization_id || undefined,
      description: `User ${user.email} updated`,
    });

    const { password_hash, refresh_token, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.user.delete({
      where: { id: Number(id) },
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'DELETE_USER',
      entity: 'User',
      entity_id: String(id),
      user_id: actor?.id,
      description: `User with ID ${id} deleted`,
    });

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
