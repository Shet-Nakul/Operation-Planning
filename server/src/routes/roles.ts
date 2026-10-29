import { Router } from 'express';
import { createRole, getRoles, updateRole, deleteRole } from '../controllers/rolesController';
import { authenticateJWT, authorizeRoles, SUPER_ADMIN_ROLE } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles(SUPER_ADMIN_ROLE), createRole);
router.get('/', authenticateJWT, getRoles);
router.put('/:id', authenticateJWT, authorizeRoles(SUPER_ADMIN_ROLE), updateRole);
router.delete('/:id', authenticateJWT, authorizeRoles(SUPER_ADMIN_ROLE), deleteRole);

export default router;
