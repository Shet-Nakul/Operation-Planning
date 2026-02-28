import { Router } from 'express';
import {
  listResources,
  getResource,
  createResource,
  updateResource,
  deleteResource
} from '../controllers/resourcesController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/resources', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listResources);
router.get('/api/resources/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getResource);
router.post('/api/resources', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createResource);
router.put('/api/resources/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateResource);
router.delete('/api/resources/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteResource);

export default router;
