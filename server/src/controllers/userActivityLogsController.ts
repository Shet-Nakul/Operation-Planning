import { Request, Response } from 'express';
import prisma from '../models/prisma';

export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, orgId, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (orgId) where.organization_id = Number(orgId);
    if (userId) where.user_id = Number(userId);

    const [logs, total] = await Promise.all([
      prisma.userActivityLog.findMany({
        where,
        skip,
        take: Number(limit),
        include: { user: true, organization: true },
        orderBy: { created_at: 'desc' },
      }),
      prisma.userActivityLog.count({ where }),
    ]);

    res.json({
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getActivityLogById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const log = await prisma.userActivityLog.findUnique({
      where: { id: Number(id) },
      include: { user: true, organization: true },
    });
    if (!log) return res.status(404).json({ error: 'Activity log not found' });
    res.json(log);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteActivityLog(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.userActivityLog.delete({
      where: { id: Number(id) },
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
