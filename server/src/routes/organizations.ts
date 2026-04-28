import { Router } from 'express';
import { createOrganization, getOrganizations, getOrganizationById } from '../controllers/organizationsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createOrganization);
router.get('/', authenticateJWT, getOrganizations);
router.get('/:id', authenticateJWT, getOrganizationById);

export default router;
