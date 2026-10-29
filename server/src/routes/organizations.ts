import { Router } from 'express';
import { createOrganization, getOrganizations, getOrganizationById, getOrganizationStats, updateOrganization, deleteOrganization } from '../controllers/organizationsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { SUPER_ADMIN_ROLE } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles(SUPER_ADMIN_ROLE), createOrganization);
router.get('/', authenticateJWT, getOrganizations);
router.get('/:id/stats', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), getOrganizationStats);
router.get('/:id', authenticateJWT, getOrganizationById);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), updateOrganization);
router.delete('/:id', authenticateJWT, authorizeRoles(SUPER_ADMIN_ROLE), deleteOrganization);

export default router;
