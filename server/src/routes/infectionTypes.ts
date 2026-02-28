import { Router } from 'express';
import { InfectionTypesController } from '../controllers/infectionTypesController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, InfectionTypesController.list);
router.get('/:id', authenticateJWT, InfectionTypesController.getById);
router.post('/', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), InfectionTypesController.create);
router.put('/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), InfectionTypesController.update);
router.delete('/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), InfectionTypesController.delete);

export default router;
