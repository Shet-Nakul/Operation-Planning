import { Router } from 'express';
import {
  createStaffTag, getStaffTags, updateStaffTag, deleteStaffTag,
  createResourceType, getResourceTypes, updateResourceType, deleteResourceType,
  createSpecialization, getSpecializations, updateSpecialization, deleteSpecialization,
  createSkill, getSkills, updateSkill, deleteSkill,
  createDepartment, getDepartments, updateDepartment, deleteDepartment,
  createShift, getShifts, updateShift, deleteShift,
  createOperationType, getOperationTypes, updateOperationType, deleteOperationType,
  createPhaseResource, getPhaseResources, updatePhaseResource, deletePhaseResource,
  createConstraint, getConstraints, updateConstraint, deleteConstraint,
  createContract, getContracts, updateContract, deleteContract
} from '../controllers/catalogsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/roles', authenticateJWT, createStaffTag);
router.get('/roles', authenticateJWT, getStaffTags);
router.put('/roles/:id', authenticateJWT, updateStaffTag);
router.delete('/roles/:id', authenticateJWT, deleteStaffTag);

router.post('/resource_types', authenticateJWT, createResourceType);
router.get('/resource_types', authenticateJWT, getResourceTypes);
router.put('/resource_types/:id', authenticateJWT, updateResourceType);
router.delete('/resource_types/:id', authenticateJWT, deleteResourceType);

router.post('/specializations', authenticateJWT, createSpecialization);
router.get('/specializations', authenticateJWT, getSpecializations);
router.put('/specializations/:id', authenticateJWT, updateSpecialization);
router.delete('/specializations/:id', authenticateJWT, deleteSpecialization);

router.post('/skills', authenticateJWT, createSkill);
router.get('/skills', authenticateJWT, getSkills);
router.put('/skills/:id', authenticateJWT, updateSkill);
router.delete('/skills/:id', authenticateJWT, deleteSkill);

router.post('/departments', authenticateJWT, createDepartment);
router.get('/departments', authenticateJWT, getDepartments);
router.put('/departments/:id', authenticateJWT, updateDepartment);
router.delete('/departments/:id', authenticateJWT, deleteDepartment);

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

router.post('/constraint', authenticateJWT, createConstraint);
router.get('/constraint', authenticateJWT, getConstraints);
router.put('/constraint/:id', authenticateJWT, updateConstraint);
router.delete('/constraint/:id', authenticateJWT, deleteConstraint);

router.post('/contract', authenticateJWT, createContract);
router.get('/contract', authenticateJWT, getContracts);
router.put('/contract/:id', authenticateJWT, updateContract);
router.delete('/contract/:id', authenticateJWT, deleteContract);

export default router;
