import { Router } from 'express';
import { createContract, getContracts, getContractById } from '../controllers/contractsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/', authenticateJWT, createContract);
router.get('/', authenticateJWT, getContracts);
router.get('/:id', authenticateJWT, getContractById);

export default router;
