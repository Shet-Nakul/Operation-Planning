import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { markPlanningDirty } from '../services/planningAutoTrigger';

const globalSettingsSchema = z.object({
  organization_id: z.number(),
  business_hours_start: z.string().optional(),
  business_hours_end: z.string().optional(),
  surgery_planning_horizon: z.number().optional(),
  roster_planning_horizon: z.number().optional(),
  surgery_planning_resolution: z.number().optional(),
  schedule_date: z.number().int().min(1, 'schedule_date must be between 1 and 31').max(31, 'schedule_date must be between 1 and 31').optional(),
});

export async function upsertGlobalSettings(req: Request, res: Response) {
  try {
    const validatedData = globalSettingsSchema.parse(req.body);
    const settings = await prisma.globalSettings.upsert({
      where: { organization_id: validatedData.organization_id },
      update: validatedData,
      create: validatedData,
    });
    markPlanningDirty(settings.organization_id);
    res.json(settings);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function getGlobalSettings(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    const settings = await prisma.globalSettings.findUnique({
      where: { organization_id: Number(orgId) },
    });
    if (!settings) return res.status(404).json({ error: 'Global settings not found' });
    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteGlobalSettings(req: Request, res: Response) {
  try {
    const { orgId } = req.params;
    await prisma.globalSettings.delete({
      where: { organization_id: Number(orgId) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
