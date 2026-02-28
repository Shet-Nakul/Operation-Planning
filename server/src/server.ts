import dotenv from 'dotenv';
import app from './app';
import logger from './config/logger';

dotenv.config();

const PORT: number = Number(process.env.PORT) || 3333;
const IP: string = process.env.IP || '127.0.0.1';

app.listen(PORT, IP, () => {
  logger.info(`Server running on http://${IP}:${PORT}`);
  logger.info(`Swagger docs available at http://${IP}:${PORT}/api-docs`);
});