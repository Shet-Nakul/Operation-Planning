import { Request, Response } from 'express';
import { OperationTypesService } from '../services/operationTypesService';

const service = new OperationTypesService();

export async function listOperationTypes(req: Request, res: Response) {
  const { search } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
  const types = await service.list({ search: search as string, organizationId: orgId });
  res.json(types);
}

export async function getOperationType(req: Request, res: Response) {
  const type = await service.get(Number(req.params.id));
  if (!type) return res.status(404).json({ error: 'Not found' });
  res.json(type);
}

export async function createOperationType(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const type = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(type);
}

export async function updateOperationType(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const type = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(type);
}

export async function deleteOperationType(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const type = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(type);
}
