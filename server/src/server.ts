import app from './app';
import logger from './config/logger';
import { ENV } from './config/env';
import { startRosteringScheduler } from './services/rosteringScheduler';
import { startPlanningAutoTrigger } from './services/planningAutoTrigger';
import { startSchedulingAutoTrigger } from './services/schedulingAutoTrigger';

const BINDING_ADDRESS = process.env.BINDING_ADDRESS || '0.0.0.0';
const PORT = ENV.PORT;

app.listen(PORT, BINDING_ADDRESS, () => {
  logger.info(`Server running on http://${BINDING_ADDRESS}:${PORT}`);
  logger.info(`Swagger docs available at http://${BINDING_ADDRESS}:${PORT}/api-docs`);
  startRosteringScheduler();
  startPlanningAutoTrigger();
  startSchedulingAutoTrigger();
});
