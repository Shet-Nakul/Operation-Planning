import { Router } from 'express';
import {
  listResourceDailyCapacities,
  getResourceDailyCapacity,
  createResourceDailyCapacity,
  updateResourceDailyCapacity,
  deleteResourceDailyCapacity
} from '../controllers/resourceDailyCapacityController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/resource-daily-capacity', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listResourceDailyCapacities);
router.get('/api/resource-daily-capacity/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getResourceDailyCapacity);
router.post('/api/resource-daily-capacity', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createResourceDailyCapacity);
router.put('/api/resource-daily-capacity/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateResourceDailyCapacity);
router.delete('/api/resource-daily-capacity/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteResourceDailyCapacity);

export default router;
