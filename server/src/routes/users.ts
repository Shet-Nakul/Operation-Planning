import { Router } from 'express';
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/usersController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/users', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listUsers);
router.get('/api/users/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getUser);
router.post('/api/users', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createUser);
router.put('/api/users/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateUser);
router.delete('/api/users/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteUser);

export default router;
