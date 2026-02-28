import { Router } from 'express';
import {
  listOperations,
  getOperation,
  createOperation,
  updateOperation,
  deleteOperation
} from '../controllers/operationsController';
import { authenticateJWT, authorizeRoles } from '../middlewares/auth';

const router = Router();

router.get('/api/operations', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), listOperations);
router.get('/api/operations/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN', 'USER'), getOperation);
router.post('/api/operations', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), createOperation);
router.put('/api/operations/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), updateOperation);
router.delete('/api/operations/:id', authenticateJWT, authorizeRoles('SUPER_ADMIN', 'ADMIN'), deleteOperation);

export default router;
