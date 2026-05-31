import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import prisma from '../models/prisma';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    organization_id: number;
  };
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    
    // Fetch user to get organization_id
    prisma.user.findUnique({ where: { id: decoded.id } })
      .then(user => {
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        req.user = {
          id: decoded.id,
          role: decoded.role,
          organization_id: user.organization_id as number
        };
        next();
      })
      .catch(err => {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
      });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired access token' });
  }
}

export function authorizeRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}
