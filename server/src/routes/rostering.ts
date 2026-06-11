import { Router } from 'express';
import * as rosteringController from '../controllers/rosteringController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all rostering routes
router.use(authenticateJWT);

router.get('/', rosteringController.getLatestRostering);
router.get('/all', rosteringController.getAllRosterings);
router.get('/employee', rosteringController.getEmployeeRostering);
router.get('/pool', rosteringController.getPoolRostering);
router.get('/date', rosteringController.getDateRostering);

export default router;
