import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Extend Request type to allow user property
  const user = (req as any).user || null;
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user
  });
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
}
