import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import logger from '../config/logger';

const authService = new AuthService();

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err: any) {
    logger.error('Error in login', err);
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
}

export async function register(req: Request, res: Response) {
  try {
    // In a real app, you might want to restrict registration to ADMINs
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user, message: 'User registered successfully' });
  } catch (err: any) {
    logger.error('Error in register', err);
    res.status(400).json({ error: err.message || 'Failed to register user' });
  }
}

export async function refresh(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }
    const result = await authService.refresh(refreshToken);
    res.json({ success: true, ...result });
  } catch (err: any) {
    logger.error('Error in refresh', err);
    res.status(401).json({ error: err.message || 'Invalid refresh token' });
  }
}
