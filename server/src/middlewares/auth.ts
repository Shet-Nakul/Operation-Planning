import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

export const SUPER_ADMIN_ROLE = 'SUPERADMIN';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    role: string;
    organization_id: number | null; // null for super-admins not tied to a specific org
  };
}

// organization_id and role are now embedded in the JWT — no extra DB lookup required.
export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      role: decoded.role,
      organization_id: decoded.organization_id ?? null,
    };
    next();
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
