import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { SUPER_ADMIN_ROLE } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), createUser);
router.get('/', authenticateJWT, getUsers);
router.get('/:id', authenticateJWT, getUserById);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), updateUser);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), deleteUser);

export default router;
