import { Router } from 'express';
import { createOrganization, getOrganizations, getOrganizationById, updateOrganization, deleteOrganization } from '../controllers/organizationsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createOrganization);
router.get('/', authenticateJWT, getOrganizations);
router.get('/:id', authenticateJWT, getOrganizationById);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), updateOrganization);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteOrganization);

export default router;
