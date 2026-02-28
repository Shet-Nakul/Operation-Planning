import { Router } from 'express';
import {
  listPlanningGlobalConfigs,
  getPlanningGlobalConfig,
  createPlanningGlobalConfig,
  updatePlanningGlobalConfig,
  deletePlanningGlobalConfig
} from '../controllers/planningGlobalConfigController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/planning-global-config', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listPlanningGlobalConfigs);
router.get('/api/planning-global-config/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getPlanningGlobalConfig);
router.post('/api/planning-global-config', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createPlanningGlobalConfig);
router.put('/api/planning-global-config/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updatePlanningGlobalConfig);
router.delete('/api/planning-global-config/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deletePlanningGlobalConfig);

export default router;
