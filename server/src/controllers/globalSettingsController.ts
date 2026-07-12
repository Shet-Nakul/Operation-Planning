import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { z } from 'zod';
import { markPlanningDirty } from '../services/planningAutoTrigger';
import { getResolvedOrgId } from '../utils/getOrgFilter';

const globalSettingsSchema = z.object({
  organization_id: z.number(),
  operation_hours_start: z.string().optional(),
  operation_hours_end: z.string().optional(),
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
    res.json({ success: true, data: settings, message: 'Global settings saved successfully' });
  } catch (err: any) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, error: err.issues.map((i: any) => i.message).join(', ') });
    res.status(500).json({ success: false, error: 'Failed to save global settings' });
  }
}

export async function getGlobalSettings(req: Request, res: Response) {
  try {
    const orgId = req.params.orgId ? Number(req.params.orgId) : getResolvedOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, error: 'Organization ID is required' });

    const settings = await prisma.globalSettings.findUnique({
      where: { organization_id: orgId },
    });
    if (!settings) return res.status(404).json({ success: false, error: 'Global settings not found' });
    res.json({ success: true, data: settings });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve global settings' });
  }
}

export async function deleteGlobalSettings(req: Request, res: Response) {
  try {
    const orgId = req.params.orgId ? Number(req.params.orgId) : getResolvedOrgId(req);
    if (!orgId) return res.status(400).json({ success: false, error: 'Organization ID is required' });

    const existing = await prisma.globalSettings.findUnique({ where: { organization_id: orgId } });
    if (!existing) return res.status(404).json({ success: false, error: 'Global settings not found' });

    await prisma.globalSettings.delete({ where: { organization_id: orgId } });
    res.json({ success: true, message: 'Global settings deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete global settings' });
  }
}
