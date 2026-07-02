import { Router } from 'express';
import * as renewableResourcesController from '../controllers/renewableResourcesController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// All renewable resource routes require authentication
router.use(authenticateJWT);

router.post('/pools', renewableResourcesController.createRenewablePool);
router.get('/pools', renewableResourcesController.getRenewablePools);
router.get('/pools/:pool_id', renewableResourcesController.getRenewablePoolById);
router.put('/pools/:pool_id/capacity', renewableResourcesController.updatePoolCapacity);
router.put('/pools/:pool_id/weekly_template', renewableResourcesController.updateWeeklyTemplate);
router.get('/pools/:pool_id/reservations', renewableResourcesController.getReservations);
router.post('/pools/:pool_id/reservations', renewableResourcesController.createReservation);
router.delete('/pools/:pool_id/reservations/:reservation_id', renewableResourcesController.deleteReservation);
router.get('/pools/:pool_id/health', renewableResourcesController.getPoolHealth);
router.post('/pools/:pool_id/units', renewableResourcesController.addUnitsToPool);
router.patch('/units/:unit_id', renewableResourcesController.updateUnit);

export default router;
