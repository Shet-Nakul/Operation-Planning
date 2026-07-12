import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { createAuditLog } from '../utils/auditLogger';

const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export async function createRole(req: Request, res: Response) {
  try {
    const validatedData = roleSchema.parse(req.body);
    const role = await prisma.role.create({ data: validatedData });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'CREATE_ROLE',
      entity: 'Role',
      entity_id: String(role.id),
      user_id: actor?.id,
      description: `Role ${role.name} created`,
    });

    res.status(201).json({ success: true, data: role, message: 'Role created successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.issues.map((i: any) => i.message).join(', ') });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'A role with this name already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to create role' });
  }
}

export async function getRoles(req: Request, res: Response) {
  try {
    const roles = await prisma.role.findMany();
    res.json({ success: true, data: roles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve roles' });
  }
}

export async function updateRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.role.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ success: false, error: 'Role not found' });

    const validatedData = roleSchema.partial().parse(req.body);
    const role = await prisma.role.update({ where: { id: Number(id) }, data: validatedData });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'UPDATE_ROLE',
      entity: 'Role',
      entity_id: String(role.id),
      user_id: actor?.id,
      description: `Role ${role.name} updated`,
    });

    res.json({ success: true, data: role, message: 'Role updated successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.issues.map((i: any) => i.message).join(', ') });
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'A role with this name already exists' });
    }
    res.status(500).json({ success: false, error: 'Failed to update role' });
  }
}

export async function deleteRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.role.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ success: false, error: 'Role not found' });

    await prisma.role.delete({ where: { id: Number(id) } });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'DELETE_ROLE',
      entity: 'Role',
      entity_id: String(id),
      user_id: actor?.id,
      description: `Role with ID ${id} deleted`,
    });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete role' });
  }
}
