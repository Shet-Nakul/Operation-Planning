import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { createAuditLog } from '../utils/auditLogger';

const organizationSchema = z.object({
  name: z.string(),
  contact_number: z.string().optional(),
  contact_email: z.string().email().optional(),
  status: z.string().optional(),
});

export async function createOrganization(req: Request, res: Response) {
  try {
    const validatedData = organizationSchema.parse(req.body);
    const org = await prisma.organization.create({
      data: validatedData,
    });

    const actor = (req as any).user;
    await createAuditLog({
      action: 'CREATE_ORGANIZATION',
      entity: 'Organization',
      entity_id: String(org.id),
      user_id: actor?.id,
      organization_id: org.id,
      description: `Organization ${org.name} created`,
    });

    res.status(201).json(org);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getOrganizations(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [orgs, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: Number(limit),
        orderBy: { created_at: 'desc' },
      }),
      prisma.organization.count(),
    ]);
    res.json({
      data: orgs,
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

export async function getOrganizationById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const org = await prisma.organization.findUnique({
      where: { id: Number(id) },
    });
    if (!org) return res.status(404).json({ error: 'Organization not found' });
    res.json(org);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
