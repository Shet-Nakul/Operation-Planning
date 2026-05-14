import { Router } from 'express';
import { createContract, getContracts, getContractById, updateContract, deleteContract } from '../controllers/contractsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, createContract);
router.get('/', authenticateJWT, getContracts);
router.get('/:id', authenticateJWT, getContractById);
router.put('/:id', authenticateJWT, updateContract);
router.delete('/:id', authenticateJWT, deleteContract);

export default router;
