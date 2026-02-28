import { Request, Response } from 'express';
import { ResourceDailyCapacityService } from '../services/resourceDailyCapacityService';

const service = new ResourceDailyCapacityService();

export async function listResourceDailyCapacities(req: Request, res: Response) {
  const { organizationId, resourceId, dayNumber } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? Number(organizationId) || undefined : actor.organization_id;
  const capacities = await service.list({ organizationId: orgId, resourceId: resourceId ? Number(resourceId) : undefined, dayNumber: dayNumber ? Number(dayNumber) : undefined });
  res.json(capacities);
}

export async function getResourceDailyCapacity(req: Request, res: Response) {
  const capacity = await service.get(Number(req.params.id));
  if (!capacity) return res.status(404).json({ error: 'Not found' });
  res.json(capacity);
}

export async function createResourceDailyCapacity(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const capacity = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(capacity);
}

export async function updateResourceDailyCapacity(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const capacity = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(capacity);
}

export async function deleteResourceDailyCapacity(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const capacity = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(capacity);
}
