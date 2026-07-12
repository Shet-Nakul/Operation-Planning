import { Router } from 'express';
import * as rosteringController from '../controllers/rosteringController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.use(authenticateJWT);

// GET /api/rosterings?view=latest|all|employee|pool|date|stats
//   &year=YYYY &month=M          → pin to specific month (otherwise latest)
//   &employeeId=STAFF-XX-0001    → required for view=employee
//   &poolId=TRA-SUR-0001         → required for view=pool
//   &date=YYYY-MM-DD             → required for view=date
router.get('/', rosteringController.queryRostering);

export default router;
