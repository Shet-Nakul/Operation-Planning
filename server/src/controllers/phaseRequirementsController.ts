import { Request, Response } from 'express';
import { PhaseRequirementsService } from '../services/phaseRequirementsService';

const service = new PhaseRequirementsService();

export async function listPhaseRequirements(req: Request, res: Response) {
  const { search } = req.query;
  const actor = req.user;
  const orgId = actor.role === 'SUPER_ADMIN' ? undefined : actor.organization_id;
  const phases = await service.list({ search: search as string, organizationId: orgId });
  res.json(phases);
}

export async function getPhaseRequirement(req: Request, res: Response) {
  const phase = await service.get(Number(req.params.id));
  if (!phase) return res.status(404).json({ error: 'Not found' });
  res.json(phase);
}

export async function createPhaseRequirement(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const phase = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(phase);
}

export async function updatePhaseRequirement(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const phase = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(phase);
}

export async function deletePhaseRequirement(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const phase = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(phase);
}
