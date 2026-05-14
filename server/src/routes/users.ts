import { Router } from 'express';
import { createUser, getUsers, getUserById, updateUser, deleteUser } from '../controllers/usersController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createUser);
router.get('/', authenticateJWT, getUsers);
router.get('/:id', authenticateJWT, getUserById);
router.put('/:id', authenticateJWT, authorizeRoles('ADMIN'), updateUser);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteUser);

export default router;
