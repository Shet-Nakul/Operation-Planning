import { Request, Response } from 'express';
import prisma from '../models/prisma';

// GET /api/surgery-plans?orgId=<id>
export async function getSurgeryPlanResults(req: Request, res: Response) {
    try {
        const orgId = Number(req.query.orgId) || (req as any).user?.organization_id;
        if (!orgId) return res.status(400).json({ success: false, message: 'orgId is required' });

        const results = await prisma.surgeryPlanResult.findMany({
            where: { organization_id: orgId },
            orderBy: { updated_at: 'desc' },
        });

        res.json({ success: true, data: results });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve surgery plan results' });
    }
}

// GET /api/surgery-plans/:surgery_id
export async function getSurgeryPlanResultById(req: Request, res: Response) {
    try {
        const { surgery_id } = req.params;
        const result = await prisma.surgeryPlanResult.findUnique({ where: { surgery_id: String(surgery_id) } });
        if (!result) return res.status(404).json({ success: false, message: 'No plan result found for this surgery' });

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Failed to retrieve surgery plan result' });
    }
}
