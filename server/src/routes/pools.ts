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

// Pool resources
router.post('/:pool_id/resources', poolsController.createPoolResource);
router.get('/:pool_id/resources', poolsController.getPoolResources);
router.get('/:pool_id/resources/:resource_id', poolsController.getPoolResourceById);
router.put('/:pool_id/resources/:resource_id', poolsController.updatePoolResource);
router.delete('/:pool_id/resources/:resource_id', poolsController.deletePoolResource);

// Pool resource reservations
router.post('/:pool_id/resources/:resource_id/reservations', poolsController.createReservation);
router.get('/:pool_id/resources/:resource_id/reservations', poolsController.getReservations);
router.get('/:pool_id/resources/:resource_id/reservations/:reservation_id', poolsController.getReservationById);
router.put('/:pool_id/resources/:resource_id/reservations/:reservation_id', poolsController.updateReservation);
router.delete('/:pool_id/resources/:resource_id/reservations/:reservation_id', poolsController.deleteReservation);

export default router;
