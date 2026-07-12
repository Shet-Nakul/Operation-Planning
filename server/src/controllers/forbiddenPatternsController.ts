import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { getOrgFilter } from '../utils/getOrgFilter';

const forbiddenPatternSchema = z.object({
  organization_id: z.number(),
  scope: z.string().optional(),
  applies_to: z.string().optional(),
  forbidden_patterns: z.array(z.any()),
  metadata: z.any().optional(),
});

export async function createForbiddenPattern(req: Request, res: Response) {
  try {
    const validatedData = forbiddenPatternSchema.parse(req.body);
    const pattern = await prisma.forbiddenPattern.create({
      data: {
        organization_id: validatedData.organization_id,
        scope: validatedData.scope || "GLOBAL",
        applies_to: validatedData.applies_to || "ALL_CONTRACT_TYPES",
        forbidden_patterns: validatedData.forbidden_patterns,
        metadata: validatedData.metadata || {},
      },
    });
    res.status(201).json({ success: true, data: pattern, message: 'Forbidden pattern created successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ success: false, error: 'Failed to create forbidden pattern' });
  }
}

export async function getForbiddenPatterns(req: Request, res: Response) {
  try {
    const patterns = await prisma.forbiddenPattern.findMany({
      where: getOrgFilter(req),
    });
    res.json({ success: true, data: patterns });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve forbidden patterns' });
  }
}

export async function updateForbiddenPattern(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.forbiddenPattern.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Forbidden pattern not found' });

    const validatedData = forbiddenPatternSchema.partial().parse(req.body);
    const pattern = await prisma.forbiddenPattern.update({ where: { id: Number(id) }, data: validatedData });
    res.json({ success: true, data: pattern, message: 'Forbidden pattern updated successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ error: 'Failed to update forbidden pattern' });
  }
}

export async function deleteForbiddenPattern(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.forbiddenPattern.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ error: 'Forbidden pattern not found' });

    await prisma.forbiddenPattern.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Forbidden pattern deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete forbidden pattern' });
  }
}
