import { Request, Response } from 'express';

interface AuthRequest extends Request {
  user?: {
    id?: string;
    organization_id?: string;
    [key: string]: any;
  };
}
import { AuthService } from '../services/authService';

const authService = new AuthService();

export async function login(req: AuthRequest, res: Response) {
  try {
    const { email = '', password = '' } = req.body;
    const ip = req.ip || '';
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';
    const result = await authService.login(email, password, ip, userAgent);
    res.json({ accessToken: result.accessToken, user: result.user });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const actorRaw = req.user || {};
    const actor = {
      id: typeof actorRaw.id === 'string' ? parseInt(actorRaw.id, 10) : (typeof actorRaw.id === 'number' ? actorRaw.id : 0),
      role: typeof actorRaw.role === 'string' ? actorRaw.role : '',
    };
    const ip = req.ip || '';
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';
    const user = await authService.register(req.body, actor, ip, userAgent);
    res.status(201).json({ user });
  } catch (err: any) {
    res.status(403).json({ error: err.message });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id ? Number(req.user.id) : 0;
    const orgId = req.user?.organization_id ? Number(req.user.organization_id) : 0;
    const ip = req.ip || '';
    const userAgent = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : '';
    await authService.logout(userId, orgId, ip, userAgent);
    res.json({ message: 'Logged out' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
