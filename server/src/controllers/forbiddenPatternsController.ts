import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';

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
    res.status(201).json(pattern);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getForbiddenPatterns(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const patterns = await prisma.forbiddenPattern.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json(patterns);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
