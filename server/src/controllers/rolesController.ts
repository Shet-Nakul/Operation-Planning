import { Request, Response } from 'express';
import { RolesService } from '../services/rolesService';

const service = new RolesService();

export async function listRoles(req: Request, res: Response) {
  const roles = await service.list();
  res.json(roles);
}

export async function getRole(req: Request, res: Response) {
  const role = await service.get(Number(req.params.id));
  if (!role) return res.status(404).json({ error: 'Not found' });
  res.json(role);
}

export async function createRole(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const role = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(role);
}

export async function updateRole(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const role = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(role);
}

export async function deleteRole(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const role = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(role);
}
