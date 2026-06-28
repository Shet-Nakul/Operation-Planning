import { Router } from 'express';
import { createSurgery, getSurgeries, getSurgeryById, updateSurgery, deleteSurgery } from '../controllers/surgeriesController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, createSurgery);
router.get('/', authenticateJWT, getSurgeries);
router.get('/:id', authenticateJWT, getSurgeryById);
router.put('/:id', authenticateJWT, updateSurgery);
router.delete('/:id', authenticateJWT, deleteSurgery);

export default router;
