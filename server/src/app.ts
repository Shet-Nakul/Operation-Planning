import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import logger from './config/logger';
import { errorHandler } from './middlewares/errorHandler';
import routes from './routes/index';
import { swaggerDocs } from './docs/swagger/swagger';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

// Main API routes
app.use('/', routes);

// Swagger endpoint (optional, might need update for new schema)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Error handler
app.use(errorHandler);

export default app;
