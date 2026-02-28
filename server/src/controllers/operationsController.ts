import { Request, Response } from 'express';
import { OperationsService } from '../services/operationsService';

const service = new OperationsService();

export async function listOperations(req: Request, res: Response) {
  const { skip, take, search, status } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
  const operations = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search as string, status: status as string, organizationId: orgId });
  res.json(operations);
}

export async function getOperation(req: Request, res: Response) {
  const operation = await service.get(Number(req.params.id));
  if (!operation) return res.status(404).json({ error: 'Not found' });
  res.json(operation);
}

export async function createOperation(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const operation = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(operation);
}

export async function updateOperation(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const operation = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(operation);
}

export async function deleteOperation(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const operation = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(operation);
}
