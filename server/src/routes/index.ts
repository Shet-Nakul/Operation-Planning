import { Router } from 'express';
import authRoutes from './auth';
import organizationRoutes from './organizations';
import userRoutes from './users';
import roleRoutes from './roles';
import activityLogRoutes from './activityLogs';
import catalogRoutes from './catalogs';
import globalSettingsRoutes from './globalSettings';
import forbiddenPatternsRoutes from './forbiddenPatterns';
import contractRoutes from './contracts';

const router = Router();

router.use('/auth', authRoutes);
router.use('/api/organizations', organizationRoutes);
router.use('/api/users', userRoutes);
router.use('/api/roles', roleRoutes);
router.use('/api/activity-logs', activityLogRoutes);

// New catalog and configuration routes from req.md
router.use('/api/catalogs', catalogRoutes);
router.use('/api/catalogs', globalSettingsRoutes);
router.use('/api/catalogs', forbiddenPatternsRoutes);
router.use('/api/contracts', contractRoutes);

export default router;
