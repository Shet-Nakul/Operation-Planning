import { Router } from 'express';
import authRoutes from './auth';
// ...import other entity routes

const router = Router();

router.use('/auth', authRoutes);
// ...use other entity routes

export default router;
