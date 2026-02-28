import { Request, Response } from 'express';
import { ResourceAvailabilityWindowsService } from '../services/resourceAvailabilityWindowsService';

const service = new ResourceAvailabilityWindowsService();

export async function listResourceAvailabilityWindows(req: Request, res: Response) {
  const { dailyCapacityId, isExtended } = req.query;
  const windows = await service.list({
    dailyCapacityId: dailyCapacityId ? Number(dailyCapacityId) : undefined,
    isExtended: isExtended === 'true' ? true : isExtended === 'false' ? false : undefined
  });
  res.json(windows);
}

export async function getResourceAvailabilityWindow(req: Request, res: Response) {
  const win = await service.get(Number(req.params.id));
  if (!win) return res.status(404).json({ error: 'Not found' });
  res.json(win);
}

export async function createResourceAvailabilityWindow(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const win = await service.create(req.body, actor, ip, userAgent);
  res.status(201).json(win);
}

export async function updateResourceAvailabilityWindow(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const win = await service.update(Number(req.params.id), req.body, actor, ip, userAgent);
  res.json(win);
}

export async function deleteResourceAvailabilityWindow(req: Request, res: Response) {
  const actor = req.user;
  const ip = req.ip ?? "";
  const userAgent = req.headers['user-agent'] || '';
  const win = await service.delete(Number(req.params.id), actor, ip, userAgent);
  res.json(win);
}
