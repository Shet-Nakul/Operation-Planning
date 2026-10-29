import { Router } from 'express';
import { getActivityLogs, getActivityLogById, deleteActivityLog } from '../controllers/userActivityLogsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';
import { SUPER_ADMIN_ROLE } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), getActivityLogs);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN', SUPER_ADMIN_ROLE), getActivityLogById);
router.delete('/:id', authenticateJWT, authorizeRoles(SUPER_ADMIN_ROLE), deleteActivityLog);

export default router;
