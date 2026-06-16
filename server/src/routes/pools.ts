import { Router } from 'express';
import * as poolsController from '../controllers/poolsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// All pool routes require authentication
router.use(authenticateJWT);

router.post('/', poolsController.createPool);
router.get('/', poolsController.getPools);
router.get('/:pool_id', poolsController.getPoolById);
router.put('/:pool_id', poolsController.updatePool);
router.get('/:pool_id/demand', poolsController.getPoolDemand);
router.put('/:pool_id/demand', poolsController.updatePoolDemand);
router.get('/:pool_id/shortages', poolsController.getPoolShortages);

export default router;
