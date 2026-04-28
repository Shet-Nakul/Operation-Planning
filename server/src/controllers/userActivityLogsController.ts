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
