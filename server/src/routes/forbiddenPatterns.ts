import { Router } from 'express';
import { createForbiddenPattern, getForbiddenPatterns } from '../controllers/forbiddenPatternsController';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.post('/pattern', authenticateJWT, createForbiddenPattern);
router.get('/pattern', authenticateJWT, getForbiddenPatterns);

export default router;
