import { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { getSurgeryPlanResults, getSurgeryPlanResultById } from '../controllers/surgeryPlanResultsController';

const router = Router();

router.get('/', authenticateJWT, getSurgeryPlanResults);
router.get('/:surgery_id', authenticateJWT, getSurgeryPlanResultById);

export default router;
