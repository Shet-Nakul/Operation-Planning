import { Router } from 'express';
import { SurgeryPhaseRequirementsController } from '../controllers/surgeryPhaseRequirementsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, SurgeryPhaseRequirementsController.list);
router.get('/:id', authenticateJWT, SurgeryPhaseRequirementsController.getById);
router.post('/', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), SurgeryPhaseRequirementsController.create);
router.put('/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), SurgeryPhaseRequirementsController.update);
router.delete('/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), SurgeryPhaseRequirementsController.delete);

export default router;
