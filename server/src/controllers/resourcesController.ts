import { Request, Response } from 'express';
import { ResourcesService } from '../services/resourcesService';

const service = new ResourcesService();

export async function listResources(req: Request, res: Response) {
  const { skip, take, search } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
  const resources = await service.list({ skip: Number(skip) || 0, take: Number(take) || 20, search: search as string, organizationId: orgId });
  res.json(resources);
}

export async function getResource(req: Request, res: Response) {
  const resource = await service.get(Number(req.params.id));
  if (!resource) return res.status(404).json({ error: 'Not found' });
  res.json(resource);
}

export async function createResource(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const resource = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(resource);
}

export async function updateResource(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const resource = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(resource);
}

export async function deleteResource(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const resource = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(resource);
}
