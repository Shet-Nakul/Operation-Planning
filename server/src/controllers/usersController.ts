import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { createAuditLog } from '../utils/auditLogger';
import { getOrgFilter } from '../utils/getOrgFilter';
import { SUPER_ADMIN_ROLE } from '../middlewares/auth';
import { randomBytes } from 'crypto';

const userSchema = z.object({
  organization_id: z.number().optional(),
  role_id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6).optional(),
  is_active: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export async function createUser(req: Request, res: Response) {
  try {
    const actor = (req as any).user;
    const validatedData = userSchema.parse(req.body);
    if (actor.role !== SUPER_ADMIN_ROLE) {
      if (actor.organization_id === null || (validatedData.organization_id !== undefined && validatedData.organization_id !== actor.organization_id)) {
        return res.status(403).json({ success: false, error: 'Organization access denied' });
      }
      const role = await prisma.role.findUnique({ where: { id: validatedData.role_id } });
      if (!role || role.name !== 'USER') return res.status(403).json({ success: false, error: 'Organization admins may only create regular users' });
      validatedData.organization_id = actor.organization_id;
    }
    if (validatedData.organization_id === undefined) return res.status(400).json({ success: false, error: 'Organization is required' });
    const generatedPassword = validatedData.password ?? randomBytes(12).toString('base64url');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
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

    await createAuditLog({
      action: 'CREATE_USER',
      entity: 'User',
      entity_id: String(user.id),
      user_id: actor?.id,
      organization_id: user.organization_id || undefined,
      description: `User ${user.email} created`,
    });

    const { password_hash, refresh_token, ...userWithoutPassword } = user;
    res.status(201).json({
      success: true,
      data: { ...userWithoutPassword, credentials: { email: user.email, password: generatedPassword }, emailDelivery: 'not_configured' },
      message: 'User created successfully',
    });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
}

export async function getUsers(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, orgId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { ...getOrgFilter(req) };

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
    res.status(500).json({ success: false, error: 'Failed to retrieve users' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { role: true, organization: true },
    });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    const actor = (req as any).user;
    if (actor.role !== SUPER_ADMIN_ROLE && user.organization_id !== actor.organization_id) return res.status(403).json({ success: false, error: 'User access denied' });

    const { password_hash, refresh_token, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve user' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id: Number(id) }, include: { role: true } });
    if (!existing) return res.status(404).json({ success: false, error: 'User not found' });
    const actor = (req as any).user;
    if (actor.role !== SUPER_ADMIN_ROLE && existing.organization_id !== actor.organization_id) return res.status(403).json({ success: false, error: 'User access denied' });
    if (actor.role !== SUPER_ADMIN_ROLE && existing.role.name !== 'USER') return res.status(403).json({ success: false, error: 'Organization admins may only manage regular users' });

    const validatedData = userSchema.partial().parse(req.body);
    if (actor.role !== SUPER_ADMIN_ROLE) {
      if (validatedData.organization_id !== undefined && validatedData.organization_id !== actor.organization_id) return res.status(403).json({ success: false, error: 'Organization access denied' });
      if (validatedData.role_id !== undefined) {
        const nextRole = await prisma.role.findUnique({ where: { id: validatedData.role_id } });
        if (!nextRole || nextRole.name !== 'USER') return res.status(403).json({ success: false, error: 'Organization admins may only assign regular users' });
      }
      delete (validatedData as any).organization_id;
    }

    const updateData: any = { ...validatedData };
    if (validatedData.password) {
      updateData.password_hash = await bcrypt.hash(validatedData.password, 10);
      updateData.refresh_token = null;
      delete updateData.password;
    }

    const user = await prisma.user.update({
      where: { id: Number(id) },
      data: updateData,
    });

    await createAuditLog({
      action: 'UPDATE_USER',
      entity: 'User',
      entity_id: String(user.id),
      user_id: actor?.id,
      organization_id: user.organization_id || undefined,
      description: `User ${user.email} updated`,
    });

    const { password_hash, refresh_token, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword, message: 'User updated successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const existing = await prisma.user.findUnique({ where: { id: Number(id) }, include: { role: true } });
    if (!existing) return res.status(404).json({ success: false, error: 'User not found' });
    const actor = (req as any).user;
    if (actor.role !== SUPER_ADMIN_ROLE && existing.organization_id !== actor.organization_id) return res.status(403).json({ success: false, error: 'User access denied' });
    if (actor.role !== SUPER_ADMIN_ROLE && existing.role.name !== 'USER') return res.status(403).json({ success: false, error: 'Organization admins may only manage regular users' });

    await prisma.user.delete({ where: { id: Number(id) } });

    await createAuditLog({
      action: 'DELETE_USER',
      entity: 'User',
      entity_id: String(id),
      user_id: actor?.id,
      description: `User with ID ${id} deleted`,
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
}
