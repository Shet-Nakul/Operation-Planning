import { Router } from 'express';
import { createRole, getRoles } from '../controllers/rolesController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, authorizeRoles('ADMIN'), createRole);
router.get('/', authenticateJWT, getRoles);

export default router;
