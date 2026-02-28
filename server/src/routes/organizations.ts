import { Router } from 'express';
import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization
} from '../controllers/organizationsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/organizations', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listOrganizations);
router.get('/api/organizations/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getOrganization);
router.post('/api/organizations', authenticateJWT, authorizeRoles('SUPER_ADMIN'), createOrganization);
router.put('/api/organizations/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN'), updateOrganization);
router.delete('/api/organizations/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN'), deleteOrganization);

export default router;
