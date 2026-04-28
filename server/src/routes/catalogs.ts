import { Router } from 'express';
import {
  createStaffTag, getStaffTags,
  createSpecialization, getSpecializations,
  createSkill, getSkills,
  createShift, getShifts
} from '../controllers/catalogsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/roles', authenticateJWT, createStaffTag);
router.get('/roles', authenticateJWT, getStaffTags);

router.post('/specializations', authenticateJWT, createSpecialization);
router.get('/specializations', authenticateJWT, getSpecializations);

router.post('/skills', authenticateJWT, createSkill);
router.get('/skills', authenticateJWT, getSkills);

router.post('/shift', authenticateJWT, createShift);
router.get('/shift', authenticateJWT, getShifts);

export default router;
