import { Router } from 'express';
import { createRole, getRoles, updateRole, deleteRole } from '../controllers/rolesController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createRole);
router.get('/', authenticateJWT, getRoles);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), updateRole);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteRole);

export default router;
