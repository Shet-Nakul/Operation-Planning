import { Router, Response } from 'express';
import { getProcessState, triggerProcess } from '../services/schedulingProcessManager';
import { getPlanningProcessState, triggerSurgeryPlanning } from '../services/planningProcessManager';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';
import { getResolvedOrgId } from '../utils/getOrgFilter';

const router = Router();

router.post('/rostering', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const orgId = getResolvedOrgId(req);
        if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID is required' });
        const result = await triggerProcess(orgId);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(409).json(result);
        }
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to trigger rostering process' });
    }
});

router.get('/process-state', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
        const state = getProcessState();
        res.json({
            success: true,
            data: state
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to retrieve process state' });
    }
});

router.post('/planning', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const orgId = getResolvedOrgId(req);
        if (!orgId) return res.status(400).json({ success: false, message: 'Organization ID is required' });
        const result = await triggerSurgeryPlanning(orgId);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(409).json(result);
        }
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to trigger planning process' });
    }
});

router.get('/planning-state', authenticateJWT, (req: AuthRequest, res: Response) => {
    try {
        const state = getPlanningProcessState();
        res.json({
            success: true,
            data: state
        });
    } catch (err: any) {
        res.status(500).json({ success: false, error: 'Failed to retrieve planning state' });
    }
});

export default router;
