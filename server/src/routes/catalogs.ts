import { Router } from 'express';
import {
  createStaffTag, getStaffTags, updateStaffTag, deleteStaffTag,
  createSpecialization, getSpecializations, updateSpecialization, deleteSpecialization,
  createSkill, getSkills, updateSkill, deleteSkill,
  createShift, getShifts, updateShift, deleteShift,
  createOperationType, getOperationTypes, updateOperationType, deleteOperationType,
  createPhaseResource, getPhaseResources, updatePhaseResource, deletePhaseResource
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

router.post('/operation_types', authenticateJWT, createOperationType);
router.get('/operation_types', authenticateJWT, getOperationTypes);
router.put('/operation_types/:id', authenticateJWT, updateOperationType);
router.delete('/operation_types/:id', authenticateJWT, deleteOperationType);

router.post('/phase_resource', authenticateJWT, createPhaseResource);
router.get('/phase_resource', authenticateJWT, getPhaseResources);
router.put('/phase_resource/:id', authenticateJWT, updatePhaseResource);
router.delete('/phase_resource/:id', authenticateJWT, deletePhaseResource);

export default router;
