import { Router } from 'express';
import * as staffController from '../controllers/staffController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

// Apply authentication middleware to all staff routes
router.use(authenticateJWT);

router.post('/', staffController.createStaff);
router.get('/', staffController.getStaff);
router.get('/:id', staffController.getStaffById);
router.put('/:id', staffController.updateStaff);
router.delete('/:id', staffController.deleteStaff);

export default router;
