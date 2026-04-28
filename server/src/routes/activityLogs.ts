import { Router } from 'express';
import { getActivityLogs } from '../controllers/userActivityLogsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, authorizeRoles('ADMIN'), getActivityLogs);

export default router;
