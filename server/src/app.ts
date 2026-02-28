import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import logger from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth';
import organizationsRoutes from './routes/organizations';
import usersRoutes from './routes/users';
import rolesRoutes from './routes/roles';
import planningGlobalConfigRoutes from './routes/planningGlobalConfig';
import resourcesRoutes from './routes/resources';
import resourceDailyCapacityRoutes from './routes/resourceDailyCapacity';
import resourceAvailabilityWindowsRoutes from './routes/resourceAvailabilityWindows';
import phaseRequirementsRoutes from './routes/phaseRequirements';
import operationsRoutes from './routes/operations';
import operationTypesRoutes from './routes/operationTypes';
import infectionTypesRoutes from './routes/infectionTypes';
import surgeryPhaseRequirementsRoutes from './routes/surgeryPhaseRequirements';
import swaggerDocs from './docs/swagger/swagger';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/planning-global-config', planningGlobalConfigRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/resource-daily-capacity', resourceDailyCapacityRoutes);
app.use('/api/resource-availability-windows', resourceAvailabilityWindowsRoutes);
app.use('/api/phase-requirements', phaseRequirementsRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/operation-types', operationTypesRoutes);
app.use('/api/infection-types', infectionTypesRoutes);
app.use('/api/surgery-phase-requirements', surgeryPhaseRequirementsRoutes);

// Swagger endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error handler
app.use(errorHandler);

export default app;
