import { Router } from 'express';
import { createForbiddenPattern, getForbiddenPatterns, updateForbiddenPattern, deleteForbiddenPattern } from '../controllers/forbiddenPatternsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/pattern', authenticateJWT, createForbiddenPattern);
router.get('/pattern', authenticateJWT, getForbiddenPatterns);
router.put('/pattern/:id', authenticateJWT, updateForbiddenPattern);
router.delete('/pattern/:id', authenticateJWT, deleteForbiddenPattern);

export default router;
