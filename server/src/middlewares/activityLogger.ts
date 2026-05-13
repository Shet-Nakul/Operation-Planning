import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Middleware version for app.use()
export async function logActivity(req: Request, res: Response, next: NextFunction) {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const userId = (req as any).user?.id || null;
    const orgId = req.body.organization_id || null;
    const entityType = req.baseUrl.split('/')[1];
    const entityId = req.body.id?.toString() || null;
    await prisma.userActivityLog.create({
      data: {
        user_id: userId,
        organization_id: orgId,
        action: req.method,
        entity: entityType,
        entity_id: entityId,
        metadata: req.body
      }
    });
  }
  next();
}

// Utility version for calling directly from services
export async function logActivityDirect(req: Request, action: string, entityType: string) {
  const userId = (req as any).user?.id || null;
  const orgId = req.body.organization_id || null;
  const entityId = req.body.id?.toString() || null;
  await prisma.userActivityLog.create({
    data: {
      user_id: userId,
      organization_id: orgId,
      action: action,
      entity: entityType,
      entity_id: entityId,
      metadata: req.body
    }
  });
}