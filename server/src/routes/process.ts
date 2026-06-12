import { Router, Response } from 'express';
import { getProcessState, triggerProcess } from '../services/processManager';
import { authenticateJWT, AuthRequest } from '../middlewares/auth';

const router = Router();

router.post('/rostering', authenticateJWT, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }
        const result = await triggerProcess(req.user.organization_id);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(409).json(result);
        }
    } catch (err: any) {
        res.status(500).json({
            success: false,
            error: err.message
        });
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
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

export default router;
