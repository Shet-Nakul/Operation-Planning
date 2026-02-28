import { Request, Response } from 'express';
import { PlanningGlobalConfigService } from '../services/planningGlobalConfigService';

const service = new PlanningGlobalConfigService();

export async function listPlanningGlobalConfigs(req: Request, res: Response) {
  const { organizationId, isActive } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? Number(organizationId) || undefined : actor.organization_id;
  const configs = await service.list({ organizationId: orgId, isActive: isActive === 'true' });
  res.json(configs);
}

export async function getPlanningGlobalConfig(req: Request, res: Response) {
  const config = await service.get(Number(req.params.id));
  if (!config) return res.status(404).json({ error: 'Not found' });
  res.json(config);
}

export async function createPlanningGlobalConfig(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const config = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(config);
}

export async function updatePlanningGlobalConfig(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const config = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(config);
}

export async function deletePlanningGlobalConfig(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const config = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(config);
}
