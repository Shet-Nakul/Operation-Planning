import { Router } from 'express';
import {
  createStaffRequest,
  getStaffRequests,
  getStaffRequestById,
  updateStaffRequest,
  deleteStaffRequest,
  getSupervisorTeam,
} from '../controllers/leaveRequestsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, createStaffRequest);
router.get('/', authenticateJWT, getStaffRequests);
router.get('/team', authenticateJWT, getSupervisorTeam);
router.get('/:id', authenticateJWT, getStaffRequestById);
router.put('/:id', authenticateJWT, updateStaffRequest);
router.delete('/:id', authenticateJWT, deleteStaffRequest);

export default router;
