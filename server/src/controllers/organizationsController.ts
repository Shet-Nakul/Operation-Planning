import { Request, Response } from 'express';
import { OrganizationsService } from '../services/organizationsService';

const service = new OrganizationsService();

interface AuthenticatedRequest extends Request {
  user?: any; // Replace 'any' with your actual user type if available
}

export async function listOrganizations(req: Request, res: Response) {
  const { skip, take, search } = req.query;
  const actor = (req as AuthenticatedRequest).user;
  const orgId = actor && actor.role === 'SUPER_ADMIN' ? undefined : actor?.organization_id;
  const orgs = await service.list({
    skip: Number(skip) || 0,
    take: Number(take) || 20,
    search: typeof search === 'string' ? search : '',
    organizationId: orgId
  });
  res.json(orgs);
}

export async function getOrganization(req: Request, res: Response) {
  const org = await service.get(Number(req.params.id));
  if (!org) return res.status(404).json({ error: 'Not found' });
  res.json(org);
}

export async function createOrganization(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const ip = req.ip ?? '';
  const userAgent = String(req.headers['user-agent'] ?? '');
  const org = await service.create(req.body, user, ip, userAgent);
  res.status(201).json(org);
}

export async function updateOrganization(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const ip = req.ip ?? '';
  const userAgent = String(req.headers['user-agent'] ?? '');
  const org = await service.update(Number(req.params.id), req.body, user, ip, userAgent);
  res.json(org);
}

export async function deleteOrganization(req: Request, res: Response) {
  const user = (req as AuthenticatedRequest).user;
  const ip = req.ip ?? '';
  const userAgent = String(req.headers['user-agent'] ?? '');
  const org = await service.delete(Number(req.params.id), user, ip, userAgent);
  res.json(org);
}