import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';

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
    const resourceId = `NR-${Date.now()}`; // Simple ID generation

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

    res.status(201).json(resource);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getNonRenewableResources(req: Request, res: Response) {
  try {
    const { query, category, status, limit, orgId } = req.query;

    const where: any = {};
    if (orgId) where.organization_id = Number(orgId);
    if (query) where.name = { contains: String(query), mode: 'insensitive' };
    if (category) where.category = category;
    if (status) where.status = status;

    const take = limit ? Number(limit) : undefined;

    const resources = await prisma.nonRenewableResource.findMany({
      where,
      take: take,
      orderBy: { updated_at: 'desc' }
    });

    res.json(resources);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getNonRenewableResourceById(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const resource = await prisma.nonRenewableResource.findUnique({
      where: { resource_id: resource_id }
    });

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    res.json(resource);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateNonRenewableResource(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    const validatedData = updateNonRenewableResourceSchema.parse(req.body);

    const resource = await prisma.nonRenewableResource.update({
      where: { resource_id: resource_id },
      data: validatedData
    });

    res.json(resource);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteNonRenewableResource(req: Request, res: Response) {
  try {
    const resource_id = req.params.resource_id as string;
    await prisma.nonRenewableResource.delete({
      where: { resource_id: resource_id }
    });

    res.json({
      resource_id: resource_id,
      deleted: true,
      deleted_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
