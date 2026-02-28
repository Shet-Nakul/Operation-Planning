import { Router } from 'express';
import {
  listOperationTypes,
  getOperationType,
  createOperationType,
  updateOperationType,
  deleteOperationType
} from '../controllers/operationTypesController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/operation-types', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listOperationTypes);
router.get('/api/operation-types/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getOperationType);
router.post('/api/operation-types', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createOperationType);
router.put('/api/operation-types/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateOperationType);
router.delete('/api/operation-types/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteOperationType);

export default router;
