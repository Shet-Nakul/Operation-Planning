import { Router } from 'express';
import { upsertGlobalSettings, getGlobalSettings, deleteGlobalSettings } from '../controllers/globalSettingsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/global_settings', authenticateJWT, upsertGlobalSettings);
router.get('/global_settings/:orgId', authenticateJWT, getGlobalSettings);
router.delete('/global_settings/:orgId', authenticateJWT, deleteGlobalSettings);

export default router;
