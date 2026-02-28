import { Router } from 'express';
import {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/rolesController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/roles', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listRoles);
router.get('/api/roles/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getRole);
router.post('/api/roles', authenticateJWT, authorizeRoles('SUPER_ADMIN'), createRole);
router.put('/api/roles/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN'), updateRole);
router.delete('/api/roles/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN'), deleteRole);

export default router;
