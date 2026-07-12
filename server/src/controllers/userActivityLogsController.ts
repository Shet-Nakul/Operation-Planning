import { Request, Response } from 'express';
import prisma from '../models/prisma';
import { getOrgFilter } from '../utils/getOrgFilter';

export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { page = 1, limit = 20, userId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { ...getOrgFilter(req) };
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
      success: true,
      data: logs,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve activity logs' });
  }
}

export async function getActivityLogById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const log = await prisma.userActivityLog.findUnique({
      where: { id: Number(id) },
      include: { user: true, organization: true },
    });
    if (!log) return res.status(404).json({ success: false, error: 'Activity log not found' });
    res.json({ success: true, data: log });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to retrieve activity log' });
  }
}

export async function deleteActivityLog(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await prisma.userActivityLog.findUnique({ where: { id: Number(id) } });
    if (!existing) return res.status(404).json({ success: false, error: 'Activity log not found' });

    await prisma.userActivityLog.delete({ where: { id: Number(id) } });
    res.json({ success: true, message: 'Activity log deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: 'Failed to delete activity log' });
  }
}
