import { Router } from 'express';
import {
  listPhaseRequirements,
  getPhaseRequirement,
  createPhaseRequirement,
  updatePhaseRequirement,
  deletePhaseRequirement
} from '../controllers/phaseRequirementsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/phases', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listPhaseRequirements);
router.get('/api/phases/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getPhaseRequirement);
router.post('/api/phases', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createPhaseRequirement);
router.put('/api/phases/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updatePhaseRequirement);
router.delete('/api/phases/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deletePhaseRequirement);

export default router;
