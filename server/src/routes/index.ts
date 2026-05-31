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
import staffRoutes from './staff';
import poolRoutes from './pools';
import renewableResourceRoutes from './renewableResources';
import nonRenewableResourceRoutes from './nonRenewableResources';
import processRoutes from './process';

const router = Router();

router.use('/auth', authRoutes);
router.use('/api/organizations', organizationRoutes);
router.use('/api/users', userRoutes);
router.use('/api/roles', roleRoutes);
router.use('/api/activity-logs', activityLogRoutes);
router.use('/api/staff', staffRoutes);
router.use('/api/pools', poolRoutes);
router.use('/api/resources', renewableResourceRoutes);
router.use('/api/non-renewable-resources', nonRenewableResourceRoutes);

// New catalog and configuration routes from req.md
router.use('/api/catalogs', catalogRoutes);
router.use('/api/catalogs', globalSettingsRoutes);
router.use('/api/catalogs', forbiddenPatternsRoutes);
router.use('/api/contracts', contractRoutes);
router.use('/api', processRoutes);

export default router;
