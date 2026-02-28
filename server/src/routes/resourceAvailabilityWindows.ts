import { Router } from 'express';
import {
  listResourceAvailabilityWindows,
  getResourceAvailabilityWindow,
  createResourceAvailabilityWindow,
  updateResourceAvailabilityWindow,
  deleteResourceAvailabilityWindow
} from '../controllers/resourceAvailabilityWindowsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/resource-availability-windows', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listResourceAvailabilityWindows);
router.get('/api/resource-availability-windows/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getResourceAvailabilityWindow);
router.post('/api/resource-availability-windows', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createResourceAvailabilityWindow);
router.put('/api/resource-availability-windows/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateResourceAvailabilityWindow);
router.delete('/api/resource-availability-windows/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteResourceAvailabilityWindow);

export default router;
