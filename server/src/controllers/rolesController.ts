import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { createAuditLog } from '../utils/auditLogger';

const roleSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
});

export async function createRole(req: Request, res: Response) {
  try {
    const validatedData = roleSchema.parse(req.body);
    const role = await prisma.role.create({
      data: validatedData,
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'CREATE_ROLE',
      entity: 'Role',
      entity_id: String(role.id),
      user_id: actor?.id,
      description: `Role ${role.name} created`,
    });

    res.status(201).json(role);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getRoles(req: Request, res: Response) {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const validatedData = roleSchema.partial().parse(req.body);
    const role = await prisma.role.update({
      where: { id: Number(id) },
      data: validatedData,
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'UPDATE_ROLE',
      entity: 'Role',
      entity_id: String(role.id),
      user_id: actor?.id,
      description: `Role ${role.name} updated`,
    });

    res.json(role);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.role.delete({
      where: { id: Number(id) },
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'DELETE_ROLE',
      entity: 'Role',
      entity_id: String(id),
      user_id: actor?.id,
      description: `Role with ID ${id} deleted`,
    });

    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
