import { Router } from 'express';
import { getActivityLogs, getActivityLogById, deleteActivityLog } from '../controllers/userActivityLogsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('ADMIN'), getActivityLogs);
router.get('/:id', authenticateJWT, authorizeRoles('ADMIN'), getActivityLogById);
router.delete('/:id', authenticateJWT, authorizeRoles('ADMIN'), deleteActivityLog);

export default router;
