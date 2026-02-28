import { Request, Response } from 'express';
import { UsersService } from '../services/usersService';

const service = new UsersService();

export async function listUsers(req: Request, res: Response) {
  const { skip, take, search } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
  const users = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search as string, organizationId: orgId });
  res.json(users);
}

export async function getUser(req: Request, res: Response) {
  const user = await service.get(Number(req.params.id));
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
}

export async function createUser(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? '';
  const userAgent = req.headers['user-agent'] || '';
  const user = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(user);
}

export async function updateUser(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? '';
  const userAgent = req.headers['user-agent'] || '';
  const user = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? '';
  const userAgent = req.headers['user-agent'] || '';
  const user = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(user);
}
