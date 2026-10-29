import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import logger from '../config/logger';
import { z } from 'zod';

const authService = new AuthService();

export async function changePassword(req: Request, res: Response) {
  try {
    const input = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(10).max(128) }).parse(req.body);
    await authService.changePassword((req as any).user.id, input.currentPassword, input.newPassword);
    res.json({ success: true, message: 'Password changed. Sign in again with your new password.' });
  } catch (error: any) {
    res.status(400).json({ error: error instanceof z.ZodError ? error.issues.map((issue: any) => issue.message).join(', ') : error.message });
  }
}

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
