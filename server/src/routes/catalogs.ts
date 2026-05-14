import { Router } from 'express';
import {
  createStaffTag, getStaffTags, updateStaffTag, deleteStaffTag,
  createSpecialization, getSpecializations, updateSpecialization, deleteSpecialization,
  createSkill, getSkills, updateSkill, deleteSkill,
  createShift, getShifts, updateShift, deleteShift
} from '../controllers/catalogsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/roles', authenticateJWT, createStaffTag);
router.get('/roles', authenticateJWT, getStaffTags);
router.put('/roles/:id', authenticateJWT, updateStaffTag);
router.delete('/roles/:id', authenticateJWT, deleteStaffTag);

router.post('/specializations', authenticateJWT, createSpecialization);
router.get('/specializations', authenticateJWT, getSpecializations);
router.put('/specializations/:id', authenticateJWT, updateSpecialization);
router.delete('/specializations/:id', authenticateJWT, deleteSpecialization);

router.post('/skills', authenticateJWT, createSkill);
router.get('/skills', authenticateJWT, getSkills);
router.put('/skills/:id', authenticateJWT, updateSkill);
router.delete('/skills/:id', authenticateJWT, deleteSkill);

router.post('/shift', authenticateJWT, createShift);
router.get('/shift', authenticateJWT, getShifts);
router.put('/shift/:id', authenticateJWT, updateShift);
router.delete('/shift/:id', authenticateJWT, deleteShift);

export default router;
