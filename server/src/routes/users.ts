import { Router } from 'express';
import { createUser, getUsers } from '../controllers/usersController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createUser);
router.get('/', authenticateJWT, getUsers);

export default router;
