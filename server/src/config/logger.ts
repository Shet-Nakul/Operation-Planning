import winston from 'winston';
import { ENV } from './env'; // adjust path

const logger = winston.createLogger({
  level: ENV.LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      level: ENV.LOG_LEVEL
    })
  ]
});

export default logger;
