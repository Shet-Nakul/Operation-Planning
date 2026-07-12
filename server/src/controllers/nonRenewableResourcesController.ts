import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { getOrgFilter } from '../utils/getOrgFilter';

const createNonRenewableResourceSchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  spec: z.string().optional(),
  category: z.string(),
  uom: z.string(),
  stockpile_qty: z.number(),
  min_required_qty: z.number(),
  status: z.string().optional().default('AVAILABLE')
});

const updateNonRenewableResourceSchema = z.object({
  name: z.string().optional(),
  spec: z.string().optional(),
  category: z.string().optional(),
  uom: z.string().optional(),
  stockpile_qty: z.number().optional(),
  min_required_qty: z.number().optional(),
  status: z.string().optional()
});

export async function createNonRenewableResource(req: Request, res: Response) {
  try {
    const validatedData = createNonRenewableResourceSchema.parse(req.body);
    const resourceId = `NR-${Date.now()}`;

    const resource = await prisma.nonRenewableResource.create({
      data: {
        organization_id: validatedData.organization_id,
        resource_id: resourceId,
        name: validatedData.name,
        spec: validatedData.spec,
        category: validatedData.category,
        uom: validatedData.uom,
        stockpile_qty: validatedData.stockpile_qty,
        min_required_qty: validatedData.min_required_qty,
        status: validatedData.status,
      }
    });

    res.status(201).json({ success: true, data: resource, message: 'Non-renewable resource created successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to create resource' });
  }
}

export async function getNonRenewableResources(req: Request, res: Response) {
  try {
    const { query, category, status, limit, orgId } = req.query;

    const where: any = { ...getOrgFilter(req) };
    if (query) where.name = { contains: String(query), mode: 'insensitive' };
    if (category) where.category = category;
    if (status) where.status = status;

    const resources = await prisma.nonRenewableResource.findMany({
      where,
      take: limit ? Number(limit) : undefined,
      orderBy: { updated_at: 'desc' }
    });

    res.json({ success: true, data: resources });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve resources' });
  }
}

export async function getNonRenewableResourceById(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const resource = await prisma.nonRenewableResource.findUnique({
      where: { resource_id }
    });

    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    res.json({ success: true, data: resource });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve resource' });
  }
}

export async function updateNonRenewableResource(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;

    const existing = await prisma.nonRenewableResource.findUnique({ where: { resource_id } });
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    const validatedData = updateNonRenewableResourceSchema.parse(req.body);
    const resource = await prisma.nonRenewableResource.update({ where: { resource_id }, data: validatedData });

    res.json({ success: true, data: resource, message: 'Resource updated successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to update resource' });
  }
}

export async function deleteNonRenewableResource(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;

    const existing = await prisma.nonRenewableResource.findUnique({ where: { resource_id } });
    if (!existing) return res.status(404).json({ error: 'Resource not found' });

    await prisma.nonRenewableResource.delete({ where: { resource_id } });
    res.json({ success: true, message: 'Resource deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
}
