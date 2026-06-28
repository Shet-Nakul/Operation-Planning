import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import logger from '../config/logger';
import { generateSurgeryId } from '../utils/generateSurgeryId';
import { resolveDepartmentName } from '../utils/resolveDepartmentName';
import { slugify } from '../utils/slugify';

const stageRequirementSchema = z.object({
  role: z.string(),
  assigned: z.string().nullable().optional(),
  count: z.number(),
  duration: z.tuple([z.number(), z.number()]),
  probability: z.number().optional(),
});

const stagesSchema = z.object({
  pre_op: z.array(stageRequirementSchema).optional(),
  operative: z.array(stageRequirementSchema).optional(),
  post_op: z.array(stageRequirementSchema).optional(),
  sterilization: z.array(stageRequirementSchema).optional(),
  recovery: z.array(stageRequirementSchema).optional(),
});

const timeWindowsSchema = z.object({
  earliest_date: z.string(),
  latest_date: z.string(),
  planned_start: z.string().nullable().optional(),
  planned_by: z.string().nullable().optional(),
});

const surgerySchema = z.object({
  organization_id: z.number(),
  name: z.string(),
  type: z.string(),
  infection_type: z.number().optional(),
  department_id: z.number().nullable().optional(),
  time_windows: timeWindowsSchema,
  stages: stagesSchema,
});

type Stages = z.infer<typeof stagesSchema>;

// Validates every stage requirement's `role` against the organization's role catalog (GET /api/catalogs/roles).
// Matches snake_case stage roles (e.g. "or_nurse") against catalog tag names (e.g. "OR Nurse") via slug comparison.
async function validateStageRoles(organizationId: number, stages: Stages): Promise<string | null> {
  const roles = Object.values(stages).flatMap(entries => (entries || []).map(e => e.role));
  if (roles.length === 0) return null;

  const tags = await prisma.staffTag.findMany({
    where: { organization_id: organizationId },
    select: { name: true },
  });
  const validSlugs = new Set(tags.map(t => slugify(t.name)));

  const invalidRoles = [...new Set(roles)].filter(role => !validSlugs.has(slugify(role)));
  if (invalidRoles.length > 0) {
    return `Invalid role(s): ${invalidRoles.join(', ')}. Must match a name in /api/catalogs/roles.`;
  }
  return null;
}

export async function createSurgery(req: Request, res: Response) {
  try {
    const validatedData = surgerySchema.parse(req.body);

    const roleError = await validateStageRoles(validatedData.organization_id, validatedData.stages);
    if (roleError) {
      return res.status(400).json({ error: roleError });
    }

    // Auto-generate surgery_id: SURG-<first 3 letters of patient's first name>-<4-digit sequence>
    const existingSurgeries = await prisma.surgery.findMany({
      where: { organization_id: validatedData.organization_id }
    });

    let maxNumber = 0;
    existingSurgeries.forEach(s => {
      const match = s.surgery_id.match(/-(\d{4})$/);
      if (match && parseInt(match[1]) > maxNumber) {
        maxNumber = parseInt(match[1]);
      }
    });
    const nextNumber = maxNumber + 1;
    const surgeryId = generateSurgeryId(validatedData.name, nextNumber);

    const surgery = await prisma.surgery.create({
      data: {
        organization_id: validatedData.organization_id,
        surgery_id: surgeryId,
        name: validatedData.name,
        type: validatedData.type,
        infection_type: validatedData.infection_type ?? 0,
        department_id: validatedData.department_id,
        department: await resolveDepartmentName(validatedData.department_id),
        time_windows: validatedData.time_windows,
        stages: validatedData.stages,
      },
    });
    res.status(201).json({ success: true, data: surgery, message: 'Surgery created successfully' });
  } catch (err: any) {
    logger.error('Error creating surgery:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A surgery with this surgery_id already exists.' });
    }
    res.status(400).json({ error: err.message || 'Failed to create surgery' });
  }
}

export async function getSurgeries(req: Request, res: Response) {
  try {
    const { orgId } = req.query;
    const surgeries = await prisma.surgery.findMany({
      where: orgId ? { organization_id: Number(orgId) } : {},
    });
    res.json({ success: true, data: surgeries });
  } catch (err: any) {
    logger.error('Error getting surgeries:', err);
    res.status(500).json({ error: 'Failed to get surgeries' });
  }
}

export async function getSurgeryById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const surgery = await prisma.surgery.findUnique({
      where: { id: Number(id) },
    });
    if (!surgery) return res.status(404).json({ error: 'Surgery not found' });
    res.json({ success: true, data: surgery });
  } catch (err: any) {
    logger.error('Error getting surgery by id:', err);
    res.status(500).json({ error: 'Failed to get surgery' });
  }
}

export async function updateSurgery(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingSurgery = await prisma.surgery.findUnique({
      where: { id: Number(id) },
    });
    if (!existingSurgery) return res.status(404).json({ error: 'Surgery not found' });

    const validatedData = surgerySchema.partial().parse(req.body);

    if (validatedData.stages) {
      const roleError = await validateStageRoles(existingSurgery.organization_id, validatedData.stages);
      if (roleError) {
        return res.status(400).json({ error: roleError });
      }
    }

    const updateData: typeof validatedData & { department?: string | null } = { ...validatedData };
    if ('department_id' in validatedData) {
      updateData.department = await resolveDepartmentName(validatedData.department_id);
    }

    const surgery = await prisma.surgery.update({
      where: { id: Number(id) },
      data: updateData,
    });
    res.json({ success: true, data: surgery, message: 'Surgery updated successfully' });
  } catch (err: any) {
    logger.error('Error updating surgery:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'A surgery with this surgery_id already exists.' });
    }
    res.status(400).json({ error: err.message || 'Failed to update surgery' });
  }
}

export async function deleteSurgery(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existingSurgery = await prisma.surgery.findUnique({
      where: { id: Number(id) },
    });
    if (!existingSurgery) return res.status(404).json({ error: 'Surgery not found' });

    await prisma.surgery.delete({
      where: { id: Number(id) },
    });
    res.json({ success: true, message: 'Surgery deleted successfully' });
  } catch (err: any) {
    logger.error('Error deleting surgery:', err);
    res.status(500).json({ error: 'Failed to delete surgery' });
  }
}
